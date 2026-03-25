// @yable/react — Pagination Component

import type { RowData, Table } from '@yable/core'

interface PaginationProps<TData extends RowData> {
  table: Table<TData>
  /** Show page size selector */
  showPageSize?: boolean
  /** Available page sizes */
  pageSizes?: number[]
  /** Show row count info */
  showInfo?: boolean
  /** Show first/last buttons */
  showFirstLast?: boolean
}

export function Pagination<TData extends RowData>({
  table,
  showPageSize = true,
  pageSizes = [10, 20, 50, 100],
  showInfo = true,
  showFirstLast = true,
}: PaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const totalRows = table.getPrePaginationRowModel().rows.length
  const from = pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="yable-pagination">
      {showInfo && (
        <div className="yable-pagination-info">
          <span>
            {totalRows > 0
              ? `${from}\u2013${to} of ${totalRows}`
              : 'No results'}
          </span>
          {showPageSize && (
            <select
              className="yable-pagination-select"
              value={pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="yable-pagination-pages">
        {showFirstLast && (
          <button
            className="yable-pagination-btn"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <button
          className="yable-pagination-btn"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 3L4.5 7L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {getPageNumbers(pageIndex, pageCount).map((page, i) =>
          page === -1 ? (
            <span key={`ellipsis-${i}`} className="yable-pagination-btn" style={{ cursor: 'default', opacity: 0.5 }}>
              ...
            </span>
          ) : (
            <button
              key={page}
              className="yable-pagination-btn"
              data-active={page === pageIndex ? 'true' : undefined}
              onClick={() => table.setPageIndex(page)}
              aria-label={`Page ${page + 1}`}
              aria-current={page === pageIndex ? 'page' : undefined}
            >
              {page + 1}
            </button>
          )
        )}

        <button
          className="yable-pagination-btn"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5.5 3L9.5 7L5.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showFirstLast && (
          <button
            className="yable-pagination-btn"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

/** Compute which page numbers to show (with ellipsis) */
function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i)
  }

  const pages: number[] = []

  // Always show first
  pages.push(0)

  if (current > 3) {
    pages.push(-1) // ellipsis
  }

  // Window around current
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 4) {
    pages.push(-1) // ellipsis
  }

  // Always show last
  pages.push(total - 1)

  return pages
}
