/**
 * instrumentation.ts — Next.js server lifecycle hook.
 * Called ONCE when the server boots. Initialises the license-expiry cron job
 * so it does not depend on an HTTP request to start.
 *
 * Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
 */
export async function register() {
  // Only run on the Node.js runtime (not Edge), because node-cron requires Node APIs.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initLicenseCron } = await import('./backend/utils/emailReminder.js');

    // ── DigiLocker DL Verification Step ──────────────────────────────────────
    // After the standard expiry-reminder check runs, we also hit the Setu
    // DigiLocker API to validate that every active driver's license is
    // currently VALID according to the government database.  Any license
    // that comes back EXPIRED or INVALID triggers an alert email to the
    // Safety Officer so the fleet team can act before the driver is assigned
    // to a trip.
    const { verifyDL } = await import('./backend/utils/digilocker');

    // Wrap the Setu verification step so a single failure never crashes the
    // entire cron — the email reminders must still fire even if DigiLocker
    // is temporarily unavailable.
    const runDLVerification = async () => {
      const db = (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          return require('./backend/db.js') as {
            query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, string>[] }>;
          };
        } catch {
          console.warn('[DigiLocker Cron] DB unavailable — skipping DL verification.');
          return null;
        }
      })();

      if (!db) return;

      try {
        // Fetch all non-suspended, active drivers that have a stored
        // DigiLocker request ID — this means the driver has already completed
        // the Setu consent flow (Step 1). Without a request ID we cannot
        // call the document endpoint (Step 2) so we skip those drivers.
        const { rows: drivers } = await db.query(`
          SELECT id, name, email, license_number, digilocker_request_id
          FROM   Drivers
          WHERE  status != 'Suspended'
          AND    license_number          IS NOT NULL
          AND    digilocker_request_id   IS NOT NULL
        `);

        if (drivers.length === 0) {
          console.log('[DigiLocker Cron] No drivers with a completed DigiLocker consent — skipping verification.');
          return;
        }

        console.log(`[DigiLocker Cron] Verifying ${drivers.length} driver(s) via Setu DigiLocker…`);

        // Safety Officer recipient — falls back to TEST_EMAIL if not set.
        const safetyOfficerEmail = process.env.SAFETY_OFFICER_EMAIL ?? process.env.TEST_EMAIL ?? '';

        const nodemailer = await import('nodemailer');
        const transporter = safetyOfficerEmail
          ? nodemailer.createTransport({
              service: process.env.EMAIL_SERVICE ?? 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
            })
          : null;

        for (const driver of drivers) {
          try {
            const result = await verifyDL(driver.license_number, driver.digilocker_request_id);

            if (result.status === 'EXPIRED' || result.status === 'INVALID') {
              console.warn(
                `[DigiLocker Cron] ⚠  Driver "${driver.name}" (${driver.license_number}) — ${result.status}`
              );

              // Alert the Safety Officer via email when a license is no
              // longer valid according to DigiLocker.
              if (transporter && safetyOfficerEmail) {
                await transporter.sendMail({
                  from: '"TransitOps Safety Officer" <no-reply@transitops.com>',
                  to: safetyOfficerEmail,
                  subject: `⚠ DigiLocker Alert: ${result.status} License — ${driver.name}`,
                  text: [
                    `SAFETY ALERT — DigiLocker Verification`,
                    ``,
                    `Driver  : ${driver.name}`,
                    `License : ${driver.license_number}`,
                    `Status  : ${result.status}`,
                    `Message : ${result.message}`,
                    ``,
                    `Please review this driver's status in the TransitOps portal and`,
                    `suspend their account if necessary before the next trip assignment.`,
                    ``,
                    `— TransitOps Automated Safety System`,
                  ].join('\n'),
                });

                console.log(
                  `[DigiLocker Cron] Alert email sent to Safety Officer for driver: ${driver.name}`
                );
              }
            } else {
              console.log(
                `[DigiLocker Cron] ✓  Driver "${driver.name}" (${driver.license_number}) — ${result.status}`
              );
            }
          } catch (driverErr) {
            // Log per-driver failures without aborting the loop.
            console.error(
              `[DigiLocker Cron] Error verifying driver "${driver.name}":`,
              driverErr
            );
          }
        }
      } catch (err) {
        console.error('[DigiLocker Cron] Unexpected error during DL verification run:', err);
      }
    };

    // ── Register the combined cron ────────────────────────────────────────────
    initLicenseCron();

    // node-cron is already initialised inside initLicenseCron(); we register an
    // independent schedule for the DigiLocker step so the two jobs can evolve
    // separately without coupling their error handling.
    const cron = await import('node-cron');
    cron.schedule('0 8 * * *', runDLVerification);

    console.log('[TransitOps] License expiry cron registered.');
    console.log('[TransitOps] DigiLocker DL verification cron registered.');
  }
}
