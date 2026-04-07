// @zvndev/yable-core — Cell Model

import type {
  RowData,
  Cell,
  Column,
  Row,
  Table,
  CellContext,
} from '../types'

export function createCell<TData extends RowData, TValue = unknown>(
  table: Table<TData>,
  row: Row<TData>,
  column: Column<TData, TValue>,
  columnId: string
): Cell<TData, TValue> {
  const cell: Cell<TData, TValue> = {
    id: `${row.id}_${columnId}`,
    row,
    column,

    getValue: () => {
      // Check for formula computed value first
      const rawValue = row.getValue(columnId)
      if (
        typeof rawValue === 'string' &&
        rawValue.startsWith('=') &&
        typeof table.getFormula === 'function'
      ) {
        // Formula cell: get computed value from pending values
        const pendingValue = table.getPendingValue(row.id, columnId)
        if (pendingValue !== undefined) {
          return pendingValue as TValue
        }
      }
      return rawValue as TValue
    },

    renderValue: () => {
      return cell.getValue()
    },

    getContext: (): CellContext<TData, TValue> => ({
      table,
      column,
      row,
      cell,
      getValue: cell.getValue,
      renderValue: cell.renderValue,
    }),

    getIsEditing: () => {
      const editing = table.getState().editing
      return (
        editing?.activeCell?.rowId === row.id &&
        editing?.activeCell?.columnId === columnId
      )
    },
    getIsAlwaysEditable: () => {
      return !!column.columnDef.meta?.alwaysEditable
    },

    getRowSpan: () => {
      // Row span is resolved externally via resolveRowSpans and
      // consumed by the renderer. This method provides a hook
      // for the column def's rowSpan callback if present.
      const rowSpanFn = (column.columnDef as any).rowSpan
      if (typeof rowSpanFn === 'function') {
        const rows = table.getRowModel().rows
        const rowIndex = rows.findIndex((r) => r.id === row.id)
        if (rowIndex >= 0) {
          return rowSpanFn(row, rows, rowIndex)
        }
      }
      return undefined
    },
  }

  return cell
}
