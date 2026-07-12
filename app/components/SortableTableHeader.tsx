'use client';
import type { SortState } from '../hooks/useTableControls';

interface SortableThProps {
  column: string;
  label: string;
  sort: SortState;
  onSort: (column: string) => void;
  className?: string;
}

/**
 * SortableTableHeader — a <th> that shows sort arrows and handles click-cycling.
 * Cycle: none → asc → desc → none
 */
export function SortableTableHeader({
  column,
  label,
  sort,
  onSort,
  className = '',
}: SortableThProps) {
  const isActive = sort.column === column;
  const direction = isActive ? sort.direction : null;

  return (
    <th
      scope="col"
      className={`
        px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
        text-[var(--text-secondary)] select-none cursor-pointer
        hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]
        transition-colors duration-150 whitespace-nowrap
        ${isActive ? 'text-[var(--accent)]' : ''}
        ${className}
      `}
      onClick={() => onSort(column)}
      aria-sort={
        direction === 'asc'
          ? 'ascending'
          : direction === 'desc'
          ? 'descending'
          : 'none'
      }
    >
      <span className="flex items-center gap-1.5">
        {label}
        <span className="flex flex-col gap-px" aria-hidden="true">
          <svg
            width="8" height="5" viewBox="0 0 8 5"
            fill={direction === 'asc' ? 'var(--accent)' : 'var(--text-muted)'}
            className="transition-colors"
          >
            <path d="M4 0L8 5H0L4 0Z" />
          </svg>
          <svg
            width="8" height="5" viewBox="0 0 8 5"
            fill={direction === 'desc' ? 'var(--accent)' : 'var(--text-muted)'}
            className="transition-colors"
          >
            <path d="M4 5L0 0H8L4 5Z" />
          </svg>
        </span>
      </span>
    </th>
  );
}
