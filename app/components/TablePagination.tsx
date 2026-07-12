'use client';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * TablePagination — page controls with page-size selector and record count.
 */
export function TablePagination({
  page,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}: TablePaginationProps) {
  const start = Math.min((page - 1) * pageSize + 1, totalCount);
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div
      className={`
        flex flex-col sm:flex-row items-center justify-between
        gap-3 px-4 py-3
        border-t border-[var(--border)] bg-[var(--surface)]
        text-sm text-[var(--text-secondary)]
        ${className}
      `}
      role="navigation"
      aria-label="Table pagination"
    >
      {/* Record count */}
      <div className="flex items-center gap-3">
        <span>
          {totalCount === 0
            ? 'No records'
            : `Showing ${start}–${end} of ${totalCount} records`}
        </span>

        {/* Page size selector */}
        <label className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="
              text-sm bg-[var(--surface)] border border-[var(--border)]
              rounded-md px-2 py-1 text-[var(--text-primary)]
              focus:outline-none focus:border-[var(--border-focus)]
              cursor-pointer
            "
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
        <PaginationBtn
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="First page"
        >
          «
        </PaginationBtn>
        <PaginationBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </PaginationBtn>

        <span className="px-3 py-1 text-sm font-medium text-[var(--text-primary)]">
          {page} / {totalPages}
        </span>

        <PaginationBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </PaginationBtn>
        <PaginationBtn
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          aria-label="Last page"
        >
          »
        </PaginationBtn>
      </div>
    </div>
  );
}

function PaginationBtn({
  children,
  onClick,
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  [key: string]: unknown;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        w-8 h-8 flex items-center justify-center rounded-md text-sm
        border border-[var(--border)]
        text-[var(--text-secondary)] bg-[var(--surface)]
        hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors duration-150
      "
      {...rest}
    >
      {children}
    </button>
  );
}
