'use client';
import { useState, useCallback } from 'react';

interface ReminderResult {
  notified: string[];
  count: number;
  message: string;
}

interface ReminderStatusCardProps {
  className?: string;
}

/**
 * ReminderStatusCard — Safety Officer dashboard card.
 * Shows license reminder status and allows manual trigger.
 * Calls POST /api/reminders/trigger to send reminders immediately.
 */
export function ReminderStatusCard({ className = '' }: ReminderStatusCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ReminderResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const handleTrigger = useCallback(async () => {
    setStatus('loading');
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/reminders/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setResult(data);
        setLastRun(new Date());
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Unknown error');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Could not reach the server.');
    }
  }, []);

  const handleTestEmail = useCallback(async () => {
    setTestStatus('loading');
    setTestMsg(null);
    try {
      const res = await fetch('/api/reminders/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestMsg(data.message);
      } else {
        setTestStatus('error');
        setTestMsg(data.error ?? 'Failed to send test email.');
      }
    } catch {
      setTestStatus('error');
      setTestMsg('Network error.');
    }
  }, [testEmail]);

  return (
    <div
      id="reminder-status-card"
      className={`
        bg-[var(--surface)] border border-[var(--border)] rounded-xl
        shadow-[var(--shadow-sm)] overflow-hidden
        ${className}
      `}
      role="region"
      aria-label="License Reminder Control"
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
        <div className="
          flex items-center justify-center w-9 h-9 rounded-lg
          bg-[var(--warning-light)] text-[var(--warning)]
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">License Expiry Reminders</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Auto-sends daily at 08:00 to drivers expiring in ≤ 30 days
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Cron status banner */}
        <div className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-[var(--success-light)] text-[var(--success)]
          text-xs font-medium
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="12" />
            <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Cron job active — runs daily at 08:00
          {lastRun && (
            <span className="ml-auto text-[var(--text-muted)]">
              Last run: {lastRun.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Manual trigger */}
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-2 font-medium">Manual Trigger</p>
          <button
            id="trigger-reminders-btn"
            type="button"
            onClick={handleTrigger}
            disabled={status === 'loading'}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-2.5 text-sm font-medium rounded-lg
              bg-[var(--warning)] text-white
              hover:bg-[var(--warning)]/90
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {status === 'loading' ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Checking drivers...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send Reminders Now
              </>
            )}
          </button>

          {/* Trigger result */}
          {status === 'success' && result && (
            <div role="status" className="mt-3 p-3 rounded-lg bg-[var(--success-light)] text-[var(--success)] text-sm">
              <p className="font-medium">{result.message}</p>
              {result.notified.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {result.notified.map((name) => (
                    <li key={name} className="text-xs flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--success)] inline-block" />
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {status === 'error' && (
            <div role="alert" className="mt-3 p-3 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Test email divider */}
        <div className="border-t border-[var(--border)] pt-4">
          <p className="text-xs text-[var(--text-secondary)] mb-2 font-medium">Test Email Pipeline</p>
          <div className="flex gap-2">
            <input
              id="test-email-input"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={process.env.NEXT_PUBLIC_TEST_EMAIL ?? 'Enter recipient email...'}
              className="
                flex-1 px-3 py-2 text-sm rounded-lg
                border border-[var(--border)] bg-[var(--surface)]
                text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--border-focus)]
              "
            />
            <button
              id="send-test-email-btn"
              type="button"
              onClick={handleTestEmail}
              disabled={testStatus === 'loading'}
              className="
                px-3 py-2 text-sm font-medium rounded-lg
                bg-[var(--accent)] text-white
                hover:bg-[var(--accent-hover)]
                disabled:opacity-60 transition-colors whitespace-nowrap
              "
            >
              {testStatus === 'loading' ? 'Sending...' : 'Send Test'}
            </button>
          </div>

          {testMsg && (
            <div
              role={testStatus === 'error' ? 'alert' : 'status'}
              className={`mt-2 p-2.5 rounded-lg text-xs ${
                testStatus === 'success'
                  ? 'bg-[var(--success-light)] text-[var(--success)]'
                  : 'bg-[var(--danger-light)] text-[var(--danger)]'
              }`}
            >
              {testMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
