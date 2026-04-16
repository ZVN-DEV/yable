// @zvndev/yable-core — Cell range selection helpers

import type { CellRange, KeyboardNavigationCell, RowData, Table } from '../types'

export interface NormalizedCellRange {
  top: number
  right: number
  bottom: number
  left: number
}

export function createCellRange(
  start: KeyboardNavigationCell,
  end: KeyboardNavigationCell = start,
): CellRange {
  return { start, end }
}

export function normalizeCellRange(range: CellRange): NormalizedCellRange {
  return {
    top: Math.min(range.start.rowIndex, range.end.rowIndex),
    right: Math.max(range.start.columnIndex, range.end.columnIndex),
    bottom: Math.max(range.start.rowIndex, range.end.rowIndex),
    left: Math.min(range.start.columnIndex, range.end.columnIndex),
  }
}

export function getTopLeftCell(range: CellRange): KeyboardNavigationCell {
  const normalized = normalizeCellRange(range)
  return {
    rowIndex: normalized.top,
    columnIndex: normalized.left,
  }
}

export function isCellInRange(range: CellRange, rowIndex: number, columnIndex: number): boolean {
  const normalized = normalizeCellRange(range)
  return (
    rowIndex >= normalized.top &&
    rowIndex <= normalized.bottom &&
    columnIndex >= normalized.left &&
    columnIndex <= normalized.right
  )
}

export function isSingleCellRange(range: CellRange | null | undefined): boolean {
  if (!range) return false
  return (
    range.start.rowIndex === range.end.rowIndex && range.start.columnIndex === range.end.columnIndex
  )
}

export function clampCellToTable<TData extends RowData>(
  table: Table<TData>,
  cell: KeyboardNavigationCell | null | undefined,
): KeyboardNavigationCell | null {
  if (!cell) return null

  const rowCount = table.getRowModel().rows.length
  const columnCount = table.getVisibleLeafColumns().length

  if (rowCount === 0 || columnCount === 0) return null

  return {
    rowIndex: Math.min(Math.max(cell.rowIndex, 0), rowCount - 1),
    columnIndex: Math.min(Math.max(cell.columnIndex, 0), columnCount - 1),
  }
}

export function getCellSelectionKey(range: CellRange | null, isDragging: boolean): string {
  if (!range) return isDragging ? 'dragging:none' : 'none'

  const normalized = normalizeCellRange(range)
  return `${normalized.top}:${normalized.left}:${normalized.bottom}:${normalized.right}:${isDragging ? 'dragging' : 'idle'}`
}
