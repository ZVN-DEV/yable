// @yable/react — useTable hook

import { useState, useRef, useMemo, useCallback } from 'react'
import {
  createTable,
  functionalUpdate,
  type RowData,
  type TableOptions,
  type TableOptionsResolved,
  type TableState,
  type Table,
  type Updater,
} from '@yable/core'

export function useTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // Internal state — only used if consumer doesn't provide controlled state
  const [state, setState] = useState<TableState>(() => ({
    sorting: [],
    columnFilters: [],
    globalFilter: '',
    pagination: { pageIndex: 0, pageSize: 10 },
    rowSelection: {},
    columnVisibility: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columnSizing: {},
    columnSizingInfo: {
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false,
      columnSizingStart: [],
    },
    expanded: {},
    rowPinning: { top: [], bottom: [] },
    grouping: [],
    editing: { activeCell: undefined, pendingValues: {} },
    ...options.initialState,
    ...options.state,
  }))

  const stateRef = useRef(state)
  stateRef.current = state

  const resolvedState = useMemo(
    () => ({
      ...state,
      ...options.state,
    }),
    [state, options.state]
  )

  const onStateChange = useCallback(
    (updater: Updater<TableState>) => {
      if (options.onStateChange) {
        options.onStateChange(updater)
      } else {
        setState((prev) => functionalUpdate(updater, prev))
      }
    },
    [options.onStateChange]
  )

  const resolvedOptions: TableOptions<TData> = useMemo(
    () => ({
      ...options,
      state: resolvedState,
      onStateChange,
    }),
    [options, resolvedState, onStateChange]
  )

  // Create or update the table instance
  const tableRef = useRef<Table<TData> | null>(null)

  if (!tableRef.current) {
    tableRef.current = createTable(resolvedOptions)
  } else {
    tableRef.current.setOptions((prev) => ({
      ...prev,
      ...resolvedOptions,
      state: resolvedState,
      onStateChange,
    }) as TableOptionsResolved<TData>)
  }

  return tableRef.current
}
