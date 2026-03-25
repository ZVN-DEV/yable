// @yable/react — Table Cell Component

import React from 'react'
import type { RowData, Table, Cell } from '@yable/core'

interface TableCellProps<TData extends RowData> {
  cell: Cell<TData, unknown>
  table: Table<TData>
}

export function TableCell<TData extends RowData>({
  cell,
  table,
}: TableCellProps<TData>) {
  const column = cell.column
  const isEditing = cell.getIsEditing()
  const isAlwaysEditable = cell.getIsAlwaysEditable()
  const pinned = column.getIsPinned()

  const style: React.CSSProperties = {
    width: column.getSize(),
    minWidth: column.columnDef.minSize,
    maxWidth: column.columnDef.maxSize,
  }

  if (pinned) {
    style.position = 'sticky'
    if (pinned === 'left') {
      style.left = column.getStart('left')
    } else {
      style.right = column.getStart('right')
    }
  }

  // Determine cell content
  let content: React.ReactNode

  if (isEditing || isAlwaysEditable) {
    // Use cell renderer for edit mode (form components)
    const cellDef = column.columnDef.cell
    if (typeof cellDef === 'function') {
      content = (cellDef as Function)(cell.getContext())
    } else {
      content = cell.renderValue() as React.ReactNode
    }
  } else {
    // Read-only mode
    const cellDef = column.columnDef.cell
    if (typeof cellDef === 'function') {
      content = (cellDef as Function)(cell.getContext())
    } else {
      content = cell.renderValue() as React.ReactNode
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    table.events.emit('cell:click', {
      cell,
      row: cell.row,
      column: cell.column,
      event: e.nativeEvent,
    } as any)

    // Start editing on click if column is editable
    const editable = (column.columnDef as any).editable
    if (editable && !isAlwaysEditable && !isEditing) {
      table.startEditing(cell.row.id, column.id)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    table.events.emit('cell:dblclick', {
      cell,
      row: cell.row,
      column: cell.column,
      event: e.nativeEvent,
    } as any)
  }

  return (
    <td
      className="yable-td"
      style={style}
      data-editing={isEditing || undefined}
      data-pinned={pinned || undefined}
      data-column-id={column.id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {content}
    </td>
  )
}
