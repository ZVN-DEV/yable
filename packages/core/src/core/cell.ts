// @yable/core — Cell Model

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
      return row.getValue(columnId) as TValue
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
      return !!(column.columnDef as any).meta?.alwaysEditable
    },
  }

  return cell
}
