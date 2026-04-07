// @zvndev/yable-react — Print Layout Component
// Renders a print-optimized version of the table that removes
// sticky positioning, virtualization, and shows all rows.
// Includes page header, timestamp, row count summary, and page-break hints.

import React from 'react'
import type { RowData, Table } from '@zvndev/yable-core'

interface PrintLayoutProps<TData extends RowData> {
  table: Table<TData>
  /** Print title displayed at the top */
  title?: string
  /** Show print timestamp */
  showTimestamp?: boolean
}

export function PrintLayout<TData extends RowData>({
  table,
  title,
  showTimestamp = true,
}: PrintLayoutProps<TData>) {
  // Get all rows (bypass pagination)
  const allRows = table.getPrePaginationRowModel().rows
  const headerGroups = table.getHeaderGroups()
  const timestamp = new Date().toLocaleString()

  return (
    <div className="yable-print-layout">
      {/* Print header with title and metadata */}
      {(title || showTimestamp) && (
        <div className="yable-print-header">
          {title && <h2 className="yable-print-title">{title}</h2>}
          {showTimestamp && (
            <span className="yable-print-timestamp">
              Printed: {timestamp}
            </span>
          )}
        </div>
      )}

      {/* Summary line before the table */}
      <div className="yable-print-summary">
        <span className="yable-print-summary-text">
          {allRows.length.toLocaleString()} row{allRows.length !== 1 ? 's' : ''}
        </span>
      </div>

      <table className="yable-print-table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} className="yable-print-thead-row">
              {headerGroup.headers.map((header) => {
                const headerContent = header.isPlaceholder
                  ? null
                  : typeof header.column.columnDef.header === 'function'
                    ? (header.column.columnDef.header as Function)(header.getContext())
                    : header.column.columnDef.header ?? header.id

                return (
                  <th key={header.id} colSpan={header.colSpan} className="yable-print-th">
                    {headerContent}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {allRows.map((row, index) => (
            <tr
              key={row.id}
              className={`yable-print-tr${index % 2 === 1 ? ' yable-print-tr--alt' : ''}`}
            >
              {row.getVisibleCells().map((cell) => {
                const cellDef = cell.column.columnDef.cell
                const content = typeof cellDef === 'function'
                  ? (cellDef as Function)(cell.getContext())
                  : cell.renderValue()

                return (
                  <td key={cell.id} className="yable-print-td">
                    {content as React.ReactNode}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Print footer */}
      <div className="yable-print-footer">
        <span className="yable-print-footer-count">
          Total: {allRows.length.toLocaleString()} row{allRows.length !== 1 ? 's' : ''}
        </span>
        {showTimestamp && (
          <span className="yable-print-footer-timestamp">{timestamp}</span>
        )}
      </div>
    </div>
  )
}
