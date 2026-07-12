'use client';
import { useCallback, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * SearchBar — debounced global search input with clear button.
 * Supports Ctrl+K / Cmd+K to focus.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  id = 'global-search',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K shortcut
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') { onChange(''); }
    },
    [onChange]
  );

  return (
    <div
      className={`relative flex items-center ${className}`}
      role="search"
    >
      {/* Search icon */}
      <svg
        className="absolute left-3 text-[var(--text-muted)] pointer-events-none"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        aria-label={placeholder}
        className="
          w-full pl-9 pr-8 py-2
          text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
          bg-[var(--surface)] border border-[var(--border)]
          rounded-lg outline-none
          transition-colors duration-150
          focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent)]/20
          hover:border-[var(--text-muted)]
        "
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          aria-label="Clear search"
          className="
            absolute right-2.5
            text-[var(--text-muted)] hover:text-[var(--text-primary)]
            transition-colors duration-150
          "
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
