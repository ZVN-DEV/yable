// @yable/react — Filters Panel Component
// Summary of active filters with edit/remove capabilities.

import React from 'react'
import type { RowData, Table } from '@yable/core'

interface FiltersPanelProps<TData extends RowData> {
  table: Table<TData>
}

export function FiltersPanel<TData extends RowData>({
  table,
}: FiltersPanelProps<TData>) {
  const columnFilters = table.getState().columnFilters
  const globalFilter = table.getState().globalFilter
  const hasFilters = columnFilters.length > 0 || Boolean(globalFilter)

  const handleRemoveColumnFilter = (columnId: string) => {
    table.setColumnFilters((prev) =>
      prev.filter((f) => f.id !== columnId)
    )
  }

  const handleClearAll = () => {
    table.resetColumnFilters(true)
    table.resetGlobalFilter(true)
  }

  return (
    <div className="yable-sidebar-panel yable-sidebar-filters">
      <div className="yable-sidebar-panel-header">
        <span className="yable-sidebar-panel-title">Active Filters</span>
        {hasFilters && (
          <button
            className="yable-sidebar-action-btn yable-sidebar-action-btn--danger"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        )}
      </div>

      {!hasFilters && (
        <div className="yable-sidebar-empty">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M4 8h24M8 16h16M12 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
          </svg>
          <span>No active filters</span>
        </div>
      )}

      <div className="yable-sidebar-filter-list">
        {/* Global filter */}
        {globalFilter && (
          <div className="yable-sidebar-filter-item">
            <div className="yable-sidebar-filter-info">
              <span className="yable-sidebar-filter-column">Global Search</span>
              <span className="yable-sidebar-filter-value">
                &ldquo;{String(globalFilter)}&rdquo;
              </span>
            </div>
            <button
              className="yable-sidebar-filter-remove"
              onClick={() => table.resetGlobalFilter(true)}
              aria-label="Remove global filter"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
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
            <div key={filter.id} className="yable-sidebar-filter-item">
              <div className="yable-sidebar-filter-info">
                <span className="yable-sidebar-filter-column">{headerName}</span>
                <span className="yable-sidebar-filter-value">
                  {String(filter.value)}
                </span>
              </div>
              <button
                className="yable-sidebar-filter-remove"
                onClick={() => handleRemoveColumnFilter(filter.id)}
                aria-label={`Remove filter for ${headerName}`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
