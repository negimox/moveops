'use client';

interface Chip {
  column: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  /** Map of active filters: column → value */
  filters: Record<string, string>;
  /** Human-readable label for each column key */
  columnLabels?: Record<string, string>;
  onRemove: (column: string) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * FilterChips — displays active filters as dismissible pill chips.
 * Shows a "Clear all" button when ≥2 filters are active.
 */
export function FilterChips({
  filters,
  columnLabels = {},
  onRemove,
  onClearAll,
  className = '',
}: FilterChipsProps) {
  const chips: Chip[] = Object.entries(filters)
    .filter(([, v]) => Boolean(v))
    .map(([col, val]) => ({
      column: col,
      label: columnLabels[col] ?? col.replace(/_/g, ' '),
      value: val,
    }));

  if (chips.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      role="list"
      aria-label="Active filters"
    >
      <span className="text-xs font-medium text-[var(--text-muted)] mr-1">Filters:</span>

      {chips.map((chip) => (
        <span
          key={chip.column}
          role="listitem"
          className="
            inline-flex items-center gap-1.5 px-2.5 py-1
            text-xs font-medium rounded-full
            bg-[var(--accent-light)] text-[var(--accent-text)]
            border border-[var(--accent)]/20
          "
        >
          <span className="text-[var(--text-muted)] capitalize">{chip.label}:</span>
          <span className="font-semibold">{chip.value}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.column)}
            aria-label={`Remove ${chip.label} filter`}
            className="
              ml-0.5 rounded-full hover:bg-[var(--accent)]/20
              text-[var(--accent-text)] hover:text-[var(--accent)]
              transition-colors p-0.5
            "
          >
            <svg width="10" height="10" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      {chips.length >= 2 && (
        <button
          type="button"
          onClick={onClearAll}
          className="
            text-xs text-[var(--danger)] hover:text-[var(--danger)]/80
            font-medium transition-colors underline-offset-2 hover:underline
          "
        >
          Clear all
        </button>
      )}
    </div>
  );
}
