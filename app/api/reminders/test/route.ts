import type { NextRequest } from 'next/server';

/**
 * POST /api/reminders/test
 * Body: { "email": "someone@example.com" }  (optional — defaults to TEST_EMAIL env var)
 *
 * Sends a test reminder email so the admin can verify the email pipeline
 * without waiting for real drivers with expiring licenses.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined =
      typeof body?.email === 'string' && body.email.trim()
        ? body.email.trim()
        : undefined;

    const { sendTestReminder } = await import(
      '../../../../backend/utils/emailReminder.js'
    );

    const sent: boolean = await sendTestReminder(email);

    if (sent) {
      return Response.json({
        success: true,
        message: `Test reminder email sent to ${email ?? process.env.TEST_EMAIL ?? 'default address'}.`,
      });
    }

    return Response.json(
      {
        success: false,
        error:
          'Email could not be sent. Check EMAIL_USER and EMAIL_PASS in .env.',
      },
      { status: 500 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] /reminders/test error:', message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
