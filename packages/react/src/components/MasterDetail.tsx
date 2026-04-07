// @zvndev/yable-react — Master Detail Component
// Detail panel container for expanded rows with slide-down animation
// and proper accessibility semantics.

import React from 'react'
import type { RowData, Row, Table } from '@zvndev/yable-core'

interface MasterDetailProps<TData extends RowData> {
  row: Row<TData>
  table: Table<TData>
  /** Number of columns to span (full table width) */
  colSpan: number
  /** Custom render function for the detail panel */
  renderDetailPanel?: (row: Row<TData>) => React.ReactNode
  /** Optional animation class */
  animationClass?: string
}

export function MasterDetail<TData extends RowData>({
  row,
  table,
  colSpan,
  renderDetailPanel,
  animationClass,
}: MasterDetailProps<TData>) {
  // Determine what to render in the detail panel
  const renderer =
    renderDetailPanel ?? (table.options as any).renderDetailPanel

  if (!renderer) return null

  const content = renderer(row)
  if (content == null) return null

  const classes = [
    'yable-detail-row',
    'yable-detail-row--animated',
    animationClass,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <tr
      className={classes}
      data-detail-for={row.id}
      role="row"
      aria-label={`Details for row ${row.id}`}
    >
      <td className="yable-detail-cell" colSpan={colSpan} role="cell">
        <div className="yable-detail-panel">
          <div className="yable-detail-panel-inner">
            {content}
          </div>
        </div>
      </td>
    </tr>
  )
}
