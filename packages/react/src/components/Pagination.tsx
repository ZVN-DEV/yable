// @zvndev/yable-react — Pagination Component
// Polished page navigation with SVG icons, page size selector, and row info.

import type { RowData, Table } from '@zvndev/yable-core'
import { getDefaultLocale } from '@zvndev/yable-core'

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

/** Chevron-left icon for Previous */
function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M8.5 3L4.5 7L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Chevron-right icon for Next */
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5.5 3L9.5 7L5.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Double-chevron-left icon for First Page */
function ChevronFirstIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 3L5.5 7L9.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Double-chevron-right icon for Last Page */
function ChevronLastIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M4.5 3L8.5 7L4.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Small chevron for the page size select dropdown */
function SelectChevronIcon() {
  return (
    <svg className="yable-pagination-select-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
  const canPrev = table.getCanPreviousPage()
  const canNext = table.getCanNextPage()
  const locale = getDefaultLocale()

  return (
    <nav className="yable-pagination" role="navigation" aria-label="Table pagination">
      {/* Row info and page size selector */}
      {showInfo && (
        <div className="yable-pagination-info">
          <span className="yable-pagination-info-text">
            {totalRows > 0
              ? `${from}\u2013${to} ${locale.paginationOf} ${totalRows}`
              : locale.paginationNoResults}
          </span>
          {showPageSize && (
            <div className="yable-pagination-select-wrapper">
              <select
                className="yable-pagination-select"
                value={pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                aria-label="Rows per page"
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size} {locale.paginationRows}
                  </option>
                ))}
              </select>
              <SelectChevronIcon />
            </div>
          )}
        </div>
      )}

      {/* Page navigation buttons */}
      <div className="yable-pagination-pages">
        {showFirstLast && (
          <button
            type="button"
            className="yable-pagination-btn yable-pagination-btn--nav"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPrev}
            aria-label={locale.paginationFirstPage}
            title={locale.paginationFirstPage}
          >
            <ChevronFirstIcon />
          </button>
        )}

        <button
          type="button"
          className="yable-pagination-btn yable-pagination-btn--nav"
          onClick={() => table.previousPage()}
          disabled={!canPrev}
          aria-label={locale.paginationPreviousPage}
          title={locale.paginationPreviousPage}
        >
          <ChevronLeftIcon />
        </button>

        {/* Page number buttons with ellipsis */}
        {getPageNumbers(pageIndex, pageCount).map((page, i) =>
          page === -1 ? (
            <span
              key={`ellipsis-${i}`}
              className="yable-pagination-ellipsis"
              aria-hidden="true"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="3" cy="7" r="1" fill="currentColor" />
                <circle cx="7" cy="7" r="1" fill="currentColor" />
                <circle cx="11" cy="7" r="1" fill="currentColor" />
              </svg>
            </span>
          ) : (
            <button
              type="button"
              key={page}
              className={`yable-pagination-btn yable-pagination-btn--page${page === pageIndex ? ' yable-pagination-btn--active' : ''}`}
              data-active={page === pageIndex ? 'true' : undefined}
              onClick={() => table.setPageIndex(page)}
              aria-label={`${locale.paginationPage} ${page + 1}`}
              aria-current={page === pageIndex ? 'page' : undefined}
            >
              {page + 1}
            </button>
          )
        )}

        <button
          type="button"
          className="yable-pagination-btn yable-pagination-btn--nav"
          onClick={() => table.nextPage()}
          disabled={!canNext}
          aria-label={locale.paginationNextPage}
          title={locale.paginationNextPage}
        >
          <ChevronRightIcon />
        </button>

        {showFirstLast && (
          <button
            type="button"
            className="yable-pagination-btn yable-pagination-btn--nav"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!canNext}
            aria-label={locale.paginationLastPage}
            title={locale.paginationLastPage}
          >
            <ChevronLastIcon />
          </button>
        )}
      </div>
    </nav>
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
