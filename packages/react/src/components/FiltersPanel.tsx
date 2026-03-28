// @yable/react — Filters Panel Component
// Summary of active filters with edit/remove capabilities, count badge,
// and a polished empty state illustration.

import { useCallback } from 'react'
import type { RowData, Table } from '@yable/core'

interface FiltersPanelProps<TData extends RowData> {
  table: Table<TData>
}

/** Small X icon for remove buttons */
function RemoveIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Search/globe icon for global filter badge */
function GlobalSearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** Column filter icon */
function ColumnFilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1.5 2h9L7 6v3.5L5 11V6L1.5 2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}

export function FiltersPanel<TData extends RowData>({
  table,
}: FiltersPanelProps<TData>) {
  const columnFilters = table.getState().columnFilters
  const globalFilter = table.getState().globalFilter
  const hasFilters = columnFilters.length > 0 || Boolean(globalFilter)
  const filterCount = columnFilters.length + (globalFilter ? 1 : 0)

  const handleRemoveColumnFilter = useCallback(
    (columnId: string) => {
      table.setColumnFilters((prev) =>
        prev.filter((f) => f.id !== columnId)
      )
    },
    [table]
  )

  const handleClearAll = useCallback(() => {
    table.resetColumnFilters(true)
    table.resetGlobalFilter(true)
  }, [table])

  return (
    <div className="yable-sidebar-panel yable-sidebar-filters">
      <div className="yable-sidebar-panel-header">
        <span className="yable-sidebar-panel-title">
          Active Filters
          {hasFilters && (
            <span className="yable-sidebar-filter-badge">{filterCount}</span>
          )}
        </span>
        {hasFilters && (
          <button
            type="button"
            className="yable-sidebar-action-btn yable-sidebar-action-btn--danger"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        )}
      </div>

      {!hasFilters && (
        <div className="yable-sidebar-empty">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path
              d="M5 10h30M10 20h20M15 30h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.2"
            />
            <circle cx="32" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.15" />
            <path d="M30 28l4 4M34 28l-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.15" />
          </svg>
          <span>No active filters</span>
          <span className="yable-sidebar-empty-hint">
            Filter columns using the header menu or the search bar.
          </span>
        </div>
      )}

      <div className="yable-sidebar-filter-list" role="list">
        {/* Global filter */}
        {globalFilter && (
          <div className="yable-sidebar-filter-item" role="listitem">
            <span className="yable-sidebar-filter-type-icon" aria-hidden="true">
              <GlobalSearchIcon />
            </span>
            <div className="yable-sidebar-filter-info">
              <span className="yable-sidebar-filter-column">Global Search</span>
              <span className="yable-sidebar-filter-value">
                &ldquo;{String(globalFilter)}&rdquo;
              </span>
            </div>
            <button
              type="button"
              className="yable-sidebar-filter-remove"
              onClick={() => table.resetGlobalFilter(true)}
              aria-label="Remove global filter"
              title="Remove filter"
            >
              <RemoveIcon />
            </button>
          </div>
        )}

        {/* Column filters */}
        {columnFilters.map((filter) => {
          const column = table.getColumn(filter.id)
          const headerName = column
            ? typeof column.columnDef.header === 'string'
              ? column.columnDef.header
              : column.id
            : filter.id

          return (
            <div key={filter.id} className="yable-sidebar-filter-item" role="listitem">
              <span className="yable-sidebar-filter-type-icon" aria-hidden="true">
                <ColumnFilterIcon />
              </span>
              <div className="yable-sidebar-filter-info">
                <span className="yable-sidebar-filter-column">{headerName}</span>
                <span className="yable-sidebar-filter-value">
                  {String(filter.value)}
                </span>
              </div>
              <button
                type="button"
                className="yable-sidebar-filter-remove"
                onClick={() => handleRemoveColumnFilter(filter.id)}
                aria-label={`Remove filter for ${headerName}`}
                title="Remove filter"
              >
                <RemoveIcon />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
