// @zvndev/yable-core — createTable() — Main Engine

import type {
  RowData,
  Table,
  TableOptions,
  TableOptionsResolved,
  TableState,
  ColumnDef,
  Column,
  Row,
  RowModel,
  HeaderGroup,
  Header,
  Updater,
  ExportOptions,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnSizingInfoState,
  ExpandedState,
  RowPinningState,
  GroupingState,
  EditingState,
  KeyboardNavigationAction,
  KeyboardNavigationCell,
  KeyboardNavigationState,
  YableEventMap,
} from '../types'
import { functionalUpdate, memo, makeStateUpdater } from '../utils'
import { createColumn } from './column'
import { createRow } from './row'
import { buildHeaderGroups } from './headers'
import { EventEmitterImpl } from '../events/EventEmitter'
import { getDefaultLocale } from '../i18n/locales'
import type { YableLocale } from '../i18n/en'
import {
  getCellPositionByIds,
  getNextFocusedCell,
  normalizeFocusedCell,
} from '../features/keyboardNavigation'
import { createCommitCoordinator } from '../features/commits/coordinator'
import type { CellPatch, CommitsSlice } from '../features/commits/types'

// Re-export resolvers for convenience (they live in resolvers.ts to avoid circular deps)
export { resolveSortingFn, resolveFilterFn } from './resolvers'

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const getInitialState = (): TableState => ({
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
    isResizingColumn: false,
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
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
})

// ---------------------------------------------------------------------------
// Locale support on Table interface (augmentation)
// ---------------------------------------------------------------------------

// (locale support is added directly to the table instance below)

// ---------------------------------------------------------------------------
// createTable
// ---------------------------------------------------------------------------

export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // T1-05: Guard data
  const safeData = options.data ?? []
  const safeColumns = options.columns ?? []

  const events = new EventEmitterImpl<YableEventMap<TData>>()

  // Resolve options with defaults
  const resolvedOptions: TableOptionsResolved<TData> = {
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
    enableSorting: true,
    enableFilters: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableSubRowSelection: true,
    enableRowPinning: false,
    enableColumnResizing: true,
    enableColumnReorder: true,
    enableHiding: true,
    enableGrouping: false,
    enableExpanding: true,
    enableKeyboardNavigation: true,
    manualSorting: false,
    manualFiltering: false,
    manualPagination: false,
    manualGrouping: false,
    manualExpanding: false,
    autoResetPageIndex: true,
    sortDescFirst: false,
    enableMultiSort: true,
    enableSortingRemoval: true,
    maxMultiSortColCount: Number.MAX_SAFE_INTEGER,
    isMultiSortEvent: (e: unknown) => {
      if (e && typeof e === 'object' && 'shiftKey' in e) {
        return !!(e as { shiftKey: boolean }).shiftKey
      }
      return false
    },
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    debugAll: false,
    debugHeaders: false,
    debugTable: false,
    debugColumns: false,
    debugRows: false,
    ...options,
    data: safeData,
    columns: safeColumns,
  } as TableOptionsResolved<TData>

  // Internal state (used when no external state is provided)
  let _internalState: TableState = getInitialState()

  // T1-10: per-instance warning flag
  let _largeDatasetWarned = false

  // ---------------------------------------------------------------------------
  // Table Instance
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- built up incrementally, typed on return
  const table: any = {
    options: resolvedOptions,

    // State
    getState: (): TableState => {
      return {
        ...getInitialState(),
        ..._internalState,
        ...resolvedOptions.state,
      }
    },
    setState: (updater: Updater<TableState>) => {
      const newState = functionalUpdate(updater, table.getState())
      _internalState = newState
      resolvedOptions.onStateChange(updater)
    },
    setOptions: (newOpts: Updater<TableOptionsResolved<TData>>) => {
      const updated = functionalUpdate(newOpts, resolvedOptions)
      Object.assign(resolvedOptions, updated)
    },
    reset: () => {
      _internalState = getInitialState()
      resolvedOptions.onStateChange(() => getInitialState())
    },

    // Column API — populated below
    getAllColumns: (): Column<TData, unknown>[] => [],
    getAllFlatColumns: (): Column<TData, unknown>[] => [],
    getAllLeafColumns: (): Column<TData, unknown>[] => [],
    getColumn: (_columnId: string): Column<TData, unknown> | undefined => undefined,
    getVisibleFlatColumns: (): Column<TData, unknown>[] => [],
    getVisibleLeafColumns: (): Column<TData, unknown>[] => [],
    getLeftVisibleLeafColumns: (): Column<TData, unknown>[] => [],
    getRightVisibleLeafColumns: (): Column<TData, unknown>[] => [],
    getCenterVisibleLeafColumns: (): Column<TData, unknown>[] => [],

    // Header API — populated below
    getHeaderGroups: (): HeaderGroup<TData>[] => [],
    getLeftHeaderGroups: (): HeaderGroup<TData>[] => [],
    getRightHeaderGroups: (): HeaderGroup<TData>[] => [],
    getCenterHeaderGroups: (): HeaderGroup<TData>[] => [],
    getFooterGroups: (): HeaderGroup<TData>[] => [],
    getLeftFooterGroups: (): HeaderGroup<TData>[] => [],
    getRightFooterGroups: (): HeaderGroup<TData>[] => [],
    getCenterFooterGroups: (): HeaderGroup<TData>[] => [],

    // Row Model API — populated below
    getCoreRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getRow: (id: string, _searchAll?: boolean): Row<TData> => {
      throw new Error(`[yable] Row with id "${id}" not found.`)
    },
    getFilteredRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getPreFilteredRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getSortedRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getPreSortedRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getPaginationRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getPrePaginationRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getGroupedRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getPreGroupedRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),
    getPreExpandedRowModel: (): RowModel<TData> => ({ rows: [], flatRows: [], rowsById: {} }),

    // Pagination
    getPageCount: (): number => {
      const state = table.getState()
      if (resolvedOptions.pageCount !== undefined) return resolvedOptions.pageCount
      const rowModel = table.getPrePaginationRowModel()
      return Math.ceil(rowModel.rows.length / state.pagination.pageSize)
    },
    getCanPreviousPage: (): boolean => table.getState().pagination.pageIndex > 0,
    getCanNextPage: (): boolean => {
      const state = table.getState()
      return state.pagination.pageIndex < table.getPageCount() - 1
    },
    previousPage: () => {
      table.setPageIndex((old: number) => Math.max(old - 1, 0))
    },
    nextPage: () => {
      table.setPageIndex((old: number) => Math.min(old + 1, table.getPageCount() - 1))
    },
    firstPage: () => table.setPageIndex(0),
    lastPage: () => table.setPageIndex(table.getPageCount() - 1),
    getRowCount: (): number => {
      return resolvedOptions.rowCount ?? table.getPrePaginationRowModel().rows.length
    },
    setPageIndex: (updater: Updater<number>) => {
      table.setPagination((old: PaginationState) => {
        const newPageIndex = functionalUpdate(updater, old.pageIndex)
        return { ...old, pageIndex: newPageIndex }
      })
    },
    setPageSize: (size: number) => {
      table.setPagination((old: PaginationState) => ({ ...old, pageSize: size, pageIndex: 0 }))
    },
    resetPageIndex: (defaultState?: boolean) => {
      table.setPageIndex(defaultState ? 0 : table.getState().pagination.pageIndex)
    },
    resetPageSize: (defaultState?: boolean) => {
      table.setPageSize(defaultState ? 10 : table.getState().pagination.pageSize)
    },
    resetPagination: (defaultState?: boolean) => {
      table.setPagination(
        defaultState
          ? { pageIndex: 0, pageSize: 10 }
          : table.getState().pagination
      )
    },

    // Sorting API (placeholder — wired below)
    setSorting: (_updater: Updater<SortingState>) => {},
    resetSorting: (defaultState?: boolean) => {
      table.setSorting(defaultState ? [] : table.getState().sorting)
    },

    // Filtering API (placeholder — wired below)
    setColumnFilters: (_updater: Updater<ColumnFiltersState>) => {},
    resetColumnFilters: (defaultState?: boolean) => {
      table.setColumnFilters(defaultState ? [] : table.getState().columnFilters)
    },
    setGlobalFilter: (_updater: Updater<string>) => {},
    resetGlobalFilter: (defaultState?: boolean) => {
      table.setGlobalFilter(defaultState ? '' : table.getState().globalFilter)
    },

    // Selection API
    getSelectedRowModel: (): RowModel<TData> => {
      const selection = table.getState().rowSelection
      const rowModel = table.getRowModel()
      const rows = rowModel.flatRows.filter((row: Row<TData>) => selection[row.id])
      return { rows, flatRows: rows, rowsById: Object.fromEntries(rows.map((r: Row<TData>) => [r.id, r])) }
    },
    getFilteredSelectedRowModel: (): RowModel<TData> => table.getSelectedRowModel(),
    getGroupedSelectedRowModel: (): RowModel<TData> => table.getSelectedRowModel(),
    getIsAllRowsSelected: (): boolean => {
      const rowModel = table.getRowModel()
      const selection = table.getState().rowSelection
      return rowModel.flatRows.length > 0 && rowModel.flatRows.every((row: Row<TData>) => selection[row.id])
    },
    getIsSomeRowsSelected: (): boolean => {
      const selection = table.getState().rowSelection
      return Object.keys(selection).length > 0 && !table.getIsAllRowsSelected()
    },
    getIsAllPageRowsSelected: (): boolean => {
      const rowModel = table.getRowModel()
      const selection = table.getState().rowSelection
      return rowModel.rows.length > 0 && rowModel.rows.every((row: Row<TData>) => selection[row.id])
    },
    getIsSomePageRowsSelected: (): boolean => {
      const rowModel = table.getRowModel()
      const selection = table.getState().rowSelection
      return rowModel.rows.some((row: Row<TData>) => selection[row.id]) && !table.getIsAllPageRowsSelected()
    },
    toggleAllRowsSelected: (value?: boolean) => {
      const rowModel = table.getPrePaginationRowModel()
      table.setRowSelection((old: RowSelectionState) => {
        const next = { ...old }
        const shouldSelect = value ?? !table.getIsAllRowsSelected()
        for (const row of rowModel.flatRows) {
          if (shouldSelect) {
            next[row.id] = true
          } else {
            delete next[row.id]
          }
        }
        return next
      })
    },
    toggleAllPageRowsSelected: (value?: boolean) => {
      const rowModel = table.getRowModel()
      table.setRowSelection((old: RowSelectionState) => {
        const next = { ...old }
        const shouldSelect = value ?? !table.getIsAllPageRowsSelected()
        for (const row of rowModel.rows) {
          if (shouldSelect) {
            next[row.id] = true
          } else {
            delete next[row.id]
          }
        }
        return next
      })
    },
    setRowSelection: (_updater: Updater<RowSelectionState>) => {},
    resetRowSelection: (defaultState?: boolean) => {
      table.setRowSelection(defaultState ? {} : table.getState().rowSelection)
    },

    // Visibility API
    setColumnVisibility: (_updater: Updater<VisibilityState>) => {},
    resetColumnVisibility: (defaultState?: boolean) => {
      table.setColumnVisibility(defaultState ? {} : table.getState().columnVisibility)
    },
    toggleAllColumnsVisible: (value?: boolean) => {
      const allColumns = table.getAllLeafColumns()
      table.setColumnVisibility((old: VisibilityState) => {
        const next = { ...old }
        const shouldShow = value ?? !table.getIsAllColumnsVisible()
        for (const col of allColumns) {
          next[col.id] = shouldShow
        }
        return next
      })
    },
    getIsAllColumnsVisible: (): boolean => {
      return table.getAllLeafColumns().every((col: Column<TData, unknown>) => col.getIsVisible())
    },
    getIsSomeColumnsVisible: (): boolean => {
      return table.getAllLeafColumns().some((col: Column<TData, unknown>) => col.getIsVisible())
    },

    // Column Order API
    setColumnOrder: (_updater: Updater<ColumnOrderState>) => {},
    resetColumnOrder: (defaultState?: boolean) => {
      table.setColumnOrder(defaultState ? [] : table.getState().columnOrder)
    },

    // Column Pinning API
    setColumnPinning: (_updater: Updater<ColumnPinningState>) => {},
    resetColumnPinning: (defaultState?: boolean) => {
      table.setColumnPinning(
        defaultState ? { left: [], right: [] } : table.getState().columnPinning
      )
    },
    getIsSomeColumnsPinned: (position?: 'left' | 'right'): boolean => {
      const pinning = table.getState().columnPinning
      if (position === 'left') return (pinning.left?.length ?? 0) > 0
      if (position === 'right') return (pinning.right?.length ?? 0) > 0
      return (pinning.left?.length ?? 0) > 0 || (pinning.right?.length ?? 0) > 0
    },

    // Column Sizing API
    setColumnSizing: (_updater: Updater<ColumnSizingState>) => {},
    setColumnSizingInfo: (_updater: Updater<ColumnSizingInfoState>) => {},
    resetColumnSizing: (defaultState?: boolean) => {
      table.setColumnSizing(defaultState ? {} : table.getState().columnSizing)
    },
    getTotalSize: (): number => {
      return table.getVisibleFlatColumns().reduce((sum: number, col: Column<TData, unknown>) => sum + col.getSize(), 0)
    },
    getLeftTotalSize: (): number => {
      return table.getLeftVisibleLeafColumns().reduce((sum: number, col: Column<TData, unknown>) => sum + col.getSize(), 0)
    },
    getRightTotalSize: (): number => {
      return table.getRightVisibleLeafColumns().reduce((sum: number, col: Column<TData, unknown>) => sum + col.getSize(), 0)
    },
    getCenterTotalSize: (): number => {
      return table.getCenterVisibleLeafColumns().reduce((sum: number, col: Column<TData, unknown>) => sum + col.getSize(), 0)
    },

    // Expanding API
    setExpanded: (_updater: Updater<ExpandedState>) => {},
    resetExpanded: (defaultState?: boolean) => {
      table.setExpanded(defaultState ? {} : table.getState().expanded)
    },
    toggleAllRowsExpanded: (expanded?: boolean) => {
      const shouldExpand = expanded ?? !table.getIsAllRowsExpanded()
      if (shouldExpand) {
        const rowModel = table.getPreExpandedRowModel()
        const expandedState: Record<string, boolean> = {}
        for (const row of rowModel.flatRows) {
          if (row.subRows.length > 0) {
            expandedState[row.id] = true
          }
        }
        table.setExpanded(expandedState)
      } else {
        table.setExpanded({})
      }
    },
    getCanSomeRowsExpand: (): boolean => {
      return table.getPreExpandedRowModel().flatRows.some((r: Row<TData>) => r.getCanExpand())
    },
    getIsAllRowsExpanded: (): boolean => {
      const rowModel = table.getPreExpandedRowModel()
      const expanded = table.getState().expanded
      if (expanded === true) return true
      const expandableRows = rowModel.flatRows.filter((r: Row<TData>) => r.subRows.length > 0)
      if (expandableRows.length === 0) return false
      const expandedRecord = expanded as Record<string, boolean>
      return expandableRows.every((r: Row<TData>) => expandedRecord[r.id])
    },
    getIsSomeRowsExpanded: (): boolean => {
      const expanded = table.getState().expanded
      if (expanded === true) return true
      return Object.keys(expanded as Record<string, boolean>).length > 0
    },
    getExpandedDepth: (): number => {
      const expanded = table.getState().expanded
      if (expanded === true) return Infinity
      let maxDepth = 0
      const expandedRecord = expanded as Record<string, boolean>
      const rowModel = table.getPreExpandedRowModel()
      for (const row of rowModel.flatRows) {
        if (expandedRecord[row.id]) {
          maxDepth = Math.max(maxDepth, row.depth)
        }
      }
      return maxDepth
    },
    getExpandedRowModel: (): RowModel<TData> => table.getCoreRowModel(),

    // Row Pinning API
    setRowPinning: (_updater: Updater<RowPinningState>) => {},
    resetRowPinning: (defaultState?: boolean) => {
      table.setRowPinning(
        defaultState ? { top: [], bottom: [] } : table.getState().rowPinning
      )
    },
    getTopRows: (): Row<TData>[] => {
      const pinning = table.getState().rowPinning
      const rowModel = table.getCoreRowModel()
      return (pinning.top ?? [])
        .map((id: string) => rowModel.rowsById[id])
        .filter((row: Row<TData> | undefined): row is Row<TData> => row !== undefined)
    },
    getBottomRows: (): Row<TData>[] => {
      const pinning = table.getState().rowPinning
      const rowModel = table.getCoreRowModel()
      return (pinning.bottom ?? [])
        .map((id: string) => rowModel.rowsById[id])
        .filter((row: Row<TData> | undefined): row is Row<TData> => row !== undefined)
    },
    getCenterRows: (): Row<TData>[] => {
      const pinning = table.getState().rowPinning
      const rowModel = table.getRowModel()
      const pinned = new Set([...(pinning.top ?? []), ...(pinning.bottom ?? [])])
      return rowModel.rows.filter((row: Row<TData>) => !pinned.has(row.id))
    },

    // Grouping API
    setGrouping: (_updater: Updater<GroupingState>) => {},
    resetGrouping: (defaultState?: boolean) => {
      table.setGrouping(defaultState ? [] : table.getState().grouping)
    },

    // Internal — T1-11: _features kept on the interface for forward-compatibility
    // but not wired to a plugin system yet
    _features: [],
    initialState: getInitialState(),

    // Editing API
    setEditing: (_updater: Updater<EditingState>) => {},
    startEditing: (rowId: string, columnId: string) => {
      const focusedCell = getCellPositionByIds(table, rowId, columnId)
      if (focusedCell) {
        table.setFocusedCell(focusedCell)
      }

      table.setEditing((old: EditingState) => ({
        ...old,
        activeCell: { rowId, columnId },
      }))
    },
    commitEdit: () => {
      const editing = table.getState().editing
      if (!editing?.activeCell) return

      const { rowId, columnId } = editing.activeCell

      // Capture cursor position so we can keep focus on the cell after commit
      const focusedCell = getCellPositionByIds(table, rowId, columnId)

      // Read the pending value (may be undefined if user pressed Enter without changes)
      const pendingValue = editing.pendingValues?.[rowId]?.[columnId]
      const hasPending = pendingValue !== undefined

      // Clear active cell first so the input unmounts. Also drop the pending
      // value for this cell since the coordinator now owns it.
      table.setEditing((old: EditingState) => {
        const nextPending: Record<string, Record<string, unknown>> = {
          ...(old.pendingValues ?? {}),
        }
        if (hasPending && nextPending[rowId]) {
          const row: Record<string, unknown> = { ...nextPending[rowId] }
          delete row[columnId]
          if (Object.keys(row).length === 0) {
            delete nextPending[rowId]
          } else {
            nextPending[rowId] = row
          }
        }
        return {
          ...old,
          activeCell: undefined,
          pendingValues: nextPending,
        }
      })

      if (focusedCell) {
        table.setFocusedCell(focusedCell)
      }

      // If onCommit is defined and autoCommit !== false, dispatch through the
      // coordinator. Otherwise (legacy mode), fire the existing onEditCommit hook.
      const opts = table.options
      const autoCommit = opts.autoCommit !== false
      if (hasPending && opts.onCommit && autoCommit) {
        let previousValue: unknown
        try {
          previousValue = table.getRow(rowId, true).getValue(columnId)
        } catch {
          previousValue = undefined
        }
        // Fire-and-forget — coordinator updates the slice asynchronously,
        // and the table re-renders via state changes
        void (table as any).__commitCoordinator?.dispatch([
          { rowId, columnId, value: pendingValue, previousValue },
        ])
      } else if (hasPending && opts.onEditCommit) {
        // Legacy fallback
        opts.onEditCommit({ [rowId]: { [columnId]: pendingValue } as any })
      }
    },
    cancelEdit: () => {
      const editing = table.getState().editing
      const focusedCell = editing?.activeCell
        ? getCellPositionByIds(table, editing.activeCell.rowId, editing.activeCell.columnId)
        : null

      table.setEditing((old: EditingState) => ({
        ...old,
        activeCell: undefined,
      }))

      if (focusedCell) {
        table.setFocusedCell(focusedCell)
      }
    },
    resetEditing: (defaultState?: boolean) => {
      table.setEditing(
        defaultState
          ? { activeCell: undefined, pendingValues: {} }
          : table.getState().editing
      )
    },
    setPendingValue: (rowId: string, columnId: string, value: unknown) => {
      table.setEditing((old: EditingState) => ({
        ...old,
        pendingValues: {
          ...old.pendingValues,
          [rowId]: {
            ...(old.pendingValues[rowId] ?? {}),
            [columnId]: value,
          },
        },
      }))
    },
    getPendingValue: (rowId: string, columnId: string): unknown | undefined => {
      const editing = table.getState().editing
      return editing.pendingValues?.[rowId]?.[columnId]
    },
    getPendingRow: (rowId: string): Partial<TData> | undefined => {
      const editing = table.getState().editing
      return editing.pendingValues?.[rowId] as Partial<TData> | undefined
    },
    getAllPendingChanges: (): Record<string, Partial<TData>> => {
      const editing = table.getState().editing
      return (editing.pendingValues ?? {}) as Record<string, Partial<TData>>
    },
    hasPendingChanges: (): boolean => {
      return Object.keys(table.getAllPendingChanges()).length > 0
    },
    isValid: (): boolean => {
      return Object.keys(table.getValidationErrors()).length === 0
    },
    commitAllPending: () => {
      const changes = table.getAllPendingChanges()
      resolvedOptions.onEditCommit?.(changes)
      table.setEditing((old: EditingState) => ({
        ...old,
        pendingValues: {},
      }))
    },
    discardAllPending: () => {
      table.setEditing((old: EditingState) => ({
        ...old,
        pendingValues: {},
      }))
    },
    getValidationErrors: (): Record<string, Record<string, string>> => {
      // Validation errors are not yet tracked in EditingState;
      // return empty until a validation feature is wired up.
      return {}
    },

    // Async commit API (Task #10) — wired below after the literal
    getCellRenderValue: () => undefined,
    getCellStatus: () => 'idle',
    getCellErrorMessage: () => undefined,
    getCellConflictWith: () => undefined,
    commit: async () => {},
    retryCommit: async () => {},
    dismissCommit: () => {},
    dismissAllCommits: () => {},

    // Keyboard Navigation API
    setKeyboardNavigation: (_updater: Updater<KeyboardNavigationState>) => {},
    getFocusedCell: () => {
      return normalizeFocusedCell(table, table.getState().keyboardNavigation?.focusedCell)
    },
    setFocusedCell: (cell: KeyboardNavigationCell | null) => {
      const normalized = normalizeFocusedCell(table, cell)
      table.setKeyboardNavigation((old: KeyboardNavigationState) => ({
        ...old,
        focusedCell: normalized,
      }))
    },
    clearFocusedCell: () => {
      table.setKeyboardNavigation((old: KeyboardNavigationState) => ({
        ...old,
        focusedCell: null,
      }))
    },
    moveFocus: (action: KeyboardNavigationAction) => {
      const nextCell = getNextFocusedCell(table, table.getFocusedCell(), action)
      table.setFocusedCell(nextCell)
      return nextCell
    },
    resetKeyboardNavigation: (defaultState?: boolean) => {
      table.setKeyboardNavigation(
        defaultState ? { focusedCell: null } : table.getState().keyboardNavigation
      )
    },

    // Export API
    exportData: (opts?: ExportOptions): string => {
      const rowModel = opts?.allRows ? table.getPrePaginationRowModel() : table.getRowModel()
      const columns = opts?.columns
        ? table.getAllLeafColumns().filter((col: Column<TData, unknown>) => opts.columns!.includes(col.id))
        : table.getVisibleLeafColumns()

      if (opts?.format === 'json' || !opts?.format) {
        const data = rowModel.rows.map((row: Row<TData>) => {
          const obj: Record<string, unknown> = {}
          for (const col of columns) {
            obj[col.id] = row.getValue(col.id)
          }
          return obj
        })
        return JSON.stringify(data, null, 2)
      }

      if (opts?.format === 'csv') {
        const headers = columns.map((col: Column<TData, unknown>) => {
          const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id
          return escapeCSV(header)
        })

        const rows = rowModel.rows.map((row: Row<TData>) =>
          columns.map((col: Column<TData, unknown>) => escapeCSV(String(row.getValue(col.id) ?? ''))).join(',')
        )

        return [headers.join(','), ...rows].join('\n')
      }

      return ''
    },

    // Pagination state setters (placeholder — wired below)
    setPagination: (_updater: Updater<PaginationState>) => {},

    // Events
    events,

    // T1-06: Locale support
    getLocaleString: (key: string): string => {
      // Check for per-table locale option first
      const tableLocale = (resolvedOptions as TableOptionsResolved<TData> & { locale?: Partial<YableLocale> }).locale
      if (tableLocale && key in tableLocale) {
        return (tableLocale as Record<string, string>)[key]
      }
      // Fall back to global default locale
      return (getDefaultLocale() as unknown as Record<string, string>)[key] ?? key
    },
  }

  // ---------------------------------------------------------------------------
  // Wire up state updaters to use table instance
  // ---------------------------------------------------------------------------

  const wireUpdater = <V>(key: keyof TableState) => {
    return makeStateUpdater(key, table) as (updater: Updater<V>) => void
  }

  table.setSorting = wireUpdater<SortingState>('sorting')
  table.setColumnFilters = wireUpdater<ColumnFiltersState>('columnFilters')
  table.setGlobalFilter = wireUpdater<string>('globalFilter')
  table.setRowSelection = wireUpdater<RowSelectionState>('rowSelection')
  table.setColumnVisibility = wireUpdater<VisibilityState>('columnVisibility')
  table.setColumnOrder = wireUpdater<ColumnOrderState>('columnOrder')
  table.setColumnPinning = wireUpdater<ColumnPinningState>('columnPinning')
  table.setColumnSizing = wireUpdater<ColumnSizingState>('columnSizing')
  table.setColumnSizingInfo = wireUpdater<ColumnSizingInfoState>('columnSizingInfo')
  table.setExpanded = wireUpdater<ExpandedState>('expanded')
  table.setRowPinning = wireUpdater<RowPinningState>('rowPinning')
  table.setGrouping = wireUpdater<GroupingState>('grouping')
  table.setEditing = wireUpdater<EditingState>('editing')
  table.setKeyboardNavigation = wireUpdater<KeyboardNavigationState>('keyboardNavigation')
  table.setPagination = wireUpdater<PaginationState>('pagination')

  // ---------------------------------------------------------------------------
  // Column Processing — T1-01: Build columnMap for O(1) lookup
  // ---------------------------------------------------------------------------

  const processColumns = memo(
    () => [resolvedOptions.columns, resolvedOptions.state?.columnOrder],
    (columnDefs: ColumnDef<TData>[]) => {
      const allColumns: Column<TData, unknown>[] = []
      const allFlatColumns: Column<TData, unknown>[] = []
      const columnMap = new Map<string, Column<TData, unknown>>()

      const processColumnDef = (
        colDef: ColumnDef<TData>,
        depth: number,
        parent?: Column<TData, unknown>
      ): Column<TData, unknown> => {
        const column = createColumn(table, colDef, depth, parent)
        allColumns.push(column)
        columnMap.set(column.id, column)

        if ('columns' in colDef && colDef.columns?.length) {
          column.columns = colDef.columns.map((subDef: ColumnDef<TData>) =>
            processColumnDef(subDef, depth + 1, column)
          )
        } else {
          allFlatColumns.push(column)
        }

        return column
      }

      const topLevel = columnDefs.map((def: ColumnDef<TData>) => processColumnDef(def, 0))

      return {
        topLevel,
        allColumns,
        allFlatColumns,
        allLeafColumns: allFlatColumns,
        columnMap,
      }
    },
    { key: 'processColumns' }
  )

  table.getAllColumns = () => processColumns().allColumns
  table.getAllFlatColumns = () => processColumns().allFlatColumns
  table.getAllLeafColumns = () => processColumns().allLeafColumns
  // T1-01: O(1) column lookup via Map instead of linear .find()
  table.getColumn = (id: string) => processColumns().columnMap.get(id)

  // Visible columns with ordering and pinning
  table.getVisibleFlatColumns = memo(
    () => [table.getAllLeafColumns(), table.getState().columnVisibility, table.getState().columnOrder],
    (allLeaf: Column<TData, unknown>[]) => {
      let cols = allLeaf.filter((col: Column<TData, unknown>) => col.getIsVisible())
      const order = table.getState().columnOrder
      if (order.length) {
        const orderMap = new Map<string, number>(order.map((id: string, i: number) => [id, i]))
        cols = cols.sort((a: Column<TData, unknown>, b: Column<TData, unknown>) => {
          const ai: number = orderMap.get(a.id) ?? Infinity
          const bi: number = orderMap.get(b.id) ?? Infinity
          return ai - bi
        })
      }
      return cols
    },
    { key: 'getVisibleFlatColumns' }
  )

  table.getVisibleLeafColumns = table.getVisibleFlatColumns

  table.getLeftVisibleLeafColumns = memo(
    () => [table.getVisibleFlatColumns(), table.getState().columnPinning],
    (visible: Column<TData, unknown>[]) => {
      const pinned = table.getState().columnPinning.left ?? []
      return visible.filter((col) => pinned.includes(col.id))
    },
    { key: 'getLeftVisibleLeafColumns' }
  )

  table.getRightVisibleLeafColumns = memo(
    () => [table.getVisibleFlatColumns(), table.getState().columnPinning],
    (visible: Column<TData, unknown>[]) => {
      const pinned = table.getState().columnPinning.right ?? []
      return visible.filter((col) => pinned.includes(col.id))
    },
    { key: 'getRightVisibleLeafColumns' }
  )

  table.getCenterVisibleLeafColumns = memo(
    () => [table.getVisibleFlatColumns(), table.getState().columnPinning],
    (visible: Column<TData, unknown>[]) => {
      const left = new Set(table.getState().columnPinning.left ?? [])
      const right = new Set(table.getState().columnPinning.right ?? [])
      return visible.filter((col) => !left.has(col.id) && !right.has(col.id))
    },
    { key: 'getCenterVisibleLeafColumns' }
  )

  // ---------------------------------------------------------------------------
  // Header Groups
  // ---------------------------------------------------------------------------

  table.getHeaderGroups = memo(
    () => [
      table.getAllColumns(),
      table.getState().columnVisibility,
      table.getState().columnPinning,
      table.getState().columnOrder,
    ],
    () => buildHeaderGroups(table, processColumns().topLevel),
    { key: 'getHeaderGroups' }
  )

  table.getLeftHeaderGroups = memo(
    () => [table.getHeaderGroups(), table.getState().columnPinning],
    (groups: HeaderGroup<TData>[]) => {
      const leftIds = new Set(table.getState().columnPinning.left ?? [])
      if (leftIds.size === 0) return []
      return groups.map((group: HeaderGroup<TData>) => ({
        ...group,
        headers: group.headers.filter((h: Header<TData, unknown>) => leftIds.has(h.column.id)),
      }))
    },
    { key: 'getLeftHeaderGroups' }
  )

  table.getRightHeaderGroups = memo(
    () => [table.getHeaderGroups(), table.getState().columnPinning],
    (groups: HeaderGroup<TData>[]) => {
      const rightIds = new Set(table.getState().columnPinning.right ?? [])
      if (rightIds.size === 0) return []
      return groups.map((group: HeaderGroup<TData>) => ({
        ...group,
        headers: group.headers.filter((h: Header<TData, unknown>) => rightIds.has(h.column.id)),
      }))
    },
    { key: 'getRightHeaderGroups' }
  )

  table.getCenterHeaderGroups = memo(
    () => [table.getHeaderGroups(), table.getState().columnPinning],
    (groups: HeaderGroup<TData>[]) => {
      const leftIds = new Set(table.getState().columnPinning.left ?? [])
      const rightIds = new Set(table.getState().columnPinning.right ?? [])
      return groups.map((group: HeaderGroup<TData>) => ({
        ...group,
        headers: group.headers.filter(
          (h: Header<TData, unknown>) => !leftIds.has(h.column.id) && !rightIds.has(h.column.id)
        ),
      }))
    },
    { key: 'getCenterHeaderGroups' }
  )

  table.getFooterGroups = () => [...table.getHeaderGroups()].reverse()
  table.getLeftFooterGroups = () => [...table.getLeftHeaderGroups()].reverse()
  table.getRightFooterGroups = () => [...table.getRightHeaderGroups()].reverse()
  table.getCenterFooterGroups = () => [...table.getCenterHeaderGroups()].reverse()

  // ---------------------------------------------------------------------------
  // Row Model Pipeline
  // ---------------------------------------------------------------------------

  // 1. Core Row Model — raw data -> Row[]
  table.getCoreRowModel = memo(
    () => [resolvedOptions.data],
    (data: TData[]) => {
      // T1-05: guard against null/undefined data
      const safeData = data ?? []

      // T1-10: Large dataset warning
      if (safeData.length > 10_000 && !resolvedOptions.enableVirtualization && !_largeDatasetWarned) {
        _largeDatasetWarned = true
        console.warn(
          `Yable: Rendering ${safeData.length} rows without virtualization. Consider enabling virtualization for better performance.`
        )
      }

      const rows: Row<TData>[] = safeData.map((original: TData, index: number) => {
        let id: string
        if (resolvedOptions.getRowId) {
          // T1-09: Wrap user callback in try-catch
          try {
            id = resolvedOptions.getRowId(original, index)
          } catch (err) {
            console.error(`[yable] getRowId threw for row at index ${index}:`, err)
            id = String(index)
          }
        } else {
          id = String(index)
        }

        return createRow(table, id, original, index, 0)
      })

      const flatRows = rows
      const rowsById: Record<string, Row<TData>> = {}
      for (const row of flatRows) {
        rowsById[row.id] = row
      }

      return { rows, flatRows, rowsById }
    },
    { key: 'getCoreRowModel' }
  )

  // 2. Pre-filter = core
  table.getPreFilteredRowModel = table.getCoreRowModel

  // 3. Filtered Row Model
  table.getFilteredRowModel = memo(
    () => [table.getCoreRowModel(), table.getState().columnFilters, table.getState().globalFilter],
    (coreModel: RowModel<TData>) => {
      if (resolvedOptions.manualFiltering) return coreModel

      const columnFilters = table.getState().columnFilters
      const globalFilter = table.getState().globalFilter

      if (columnFilters.length === 0 && !globalFilter) return coreModel

      let filtered = coreModel.rows

      // Apply column filters
      for (const filter of columnFilters) {
        // T1-05: Skip invalid column IDs silently
        const column = table.getColumn(filter.id)
        if (!column) continue

        filtered = filtered.filter((row: Row<TData>) => {
          const filterFn = column.getFilterFn()

          if (filterFn) {
            // T1-09: Wrap user-provided filterFn in try-catch
            try {
              return filterFn(row, filter.id, filter.value, () => {})
            } catch (err) {
              console.error(
                `[yable] filterFn threw for column "${filter.id}", row "${row.id}":`,
                err
              )
              return true // safe default: include the row
            }
          }

          // Default string include filter
          const value = row.getValue(filter.id)
          return String(value ?? '')
            .toLowerCase()
            .includes(String(filter.value ?? '').toLowerCase())
        })
      }

      // Apply global filter
      if (globalFilter) {
        const searchStr = String(globalFilter).toLowerCase()
        filtered = filtered.filter((row: Row<TData>) => {
          return table.getAllLeafColumns().some((col: Column<TData, unknown>) => {
            const value = row.getValue(col.id)
            return String(value ?? '').toLowerCase().includes(searchStr)
          })
        })
      }

      const rowsById: Record<string, Row<TData>> = {}
      for (const row of filtered) {
        rowsById[row.id] = row
      }

      return { rows: filtered, flatRows: filtered, rowsById }
    },
    { key: 'getFilteredRowModel' }
  )

  // 4. Pre-sort = filtered
  table.getPreSortedRowModel = table.getFilteredRowModel

  // 5. Sorted Row Model
  table.getSortedRowModel = memo(
    () => [table.getFilteredRowModel(), table.getState().sorting],
    (filteredModel: RowModel<TData>) => {
      if (resolvedOptions.manualSorting) return filteredModel

      const sorting = table.getState().sorting
      if (!sorting.length) return filteredModel

      const sorted = [...filteredModel.rows].sort((a, b) => {
        for (const sort of sorting) {
          // T1-05: Skip invalid column IDs silently
          const column = table.getColumn(sort.id)
          if (!column) continue

          // Custom sort function
          const sortFn = column.getSortingFn()
          if (sortFn) {
            // T1-09: Wrap user-provided sortFn in try-catch
            try {
              const result = sortFn(a, b, sort.id)
              if (result !== 0) return sort.desc ? -result : result
              continue
            } catch (err) {
              console.error(
                `[yable] sortingFn threw for column "${sort.id}":`,
                err
              )
              continue // safe default: treat as equal
            }
          }

          // Default comparison
          const aVal = a.getValue(sort.id)
          const bVal = b.getValue(sort.id)
          const result = defaultCompare(aVal, bVal)
          if (result !== 0) return sort.desc ? -result : result
        }
        return 0
      })

      const rowsById: Record<string, Row<TData>> = {}
      for (const row of sorted) {
        rowsById[row.id] = row
      }

      return { rows: sorted, flatRows: sorted, rowsById }
    },
    { key: 'getSortedRowModel' }
  )

  // 6. Pre-pagination = sorted
  table.getPrePaginationRowModel = table.getSortedRowModel

  // 7. Paginated Row Model
  table.getPaginationRowModel = memo(
    () => [table.getSortedRowModel(), table.getState().pagination],
    (sortedModel: RowModel<TData>) => {
      if (resolvedOptions.manualPagination) return sortedModel

      const { pageIndex, pageSize } = table.getState().pagination
      const start = pageIndex * pageSize
      const end = start + pageSize
      const paginated = sortedModel.rows.slice(start, end)

      const rowsById: Record<string, Row<TData>> = {}
      for (const row of paginated) {
        rowsById[row.id] = row
      }

      return { rows: paginated, flatRows: paginated, rowsById }
    },
    { key: 'getPaginationRowModel' }
  )

  // Final row model = paginated
  table.getRowModel = table.getPaginationRowModel

  // getRow
  table.getRow = (id: string, searchAll?: boolean) => {
    const model = searchAll ? table.getCoreRowModel() : table.getRowModel()
    const row = model.rowsById[id]
    if (!row) {
      throw new Error(`[yable] Row with id "${id}" not found.`)
    }
    return row
  }

  // Pre-expanded and pre-grouped models
  table.getPreExpandedRowModel = table.getSortedRowModel
  table.getPreGroupedRowModel = table.getFilteredRowModel

  // ---------------------------------------------------------------------------
  // Commit Coordinator (Task #10)
  // ---------------------------------------------------------------------------

  const setCommitsSlice = (next: CommitsSlice) => {
    table.setState((old: TableState) => ({ ...old, commits: next }))
  }

  let lastDataRef: unknown = resolvedOptions.data

  const commitCoordinator = createCommitCoordinator(
    {
      getSlice: () => table.getState().commits,
      setSlice: setCommitsSlice,
      getSavedValue: (rowId: string, columnId: string) => {
        try {
          const row = table.getRow(rowId, true)
          return row.getValue(columnId)
        } catch {
          return undefined
        }
      },
      getRow: (rowId: string) => {
        try {
          return table.getRow(rowId, true).original
        } catch {
          return undefined
        }
      },
      rowExists: (rowId: string) => {
        try {
          table.getRow(rowId, true)
          return true
        } catch {
          return false
        }
      },
    },
    {
      onCommit: resolvedOptions.onCommit as any,
      resolveColumnCommit: (columnId: string) => {
        const col = table.getColumn(columnId)
        const def = col?.columnDef as any
        return def?.commit
      },
      rowCommitRetryMode: resolvedOptions.rowCommitRetryMode ?? 'failed',
    }
  )

  ;(table as any).__commitCoordinator = commitCoordinator

  // Wire new table methods (override the literal stubs)
  table.getCellRenderValue = (rowId: string, columnId: string) => {
    const status = commitCoordinator.getCellStatus(rowId, columnId)
    if (status !== 'idle') {
      return commitCoordinator.getRenderValue(rowId, columnId)
    }
    try {
      return table.getRow(rowId, true).getValue(columnId)
    } catch {
      return undefined
    }
  }

  table.getCellStatus = (rowId: string, columnId: string) =>
    commitCoordinator.getCellStatus(rowId, columnId)

  table.getCellErrorMessage = (rowId: string, columnId: string) =>
    commitCoordinator.getRecord(rowId, columnId)?.errorMessage

  table.getCellConflictWith = (rowId: string, columnId: string) =>
    commitCoordinator.getRecord(rowId, columnId)?.conflictWith

  table.commit = async () => {
    // When autoCommit is true, the coordinator has already fired everything;
    // there's nothing buffered. When autoCommit is false, the existing
    // pendingValues from the editing slice are flushed through the coordinator.
    const editing = table.getState().editing
    const pendingValues: Record<string, Record<string, unknown>> =
      editing.pendingValues ?? {}
    const patches: Omit<CellPatch, 'signal' | 'row'>[] = []
    for (const rowId of Object.keys(pendingValues)) {
      for (const colId of Object.keys(pendingValues[rowId]!)) {
        let previousValue: unknown
        try {
          previousValue = table.getRow(rowId, true).getValue(colId)
        } catch {
          previousValue = undefined
        }
        patches.push({
          rowId,
          columnId: colId,
          value: pendingValues[rowId]![colId],
          previousValue,
        })
      }
    }
    if (patches.length === 0) return
    await commitCoordinator.dispatch(patches)
    table.setEditing((old: EditingState) => ({ ...old, pendingValues: {} }))
  }

  table.retryCommit = async (rowId: string, columnId: string) => {
    await commitCoordinator.retry(rowId, columnId)
  }

  table.dismissCommit = (rowId: string, columnId: string) => {
    commitCoordinator.dismiss(rowId, columnId)
  }

  table.dismissAllCommits = () => {
    commitCoordinator.dismissAll()
  }

  // Sweep triggers — fire on data ref change
  const originalSetOptions = table.setOptions
  table.setOptions = (updater: Updater<TableOptions<TData>>) => {
    originalSetOptions(updater)
    const data = table.options.data
    if (data !== lastDataRef) {
      lastDataRef = data
      commitCoordinator.runOrphanedGc()
      commitCoordinator.runAutoClearSweep()
      commitCoordinator.runConflictDetection()
    }
  }

  return table as Table<TData>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1

  return String(a).localeCompare(String(b))
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
