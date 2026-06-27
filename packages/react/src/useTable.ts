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
import { useYableDefaults } from './YableProvider'
import { applyYableConfigToColumns, getYableDefaultColumnDef, resolveYableProfile } from './config'
import type { YableConfig, YableTableProfile } from './config'

export type UseTableOptions<TData extends RowData> = TableOptions<TData> & {
  /** Table-local config; overrides provider config for this table instance. */
  config?: YableConfig<TData>
  /** Named profile from `YableProvider config`; overrides provider `tableProfile`. */
  configProfile?: string
}

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
export function useTable<TData extends RowData>(options: UseTableOptions<TData>): Table<TData> {
  // Merge provider-level defaultColumnDef under the table's own defaultColumnDef.
  // Table-level values always take precedence over provider defaults.
  const providerDefaults = useYableDefaults()
  const optionsWithDefaults = useMemo(() => {
    const profile = resolveYableProfile(
      options.config ?? providerDefaults.config,
      options.configProfile ?? providerDefaults.tableProfile,
    ) as YableTableProfile<TData>
    const profileDefaultColumnDef = getYableDefaultColumnDef(profile)
    const configuredColumns = applyYableConfigToColumns(options.columns, profile)
    const defaultColumnDef = {
      ...profileDefaultColumnDef,
      ...providerDefaults.defaultColumnDef,
      ...options.defaultColumnDef,
    }

    return {
      ...options,
      columns: configuredColumns,
      rowClassName: options.rowClassName ?? profile.rows?.className,
      rowStyle: options.rowStyle ?? profile.rows?.style,
      defaultColumnDef: Object.keys(defaultColumnDef).length > 0 ? defaultColumnDef : undefined,
    }
  }, [
    options,
    providerDefaults.config,
    providerDefaults.defaultColumnDef,
    providerDefaults.tableProfile,
  ])

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
  const prevOptionsRef = useRef(optionsWithDefaults)
  const stableOptions = useMemo(() => {
    if (shallowEqual(prevOptionsRef.current as any, optionsWithDefaults as any)) {
      return prevOptionsRef.current
    }
    prevOptionsRef.current = optionsWithDefaults
    return optionsWithDefaults
  }, [optionsWithDefaults])

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
    [state, stableOptions.state],
  )

  const onStateChange = useCallback((updater: Updater<TableState>) => {
    const latest = onStateChangeRef.current
    if (latest) {
      latest(updater)
    } else {
      setState((prev) => functionalUpdate(updater, prev))
    }
  }, [])

  const resolvedOptions: TableOptions<TData> = useMemo(
    () => ({
      ...stableOptions,
      state: resolvedState,
      onStateChange,
    }),
    [stableOptions, resolvedState, onStateChange],
  )

  // Create or update the table instance
  const tableRef = useRef<Table<TData> | null>(null)

  if (!tableRef.current) {
    tableRef.current = createTable(resolvedOptions)
  } else {
    tableRef.current.setOptions(
      (prev) =>
        ({
          ...prev,
          ...resolvedOptions,
          state: resolvedState,
          onStateChange,
        }) as TableOptionsResolved<TData>,
    )
  }

  useEffect(() => {
    const table = tableRef.current
    if (!table) return

    const unsubscribers = [
      options.onCellClick && table.events.on('cell:click', options.onCellClick),
      options.onCellDoubleClick && table.events.on('cell:dblclick', options.onCellDoubleClick),
      options.onCellContextMenu && table.events.on('cell:contextmenu', options.onCellContextMenu),
      options.onRowClick && table.events.on('row:click', options.onRowClick),
      options.onRowDoubleClick && table.events.on('row:dblclick', options.onRowDoubleClick),
      options.onRowContextMenu && table.events.on('row:contextmenu', options.onRowContextMenu),
      options.onHeaderClick && table.events.on('header:click', options.onHeaderClick),
      options.onHeaderContextMenu &&
        table.events.on('header:contextmenu', options.onHeaderContextMenu),
    ].filter((unsubscribe): unsubscribe is () => void => Boolean(unsubscribe))

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [
    options.onCellClick,
    options.onCellContextMenu,
    options.onCellDoubleClick,
    options.onHeaderClick,
    options.onHeaderContextMenu,
    options.onRowClick,
    options.onRowContextMenu,
    options.onRowDoubleClick,
  ])

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
