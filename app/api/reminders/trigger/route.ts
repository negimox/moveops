import type { NextRequest } from 'next/server';

/**
 * POST /api/reminders/trigger
 * Manually fires the license-expiry reminder check.
 * Intended for the Safety Officer role.
 * Returns the list of driver names that were notified.
 */
export async function POST(_req: NextRequest) {
  try {
    // Dynamic import keeps the CommonJS emailReminder module out of the
    // initial bundle and avoids import-time side effects.
    const { checkAndSendReminders } = await import(
      '../../../../backend/utils/emailReminder.js'
    );

    const notified: string[] = await checkAndSendReminders();

    return Response.json({
      success: true,
      notified,
      count: notified.length,
      message:
        notified.length === 0
          ? 'No drivers have licenses expiring in the next 30 days.'
          : `Reminder sent to ${notified.length} driver(s).`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] /reminders/trigger error:', message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
