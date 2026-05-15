import type { RowData, ColumnDef } from '@zvndev/yable-core'

export interface RowNumberColumnOptions {
  id?: string
  header?: string
  size?: number
  startFrom?: number
}

export function rowNumberColumn<TData extends RowData>(
  options: RowNumberColumnOptions = {},
): ColumnDef<TData, unknown> {
  const { id = '_rowNumber', header = '#', size = 50, startFrom = 1 } = options
  return {
    id,
    header,
    cell: ({ row }) => row.index + startFrom,
    size,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
    enableReorder: false,
    lockVisible: true,
  } as ColumnDef<TData, unknown>
}
