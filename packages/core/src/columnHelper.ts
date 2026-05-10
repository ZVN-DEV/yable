// @zvndev/yable-core — createColumnHelper

import type {
  RowData,
  ColumnDef,
  ColumnHelper,
  AccessorKeyColumnDef,
  AccessorFnColumnDef,
  DisplayColumnDef,
  GroupColumnDef,
} from './types'

export function createColumnHelper<TData extends RowData>(): ColumnHelper<TData> {
  return {
    accessor: ((
      accessorOrKey: string | ((row: TData, index: number) => unknown),
      column: Record<string, unknown>,
    ): ColumnDef<TData, unknown> => {
      if (typeof accessorOrKey === 'function') {
        return {
          ...column,
          accessorFn: accessorOrKey,
          id: column.id ?? (typeof column.header === 'string' ? column.header : undefined),
        } as unknown as AccessorFnColumnDef<TData, unknown>
      }

      return {
        ...column,
        accessorKey: accessorOrKey,
        id: column?.id ?? String(accessorOrKey),
      } as unknown as AccessorKeyColumnDef<TData, unknown>
    }) as ColumnHelper<TData>['accessor'],

    display: (column: DisplayColumnDef<TData, unknown>): ColumnDef<TData, unknown> => {
      return column
    },

    group: (column: GroupColumnDef<TData, unknown>): ColumnDef<TData, unknown> => {
      return column
    },
  }
}
