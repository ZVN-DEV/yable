// @yable/react — Print Layout Component
// Renders a print-optimized version of the table that removes
// sticky positioning, virtualization, and shows all rows.

import React from 'react'
import type { RowData, Table } from '@yable/core'

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
  const columns = table.getVisibleLeafColumns()
  const headerGroups = table.getHeaderGroups()

  return (
    <div className="yable-print-layout">
      {title && (
        <div className="yable-print-header">
          <h2 className="yable-print-title">{title}</h2>
          {showTimestamp && (
            <span className="yable-print-timestamp">
              {new Date().toLocaleString()}
            </span>
          )}
        </div>
      )}

      <table className="yable-print-table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const headerContent = header.isPlaceholder
                  ? null
                  : typeof header.column.columnDef.header === 'function'
                    ? (header.column.columnDef.header as Function)(header.getContext())
                    : header.column.columnDef.header ?? header.id

                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {headerContent}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {allRows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const cellDef = cell.column.columnDef.cell
                const content = typeof cellDef === 'function'
                  ? (cellDef as Function)(cell.getContext())
                  : cell.renderValue()

                return (
                  <td key={cell.id}>
                    {content as React.ReactNode}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="yable-print-footer">
        <span>Total rows: {allRows.length}</span>
      </div>
    </div>
  )
}
