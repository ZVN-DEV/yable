// @yable/core — createColumnHelper

import type {
  RowData,
  ColumnDef,
  ColumnHelper,
  AccessorKeyColumnDef,
  AccessorFnColumnDef,
  DisplayColumnDef,
  GroupColumnDef,
} from './types'

export function createColumnHelper<
  TData extends RowData
>(): ColumnHelper<TData> {
  return {
    accessor: (
      accessorOrKey: any,
      column: any
    ): any => {
      if (typeof accessorOrKey === 'function') {
        return {
          ...column,
          accessorFn: accessorOrKey,
          id: column.id ?? (typeof column.header === 'string' ? column.header : undefined),
        } satisfies AccessorFnColumnDef<TData, any>
      }

      return {
        ...column,
        accessorKey: accessorOrKey,
        id: column?.id ?? String(accessorOrKey),
      } satisfies AccessorKeyColumnDef<TData, any>
    },

    display: (column: DisplayColumnDef<TData, unknown>): ColumnDef<TData, unknown> => {
      return column
    },

    group: (column: GroupColumnDef<TData, unknown>): ColumnDef<TData, unknown> => {
      return column
    },
  }
}
