// @zvndev/yable-react — React context for table instance

import { createContext, useContext } from 'react'
import type { RowData, Table } from '@zvndev/yable-core'

const TableContext = createContext<Table<any> | null>(null)

export const TableProvider = TableContext.Provider

export function useTableContext<TData extends RowData>(): Table<TData> {
  const ctx = useContext(TableContext)
  if (!ctx) {
    throw new Error(
      '[yable E001] useTableContext must be used within a <Table> component. ' +
        'Did you forget to pass the `table` prop?',
    )
  }
  return ctx as Table<TData>
}
