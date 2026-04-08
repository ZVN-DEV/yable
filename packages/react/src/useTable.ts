// @zvndev/yable-react — useTable hook

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import {
  createTable,
  functionalUpdate,
  type RowData,
  type TableOptions,
  type TableOptionsResolved,
  type TableState,
  type Table,
  type Updater,
} from '@zvndev/yable-core'

/**
 * Shallow-compare two objects. Returns true if all own keys are strictly equal.
 */
function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (a === b) return true
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if ((a as any)[key] !== (b as any)[key]) return false
  }
  return true
}

/**
 * React hook that wraps the framework-agnostic core table engine.
 *
 * Returns a stable {@link Table} instance whose `state` reflects either
 * the consumer's controlled `options.state` or the hook's internal state.
 *
 * Re-renders are triggered by `setState` from the default `onStateChange`
 * implementation. Consumers may pass their own `onStateChange` to control
 * state externally.
 *
 * Gotcha: `options.onStateChange` is captured via a latest-ref, so a fresh
 * function identity from the parent is always invoked — even if every other
 * option key is shallow-equal to the previous render.
 */
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
    commits: { cells: {}, nextOpId: 1 },
    keyboardNavigation: { focusedCell: null },
    undoRedo: { undoStack: [], redoStack: [], maxSize: 50 },
    fillHandle: { isDragging: false },
    formulas: { enabled: false, formulas: {}, computedValues: {}, errors: {} },
    rowDrag: { draggingRowId: null, overRowId: null, dropPosition: null },
    pivot: {
      enabled: false,
      config: { rowFields: [], columnFields: [], valueFields: [] },
      expandedRowGroups: {},
      expandedColumnGroups: {},
    },
    ...options.initialState,
    ...options.state,
  }))

  const stateRef = useRef(state)
  stateRef.current = state

  // Track previous options to avoid recomputing when consumer passes
  // a structurally identical but referentially new options object
  const prevOptionsRef = useRef(options)
  const stableOptions = useMemo(() => {
    if (shallowEqual(prevOptionsRef.current as any, options as any)) {
      return prevOptionsRef.current
    }
    prevOptionsRef.current = options
    return options
  }, [options])

  // Latest-ref for onStateChange so the wrapper always invokes the freshest
  // callback identity, even when every other key in `options` is shallow-equal
  // (which would otherwise leave `stableOptions` referentially identical and
  // mask a new function identity from the parent).
  const onStateChangeRef = useRef(options.onStateChange)
  onStateChangeRef.current = options.onStateChange

  const resolvedState = useMemo(
    () => ({
      ...state,
      ...stableOptions.state,
    }),
    [state, stableOptions.state]
  )

  const onStateChange = useCallback(
    (updater: Updater<TableState>) => {
      const latest = onStateChangeRef.current
      if (latest) {
        latest(updater)
      } else {
        setState((prev) => functionalUpdate(updater, prev))
      }
    },
    []
  )

  const resolvedOptions: TableOptions<TData> = useMemo(
    () => ({
      ...stableOptions,
      state: resolvedState,
      onStateChange,
    }),
    [stableOptions, resolvedState, onStateChange]
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

  // Clean up event listeners on unmount to prevent memory leaks in SPAs
  useEffect(() => {
    return () => {
      if (tableRef.current) {
        tableRef.current.events.removeAllListeners()
      }
    }
  }, [])

  return tableRef.current
}
