'use client';
import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

export interface FilterState {
  [column: string]: string;
}

export interface TableControlsConfig {
  /** Columns to search across (defaults to all string columns) */
  searchableColumns?: string[];
  /** Initial page size */
  defaultPageSize?: number;
  /** Initial sort state */
  defaultSort?: SortState;
}

export interface TableControlsReturn<T> {
  // Processed data
  processedData: T[];
  paginatedData: T[];
  totalCount: number;

  // Search
  globalSearch: string;
  setGlobalSearch: (v: string) => void;

  // Column filters
  filters: FilterState;
  setFilter: (column: string, value: string) => void;
  clearFilter: (column: string) => void;
  clearAllFilters: () => void;
  activeFilterCount: number;

  // Sort
  sort: SortState;
  cycleSort: (column: string) => void;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
}

/**
 * useTableControls — generic client-side table data hook.
 * Handles search, per-column filtering, multi-column sort, and pagination.
 *
 * Usage:
 *   const { paginatedData, ...controls } = useTableControls(myData, { defaultPageSize: 25 });
 */
export function useTableControls<T extends Record<string, unknown>>(
  data: T[],
  config: TableControlsConfig = {}
): TableControlsReturn<T> {
  const { defaultPageSize = 10, defaultSort = { column: null, direction: null } } = config;

  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [page, setPageRaw] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

  // Filtered + searched data
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Global search across all string columns
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some(
          (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q)
        )
      );
    }

    // 2. Column-level filters
    Object.entries(filters).forEach(([col, val]) => {
      if (!val) return;
      const q = val.toLowerCase();
      result = result.filter((row) => {
        const cell = row[col];
        return cell !== null && cell !== undefined && String(cell).toLowerCase().includes(q);
      });
    });

    // 3. Sort
    if (sort.column && sort.direction) {
      const col = sort.column;
      const dir = sort.direction === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        const av = a[col] ?? '';
        const bv = b[col] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * dir;
        }
        return String(av).localeCompare(String(bv)) * dir;
      });
    }

    return result;
  }, [data, globalSearch, filters, sort]);

  const totalCount = processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const setPage = useCallback(
    (p: number) => setPageRaw(Math.max(1, Math.min(p, totalPages))),
    [totalPages]
  );

  const setPageSize = useCallback((s: number) => {
    setPageSizeRaw(s);
    setPageRaw(1);
  }, []);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize]);

  const setFilter = useCallback((column: string, value: string) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setPageRaw(1);
  }, []);

  const clearFilter = useCallback((column: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[column];
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setGlobalSearch('');
    setPageRaw(1);
  }, []);

  const cycleSort = useCallback((column: string) => {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' };
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      return { column: null, direction: null };
    });
  }, []);

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (globalSearch.trim() ? 1 : 0);

  return {
    processedData,
    paginatedData,
    totalCount,
    globalSearch,
    setGlobalSearch: (v: string) => { setGlobalSearch(v); setPageRaw(1); },
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    activeFilterCount,
    sort,
    cycleSort,
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
  };
}
