// @zvndev/yable-core — Keyboard Navigation Feature
// Focused-cell state helpers plus spreadsheet-style navigation rules.

import { clamp } from '../utils'
import type {
  Column,
  KeyboardNavigationAction,
  KeyboardNavigationCell,
  Row,
  RowData,
  Table,
} from '../types'

export interface ResolvedKeyboardNavigationCell<TData extends RowData> {
  cell: KeyboardNavigationCell
  row: Row<TData>
  column: Column<TData, unknown>
}

function getRowsAndColumns<TData extends RowData>(table: Table<TData>): {
  rows: Row<TData>[]
  columns: Column<TData, unknown>[]
} {
  return {
    rows: table.getRowModel().rows,
    columns: table.getVisibleLeafColumns(),
  }
}

export function getFirstKeyboardCell<TData extends RowData>(
  table: Table<TData>
): KeyboardNavigationCell | null {
  const { rows, columns } = getRowsAndColumns(table)
  if (rows.length === 0 || columns.length === 0) return null
  return { rowIndex: 0, columnIndex: 0 }
}

export function getLastKeyboardCell<TData extends RowData>(
  table: Table<TData>
): KeyboardNavigationCell | null {
  const { rows, columns } = getRowsAndColumns(table)
  if (rows.length === 0 || columns.length === 0) return null
  return {
    rowIndex: rows.length - 1,
    columnIndex: columns.length - 1,
  }
}

export function normalizeFocusedCell<TData extends RowData>(
  table: Table<TData>,
  cell: KeyboardNavigationCell | null | undefined
): KeyboardNavigationCell | null {
  if (!cell) return null

  const { rows, columns } = getRowsAndColumns(table)
  if (rows.length === 0 || columns.length === 0) return null

  return {
    rowIndex: clamp(cell.rowIndex, 0, rows.length - 1),
    columnIndex: clamp(cell.columnIndex, 0, columns.length - 1),
  }
}

export function getResolvedFocusedCell<TData extends RowData>(
  table: Table<TData>,
  cell: KeyboardNavigationCell | null | undefined
): ResolvedKeyboardNavigationCell<TData> | null {
  const normalized = normalizeFocusedCell(table, cell)
  if (!normalized) return null

  const { rows, columns } = getRowsAndColumns(table)
  const row = rows[normalized.rowIndex]
  const column = columns[normalized.columnIndex]

  if (!row || !column) return null

  return {
    cell: normalized,
    row,
    column,
  }
}

export function getCellPositionByIds<TData extends RowData>(
  table: Table<TData>,
  rowId: string,
  columnId: string
): KeyboardNavigationCell | null {
  const { rows, columns } = getRowsAndColumns(table)
  const rowIndex = rows.findIndex((row) => row.id === rowId)
  const columnIndex = columns.findIndex((column) => column.id === columnId)

  if (rowIndex < 0 || columnIndex < 0) return null

  return { rowIndex, columnIndex }
}

export function canCellEnterEditMode<TData extends RowData>(
  table: Table<TData>,
  row: Row<TData>,
  column: Column<TData, unknown>
): boolean {
  if (table.options.enableCellEditing === false) return false

  const editable = (column.columnDef as { editable?: boolean | ((row: Row<TData>) => boolean) }).editable
  if (typeof editable === 'function') {
    return editable(row)
  }

  return !!editable
}

function getInitialFocusedCell<TData extends RowData>(
  table: Table<TData>,
  action: KeyboardNavigationAction
): KeyboardNavigationCell | null {
  if (action.type === 'tab' && action.shiftKey) {
    return getLastKeyboardCell(table)
  }

  if (action.type === 'end' && action.ctrlKey) {
    return getLastKeyboardCell(table)
  }

  return getFirstKeyboardCell(table)
}

function getDisplayValue<TData extends RowData>(
  table: Table<TData>,
  row: Row<TData>,
  column: Column<TData, unknown>
): unknown {
  const pending = table.getPendingValue(row.id, column.id)
  if (pending !== undefined) return pending
  return row.getValue(column.id)
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  return false
}

function getBoundaryCell<TData extends RowData>(
  table: Table<TData>,
  current: KeyboardNavigationCell,
  direction: 'up' | 'down' | 'left' | 'right'
): KeyboardNavigationCell | null {
  const { rows, columns } = getRowsAndColumns(table)
  if (rows.length === 0 || columns.length === 0) return null

  const vertical = direction === 'up' || direction === 'down'
  const step = direction === 'up' || direction === 'left' ? -1 : 1
  const currentRow = rows[current.rowIndex]
  const currentColumn = columns[current.columnIndex]

  if (!currentRow || !currentColumn) return null

  const currentValue = getDisplayValue(table, currentRow, currentColumn)
  const currentEmpty = isEmptyValue(currentValue)

  let lastIndex = vertical ? current.rowIndex : current.columnIndex
  let nextIndex = lastIndex + step
  const maxIndex = vertical ? rows.length - 1 : columns.length - 1

  while (nextIndex >= 0 && nextIndex <= maxIndex) {
    const rowIndex = vertical ? nextIndex : current.rowIndex
    const columnIndex = vertical ? current.columnIndex : nextIndex
    const row = rows[rowIndex]
    const column = columns[columnIndex]

    if (!row || !column) break

    const empty = isEmptyValue(getDisplayValue(table, row, column))

    if (currentEmpty) {
      if (!empty) {
        return { rowIndex, columnIndex }
      }

      lastIndex = nextIndex
      nextIndex += step
      continue
    }

    if (empty) {
      return vertical
        ? { rowIndex: lastIndex, columnIndex: current.columnIndex }
        : { rowIndex: current.rowIndex, columnIndex: lastIndex }
    }

    lastIndex = nextIndex
    nextIndex += step
  }

  return vertical
    ? { rowIndex: lastIndex, columnIndex: current.columnIndex }
    : { rowIndex: current.rowIndex, columnIndex: lastIndex }
}

export function getNextFocusedCell<TData extends RowData>(
  table: Table<TData>,
  current: KeyboardNavigationCell | null | undefined,
  action: KeyboardNavigationAction
): KeyboardNavigationCell | null {
  const base = normalizeFocusedCell(table, current) ?? getInitialFocusedCell(table, action)
  if (!base) return null

  const { rows, columns } = getRowsAndColumns(table)
  if (rows.length === 0 || columns.length === 0) return null

  switch (action.type) {
    case 'arrow':
      if (action.ctrlKey) {
        return getBoundaryCell(table, base, action.direction)
      }

      if (action.direction === 'up') {
        return normalizeFocusedCell(table, {
          rowIndex: base.rowIndex - 1,
          columnIndex: base.columnIndex,
        })
      }

      if (action.direction === 'down') {
        return normalizeFocusedCell(table, {
          rowIndex: base.rowIndex + 1,
          columnIndex: base.columnIndex,
        })
      }

      if (action.direction === 'left') {
        return normalizeFocusedCell(table, {
          rowIndex: base.rowIndex,
          columnIndex: base.columnIndex - 1,
        })
      }

      return normalizeFocusedCell(table, {
        rowIndex: base.rowIndex,
        columnIndex: base.columnIndex + 1,
      })

    case 'tab': {
      const flatIndex = base.rowIndex * columns.length + base.columnIndex
      const nextFlatIndex = action.shiftKey ? flatIndex - 1 : flatIndex + 1
      const clampedFlatIndex = clamp(nextFlatIndex, 0, rows.length * columns.length - 1)

      return {
        rowIndex: Math.floor(clampedFlatIndex / columns.length),
        columnIndex: clampedFlatIndex % columns.length,
      }
    }

    case 'home':
      if (action.ctrlKey) {
        return getFirstKeyboardCell(table)
      }

      return {
        rowIndex: base.rowIndex,
        columnIndex: 0,
      }

    case 'end':
      if (action.ctrlKey) {
        return getLastKeyboardCell(table)
      }

      return {
        rowIndex: base.rowIndex,
        columnIndex: columns.length - 1,
      }

    case 'page': {
      const pageDelta = action.direction === 'down' ? action.pageSize : -action.pageSize
      return normalizeFocusedCell(table, {
        rowIndex: base.rowIndex + pageDelta,
        columnIndex: base.columnIndex,
      })
    }
  }
}
