// @yable/react — Table Body Component

import React from 'react'
import type { RowData, Table, Row } from '@yable/core'
import { TableCell } from './TableCell'

interface TableBodyProps<TData extends RowData> {
  table: Table<TData>
  clickableRows?: boolean
}

export function TableBody<TData extends RowData>({
  table,
  clickableRows,
}: TableBodyProps<TData>) {
  const rows = table.getRowModel().rows

  return (
    <tbody className="yable-tbody">
      {rows.map((row) => (
        <TableRow
          key={row.id}
          row={row}
          table={table}
          clickable={clickableRows}
        />
      ))}
    </tbody>
  )
}

function TableRow<TData extends RowData>({
  row,
  table,
  clickable,
}: {
  row: Row<TData>
  table: Table<TData>
  clickable?: boolean
}) {
  const isSelected = row.getIsSelected()
  const isExpanded = row.getIsExpanded()
  const visibleCells = row.getVisibleCells()

  const handleClick = (e: React.MouseEvent) => {
    if (clickable) {
      table.events.emit('row:click', {
        row,
        event: e.nativeEvent,
      } as any)
    }
  }

  return (
    <>
      <tr
        className="yable-tr"
        data-selected={isSelected || undefined}
        data-expanded={isExpanded || undefined}
        data-clickable={clickable || undefined}
        data-row-id={row.id}
        onClick={handleClick}
      >
        {visibleCells.map((cell) => (
          <TableCell key={cell.id} cell={cell} table={table} />
        ))}
      </tr>

      {isExpanded && (
        <tr className="yable-expand-row">
          <td className="yable-td" colSpan={visibleCells.length}>
            {typeof (row as any)._renderExpanded === 'function'
              ? (row as any)._renderExpanded()
              : null}
          </td>
        </tr>
      )}
    </>
  )
}
