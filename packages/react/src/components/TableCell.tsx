// @zvndev/yable-react — Table Cell Component

import React, { useCallback } from 'react'
import {
  canCellEnterEditMode,
  type RowData,
  type Table,
  type Cell,
} from '@zvndev/yable-core'
import { resolveCellType } from '../cells/resolver'
import { CellStatusBadge } from './CellStatusBadge'

interface TableCellProps<TData extends RowData> {
  cell: Cell<TData, unknown>
  table: Table<TData>
  rowIndex: number
  columnIndex: number
  isFocused: boolean
  isTabStop: boolean
}

export function TableCell<TData extends RowData>({
  cell,
  table,
  rowIndex,
  columnIndex,
  isFocused,
  isTabStop,
}: TableCellProps<TData>) {
  const column = cell.column
  const isEditing = cell.getIsEditing()
  const isAlwaysEditable = cell.getIsAlwaysEditable()
  const pinned = column.getIsPinned()
  const keyboardNavigationEnabled = table.options.enableKeyboardNavigation !== false

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

  // Read coordinator state — cell status + merged render value
  const cellStatus = table.getCellStatus(cell.row.id, column.id)
  const cellErrorMessage = table.getCellErrorMessage(cell.row.id, column.id)
  const cellConflictWith = table.getCellConflictWith(cell.row.id, column.id)

  // When pending/error/conflict, the rendered value is the user's typed value,
  // not the saved value
  const overrideValue =
    cellStatus !== 'idle'
      ? table.getCellRenderValue(cell.row.id, column.id)
      : undefined

  // Determine cell content
  let content: React.ReactNode
  const cellDef = column.columnDef.cell
  const cellType = column.columnDef.cellType

  if (typeof cellDef === 'function') {
    const ctx = cell.getContext()
    if (overrideValue !== undefined) {
      // Override getValue() / renderValue() for this render
      const overriddenCtx = {
        ...ctx,
        getValue: () => overrideValue,
        renderValue: () => overrideValue,
      }
      content = (cellDef as Function)(overriddenCtx)
    } else {
      content = (cellDef as Function)(ctx)
    }
  } else if (cellType && !(isEditing || isAlwaysEditable)) {
    content = resolveCellType(cellType, cell.getContext(), column.columnDef.cellTypeProps)
  } else {
    content = (overrideValue !== undefined ? overrideValue : cell.renderValue()) as React.ReactNode
  }

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      table.setFocusedCell({ rowIndex, columnIndex })

      const clickTarget = e.target as HTMLElement | null
      if (!isInteractiveClickTarget(clickTarget)) {
        const currentTarget = e.currentTarget as HTMLTableCellElement
        currentTarget.focus({ preventScroll: true })
      }

      table.events.emit('cell:click', {
        cell,
        row: cell.row,
        column: cell.column,
        event: e.nativeEvent,
      } as any)

      // Start editing on click if column is editable
      if (
        canCellEnterEditMode(table, cell.row, column) &&
        !isAlwaysEditable &&
        !isEditing
      ) {
        table.startEditing(cell.row.id, column.id)
      }
    },
    [cell, column, columnIndex, isAlwaysEditable, isEditing, rowIndex, table]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      table.events.emit('cell:dblclick', {
        cell,
        row: cell.row,
        column: cell.column,
        event: e.nativeEvent,
      } as any)
    },
    [table, cell]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      table.events.emit('cell:contextmenu', {
        cell,
        row: cell.row,
        column: cell.column,
        event: e.nativeEvent,
      } as any)
    },
    [table, cell]
  )

  const handleFocus = useCallback(() => {
    if (!keyboardNavigationEnabled) return
    table.setFocusedCell({ rowIndex, columnIndex })
  }, [columnIndex, keyboardNavigationEnabled, rowIndex, table])

  const classNames = [
    'yable-td',
    isFocused && 'yable-cell--focused',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <td
      className={classNames}
      style={style}
      data-editing={isEditing || undefined}
      data-focused={isFocused || undefined}
      data-pinned={pinned || undefined}
      data-cell-status={cellStatus !== 'idle' ? cellStatus : undefined}
      data-column-id={column.id}
      data-row-index={rowIndex}
      data-column-index={columnIndex}
      aria-rowindex={rowIndex + 1}
      aria-colindex={columnIndex + 1}
      role="gridcell"
      tabIndex={keyboardNavigationEnabled ? (isTabStop ? 0 : -1) : undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onFocus={handleFocus}
    >
      {content}
      {cellStatus === 'error' && (
        <CellStatusBadge
          status="error"
          message={cellErrorMessage}
          onRetry={() => void table.retryCommit(cell.row.id, column.id)}
          onDismiss={() => table.dismissCommit(cell.row.id, column.id)}
        />
      )}
      {cellStatus === 'conflict' && (
        <CellStatusBadge
          status="conflict"
          conflictWith={cellConflictWith}
          onRetry={() => void table.retryCommit(cell.row.id, column.id)}
          onDismiss={() => table.dismissCommit(cell.row.id, column.id)}
        />
      )}
    </td>
  )
}

function isInteractiveClickTarget(element: HTMLElement | null): boolean {
  if (!element) return false

  const interactive = element.closest(
    'input, textarea, select, button, a[href], [contenteditable="true"]'
  )

  return interactive !== null
}
