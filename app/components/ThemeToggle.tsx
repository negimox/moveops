'use client';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  /** Optional Tailwind / utility classes to add to the root button element. */
  className?: string;
}

/**
 * ThemeToggle — animated sun ↔ moon button for TransitOps.
 *
 * - In dark mode  → shows a Sun icon  (click to go light)
 * - In light mode → shows a Moon icon (click to go dark)
 *
 * The inner <span> rotates 180 ° when the theme changes, giving a
 * smooth flip animation without any external animation library.
 * All colors reference CSS custom-property tokens so the button
 * itself adapts to whichever theme is currently active.
 *
 * Accessibility:
 *   • aria-label and title update dynamically with the current mode.
 *   • focus-visible ring uses --accent token for keyboard nav visibility.
 *   • SVG icons carry aria-hidden="true" — the button label is sufficient.
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        bg-[var(--surface-elevated)] border border-[var(--border)]
        text-[var(--text-secondary)]
        hover:text-[var(--accent)] hover:border-[var(--accent)]
        transition-all duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
        ${className}
      `}
    >
      {/* Rotation wrapper — flips 180 ° on theme change for a "spin" feel */}
      <span
        className="transition-transform duration-300 ease-in-out"
        style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}
      >
        {isDark ? (
          /* ── Sun icon (shown in dark mode; click → go light) ── */
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Centre circle */}
            <circle cx="12" cy="12" r="5" />
            {/* 8 rays */}
            <line x1="12" y1="1"     x2="12" y2="3" />
            <line x1="12" y1="21"    x2="12" y2="23" />
            <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1"  y1="12"    x2="3"  y2="12" />
            <line x1="21" y1="12"    x2="23" y2="12" />
            <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22" />
          </svg>
        ) : (
          /* ── Moon icon (shown in light mode; click → go dark) ── */
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Crescent shape */}
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}
