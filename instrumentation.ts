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
    initLicenseCron();
    console.log('[TransitOps] License expiry cron registered.');
  }
}
