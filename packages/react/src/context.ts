// @zvndev/yable-react — React context for table instance

import { createContext, useContext } from 'react'
import type { RowData, Table } from '@zvndev/yable-core'

// React context stores table instances for any row shape; callers cast back via
// the generic context hooks below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- context must accept any table row shape
const TableContext = createContext<Table<any> | null>(null)

export const TableProvider = TableContext.Provider

export function useOptionalTableContext<TData extends RowData>(): Table<TData> | null {
  return useContext(TableContext) as Table<TData> | null
}

export function useTableContext<TData extends RowData>(): Table<TData> {
  const ctx = useOptionalTableContext<TData>()
  if (!ctx) {
    throw new Error(
      '[yable E001] useTableContext must be used within a <Table> component. ' +
        'Did you forget to pass the `table` prop?',
    )
  }
  return ctx as Table<TData>
}
