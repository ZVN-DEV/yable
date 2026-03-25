// @yable/core — createTable() — Main Engine

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
  YableEventMap,
} from '../types'
import { functionalUpdate, memo, makeStateUpdater } from '../utils'
import { createColumn } from './column'
import { createRow } from './row'
import { buildHeaderGroups } from './headers'
import { EventEmitterImpl } from '../events/EventEmitter'

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
    isResizingColumn: false as any,
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    columnSizingStart: [],
  },
  expanded: {},
  rowPinning: { top: [], bottom: [] },
  grouping: [],
  editing: null as any,
})

// ---------------------------------------------------------------------------
// createTable
// ---------------------------------------------------------------------------

export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
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
    enableHiding: true,
    enableGrouping: false,
    enableExpanding: true,
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
    isMultiSortEvent: (e: unknown) => (e as MouseEvent)?.shiftKey,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    debugAll: false,
    debugHeaders: false,
    debugTable: false,
    debugColumns: false,
    debugRows: false,
    ...options,
  } as TableOptionsResolved<TData>

  // Internal state (used when no external state is provided)
  let _internalState: TableState = getInitialState()

  // ---------------------------------------------------------------------------
  // Table Instance
  // ---------------------------------------------------------------------------

  const table: Table<TData> = {
    options: resolvedOptions,

    // State
    getState: () => {
      return {
        ...getInitialState(),
        ..._internalState,
        ...resolvedOptions.state,
      } as TableState
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
    getAllColumns: () => [],
    getAllFlatColumns: () => [],
    getAllLeafColumns: () => [],
    getColumn: () => undefined,
    getVisibleFlatColumns: () => [],
    getVisibleLeafColumns: () => [],
    getLeftVisibleLeafColumns: () => [],
    getRightVisibleLeafColumns: () => [],
    getCenterVisibleLeafColumns: () => [],

    // Header API — populated below
    getHeaderGroups: () => [],
    getLeftHeaderGroups: () => [],
    getRightHeaderGroups: () => [],
    getCenterHeaderGroups: () => [],
    getFooterGroups: () => [],
    getLeftFooterGroups: () => [],
    getRightFooterGroups: () => [],
    getCenterFooterGroups: () => [],

    // Row Model API — populated below
    getCoreRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getRow: () => undefined as any,
    getFilteredRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getPreFilteredRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getSortedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getPreSortedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getPaginationRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getPrePaginationRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getGroupedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getPreGroupedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getPreExpandedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),

    // Pagination
    getPageCount: () => {
      const state = table.getState()
      if (resolvedOptions.pageCount !== undefined) return resolvedOptions.pageCount
      const rowModel = table.getPrePaginationRowModel()
      return Math.ceil(rowModel.rows.length / state.pagination.pageSize)
    },
    getCanPreviousPage: () => table.getState().pagination.pageIndex > 0,
    getCanNextPage: () => {
      const state = table.getState()
      return state.pagination.pageIndex < table.getPageCount() - 1
    },
    previousPage: () => {
      table.setPageIndex((old) => Math.max(old - 1, 0))
    },
    nextPage: () => {
      table.setPageIndex((old) => Math.min(old + 1, table.getPageCount() - 1))
    },
    firstPage: () => table.setPageIndex(0),
    lastPage: () => table.setPageIndex(table.getPageCount() - 1),
    getRowCount: () => {
      return resolvedOptions.rowCount ?? table.getPrePaginationRowModel().rows.length
    },
    setPageIndex: (updater: Updater<number>) => {
      table.setPagination((old) => {
        const newPageIndex = functionalUpdate(updater, old.pageIndex)
        return { ...old, pageIndex: newPageIndex }
      })
    },
    setPageSize: (size: number) => {
      table.setPagination((old) => ({ ...old, pageSize: size, pageIndex: 0 }))
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

    // Sorting API
    setSorting: makeStateUpdater('sorting', {} as any) as any,
    resetSorting: (defaultState?: boolean) => {
      table.setSorting(defaultState ? [] : table.getState().sorting)
    },

    // Filtering API
    setColumnFilters: makeStateUpdater('columnFilters', {} as any) as any,
    resetColumnFilters: (defaultState?: boolean) => {
      table.setColumnFilters(defaultState ? [] : table.getState().columnFilters)
    },
    setGlobalFilter: makeStateUpdater('globalFilter', {} as any) as any,
    resetGlobalFilter: (defaultState?: boolean) => {
      table.setGlobalFilter(defaultState ? '' : table.getState().globalFilter)
    },

    // Selection API
    getSelectedRowModel: () => {
      const selection = table.getState().rowSelection
      const rowModel = table.getRowModel()
      const rows = rowModel.flatRows.filter((row) => selection[row.id])
      return { rows, flatRows: rows, rowsById: Object.fromEntries(rows.map((r) => [r.id, r])) }
    },
    getFilteredSelectedRowModel: () => table.getSelectedRowModel(),
    getGroupedSelectedRowModel: () => table.getSelectedRowModel(),
    getIsAllRowsSelected: () => {
      const rowModel = table.getRowModel()
      const selection = table.getState().rowSelection
      return rowModel.flatRows.length > 0 && rowModel.flatRows.every((row) => selection[row.id])
    },
    getIsSomeRowsSelected: () => {
      const selection = table.getState().rowSelection
      return Object.keys(selection).length > 0 && !table.getIsAllRowsSelected()
    },
    getIsAllPageRowsSelected: () => {
      const rowModel = table.getRowModel()
      const selection = table.getState().rowSelection
      return rowModel.rows.length > 0 && rowModel.rows.every((row) => selection[row.id])
    },
    getIsSomePageRowsSelected: () => {
      const rowModel = table.getRowModel()
      const selection = table.getState().rowSelection
      return rowModel.rows.some((row) => selection[row.id]) && !table.getIsAllPageRowsSelected()
    },
    toggleAllRowsSelected: (value?: boolean) => {
      const rowModel = table.getPrePaginationRowModel()
      table.setRowSelection((old) => {
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
      table.setRowSelection((old) => {
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
    setRowSelection: makeStateUpdater('rowSelection', {} as any) as any,
    resetRowSelection: (defaultState?: boolean) => {
      table.setRowSelection(defaultState ? {} : table.getState().rowSelection)
    },

    // Visibility API
    setColumnVisibility: makeStateUpdater('columnVisibility', {} as any) as any,
    resetColumnVisibility: (defaultState?: boolean) => {
      table.setColumnVisibility(defaultState ? {} : table.getState().columnVisibility)
    },
    toggleAllColumnsVisible: (value?: boolean) => {
      const allColumns = table.getAllLeafColumns()
      table.setColumnVisibility((old) => {
        const next = { ...old }
        const shouldShow = value ?? !table.getIsAllColumnsVisible()
        for (const col of allColumns) {
          next[col.id] = shouldShow
        }
        return next
      })
    },
    getIsAllColumnsVisible: () => {
      return table.getAllLeafColumns().every((col) => col.getIsVisible())
    },
    getIsSomeColumnsVisible: () => {
      return table.getAllLeafColumns().some((col) => col.getIsVisible())
    },

    // Column Order API
    setColumnOrder: makeStateUpdater('columnOrder', {} as any) as any,
    resetColumnOrder: (defaultState?: boolean) => {
      table.setColumnOrder(defaultState ? [] : table.getState().columnOrder)
    },

    // Column Pinning API
    setColumnPinning: makeStateUpdater('columnPinning', {} as any) as any,
    resetColumnPinning: (defaultState?: boolean) => {
      table.setColumnPinning(
        defaultState ? { left: [], right: [] } : table.getState().columnPinning
      )
    },
    getIsSomeColumnsPinned: (position?: 'left' | 'right') => {
      const pinning = table.getState().columnPinning
      if (position === 'left') return (pinning.left?.length ?? 0) > 0
      if (position === 'right') return (pinning.right?.length ?? 0) > 0
      return (pinning.left?.length ?? 0) > 0 || (pinning.right?.length ?? 0) > 0
    },

    // Column Sizing API
    setColumnSizing: makeStateUpdater('columnSizing', {} as any) as any,
    setColumnSizingInfo: makeStateUpdater('columnSizingInfo', {} as any) as any,
    resetColumnSizing: (defaultState?: boolean) => {
      table.setColumnSizing(defaultState ? {} : table.getState().columnSizing)
    },
    getTotalSize: () => {
      return table.getVisibleFlatColumns().reduce((sum, col) => sum + col.getSize(), 0)
    },
    getLeftTotalSize: () => {
      return table.getLeftVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)
    },
    getRightTotalSize: () => {
      return table.getRightVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)
    },
    getCenterTotalSize: () => {
      return table.getCenterVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)
    },

    // Expanding API
    setExpanded: makeStateUpdater('expanded', {} as any) as any,
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
    getCanSomeRowsExpand: () => {
      return table.getPreExpandedRowModel().flatRows.some((r) => r.getCanExpand())
    },
    getIsAllRowsExpanded: () => {
      const rowModel = table.getPreExpandedRowModel()
      const expanded = table.getState().expanded
      if (expanded === true) return true
      const expandableRows = rowModel.flatRows.filter((r) => r.subRows.length > 0)
      return expandableRows.length > 0 && expandableRows.every((r) => (expanded as Record<string, boolean>)[r.id])
    },
    getIsSomeRowsExpanded: () => {
      const expanded = table.getState().expanded
      if (expanded === true) return true
      return Object.keys(expanded as Record<string, boolean>).length > 0
    },
    getExpandedDepth: () => {
      const expanded = table.getState().expanded
      if (expanded === true) return Infinity
      let maxDepth = 0
      const rowModel = table.getPreExpandedRowModel()
      for (const row of rowModel.flatRows) {
        if ((expanded as Record<string, boolean>)[row.id]) {
          maxDepth = Math.max(maxDepth, row.depth)
        }
      }
      return maxDepth
    },
    getExpandedRowModel: () => table.getCoreRowModel(),

    // Row Pinning API
    setRowPinning: makeStateUpdater('rowPinning', {} as any) as any,
    resetRowPinning: (defaultState?: boolean) => {
      table.setRowPinning(
        defaultState ? { top: [], bottom: [] } : table.getState().rowPinning
      )
    },
    getTopRows: () => {
      const pinning = table.getState().rowPinning
      const rowModel = table.getCoreRowModel()
      return (pinning.top ?? [])
        .map((id) => rowModel.rowsById[id])
        .filter(Boolean) as Row<TData>[]
    },
    getBottomRows: () => {
      const pinning = table.getState().rowPinning
      const rowModel = table.getCoreRowModel()
      return (pinning.bottom ?? [])
        .map((id) => rowModel.rowsById[id])
        .filter(Boolean) as Row<TData>[]
    },
    getCenterRows: () => {
      const pinning = table.getState().rowPinning
      const rowModel = table.getRowModel()
      const pinned = new Set([...(pinning.top ?? []), ...(pinning.bottom ?? [])])
      return rowModel.rows.filter((row) => !pinned.has(row.id))
    },

    // Grouping API
    setGrouping: makeStateUpdater('grouping', {} as any) as any,
    resetGrouping: (defaultState?: boolean) => {
      table.setGrouping(defaultState ? [] : table.getState().grouping)
    },

    // Internal
    _features: [],
    initialState: getInitialState(),

    // Editing API
    setEditing: makeStateUpdater('editing', {} as any) as any,
    startEditing: (rowId: string, columnId: string) => {
      table.setEditing((old: any) => ({
        ...old,
        activeCell: { rowId, columnId },
      }))
    },
    commitEdit: () => {
      const editing = table.getState().editing
      if (editing?.activeCell) {
        table.setEditing((old: any) => ({
          ...old,
          activeCell: undefined,
        }))
      }
    },
    cancelEdit: () => {
      table.setEditing((old: any) => ({
        ...old,
        activeCell: undefined,
      }))
    },
    resetEditing: (defaultState?: boolean) => {
      table.setEditing(
        defaultState
          ? { pendingValues: {} } as EditingState
          : table.getState().editing
      )
    },
    setPendingValue: (rowId: string, columnId: string, value: unknown) => {
      table.setEditing((old: any) => ({
        ...old,
        pendingValues: {
          ...(old?.pendingValues ?? {}),
          [rowId]: {
            ...((old?.pendingValues ?? {})[rowId] ?? {}),
            [columnId]: value,
          },
        },
      }))
    },
    getPendingValue: (rowId: string, columnId: string) => {
      const editing = table.getState().editing as any
      return editing?.pendingValues?.[rowId]?.[columnId]
    },
    getPendingRow: (rowId: string) => {
      const editing = table.getState().editing as any
      return editing?.pendingValues?.[rowId] as any
    },
    getAllPendingChanges: () => {
      const editing = table.getState().editing as any
      return editing?.pendingValues ?? {}
    },
    hasPendingChanges: () => {
      return Object.keys(table.getAllPendingChanges()).length > 0
    },
    isValid: () => {
      return Object.keys(table.getValidationErrors()).length === 0
    },
    commitAllPending: () => {
      const changes = table.getAllPendingChanges()
      resolvedOptions.onEditCommit?.(changes)
      table.setEditing((old: any) => ({
        ...old,
        pendingValues: {},
      }))
    },
    discardAllPending: () => {
      table.setEditing((old: any) => ({
        ...old,
        pendingValues: {},
      }))
    },
    getValidationErrors: () => {
      const editing = table.getState().editing as any
      return editing?.validationErrors ?? {}
    },

    // Export API
    exportData: (opts?: ExportOptions) => {
      const rowModel = opts?.allRows ? table.getPrePaginationRowModel() : table.getRowModel()
      const columns = opts?.columns
        ? table.getAllLeafColumns().filter((col) => opts.columns!.includes(col.id))
        : table.getVisibleLeafColumns()

      if (opts?.format === 'json' || !opts?.format) {
        const data = rowModel.rows.map((row) => {
          const obj: Record<string, unknown> = {}
          for (const col of columns) {
            obj[col.id] = row.getValue(col.id)
          }
          return obj
        })
        return JSON.stringify(data, null, 2)
      }

      if (opts?.format === 'csv') {
        const headers = columns.map((col) => {
          const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id
          return escapeCSV(header)
        })

        const rows = rowModel.rows.map((row) =>
          columns.map((col) => escapeCSV(String(row.getValue(col.id) ?? ''))).join(',')
        )

        return [headers.join(','), ...rows].join('\n')
      }

      return ''
    },

    // Pagination state setters
    setPagination: makeStateUpdater('pagination', {} as any) as any,

    // Events
    events,
  }

  // ---------------------------------------------------------------------------
  // Wire up state updaters to use table instance
  // ---------------------------------------------------------------------------

  const wireUpdater = <V>(key: string) => {
    return makeStateUpdater(key as any, table as any) as (updater: Updater<V>) => void
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
  table.setPagination = wireUpdater<PaginationState>('pagination')

  // ---------------------------------------------------------------------------
  // Column Processing
  // ---------------------------------------------------------------------------

  const processColumns = memo(
    () => [resolvedOptions.columns, resolvedOptions.state?.columnOrder],
    (columnDefs) => {
      const allColumns: Column<TData, any>[] = []
      const allFlatColumns: Column<TData, any>[] = []

      const processColumnDef = (
        colDef: ColumnDef<TData, any>,
        depth: number,
        parent?: Column<TData, any>
      ): Column<TData, any> => {
        const column = createColumn(table, colDef, depth, parent)
        allColumns.push(column)

        if ('columns' in colDef && colDef.columns?.length) {
          column.columns = colDef.columns.map((subDef) =>
            processColumnDef(subDef as any, depth + 1, column)
          )
        } else {
          allFlatColumns.push(column)
        }

        return column
      }

      const topLevel = columnDefs.map((def: any) => processColumnDef(def, 0))

      return {
        topLevel,
        allColumns,
        allFlatColumns,
        allLeafColumns: allFlatColumns,
      }
    },
    { key: 'processColumns' }
  )

  table.getAllColumns = () => processColumns().allColumns
  table.getAllFlatColumns = () => processColumns().allFlatColumns
  table.getAllLeafColumns = () => processColumns().allLeafColumns
  table.getColumn = (id: string) => processColumns().allColumns.find((c) => c.id === id)

  // Visible columns with ordering and pinning
  table.getVisibleFlatColumns = memo(
    () => [table.getAllLeafColumns(), table.getState().columnVisibility, table.getState().columnOrder],
    (allLeaf: Column<TData, any>[]) => {
      let cols = allLeaf.filter((col: Column<TData, any>) => col.getIsVisible())
      const order = table.getState().columnOrder
      if (order.length) {
        const orderMap = new Map(order.map((id: string, i: number) => [id, i]))
        cols = cols.sort((a: Column<TData, any>, b: Column<TData, any>) => {
          const ai = orderMap.get(a.id) ?? Infinity
          const bi = orderMap.get(b.id) ?? Infinity
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
    (visible: Column<TData, any>[]) => {
      const pinned = table.getState().columnPinning.left ?? []
      return visible.filter((col: Column<TData, any>) => pinned.includes(col.id))
    },
    { key: 'getLeftVisibleLeafColumns' }
  )

  table.getRightVisibleLeafColumns = memo(
    () => [table.getVisibleFlatColumns(), table.getState().columnPinning],
    (visible: Column<TData, any>[]) => {
      const pinned = table.getState().columnPinning.right ?? []
      return visible.filter((col: Column<TData, any>) => pinned.includes(col.id))
    },
    { key: 'getRightVisibleLeafColumns' }
  )

  table.getCenterVisibleLeafColumns = memo(
    () => [table.getVisibleFlatColumns(), table.getState().columnPinning],
    (visible: Column<TData, any>[]) => {
      const left = new Set(table.getState().columnPinning.left ?? [])
      const right = new Set(table.getState().columnPinning.right ?? [])
      return visible.filter((col: Column<TData, any>) => !left.has(col.id) && !right.has(col.id))
    },
    { key: 'getCenterVisibleLeafColumns' }
  )

  // ---------------------------------------------------------------------------
  // Header Groups
  // ---------------------------------------------------------------------------

  table.getHeaderGroups = memo(
    () => [table.getAllColumns(), table.getState().columnVisibility, table.getState().columnPinning],
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
        headers: group.headers.filter((h: any) => leftIds.has(h.column.id)),
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
        headers: group.headers.filter((h: any) => rightIds.has(h.column.id)),
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
          (h: any) => !leftIds.has(h.column.id) && !rightIds.has(h.column.id)
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

  // 1. Core Row Model — raw data → Row[]
  table.getCoreRowModel = memo(
    () => [resolvedOptions.data],
    (data: TData[]) => {
      const rows: Row<TData>[] = data.map((original: TData, index: number) => {
        const id = resolvedOptions.getRowId
          ? resolvedOptions.getRowId(original, index)
          : String(index)

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
        const column = table.getColumn(filter.id)
        if (!column) continue

        filtered = filtered.filter((row: Row<TData>) => {
          const value = row.getValue(filter.id)
          const filterFn = column.getFilterFn()

          if (filterFn) {
            return filterFn(row, filter.id, filter.value, () => {})
          }

          // Default string include filter
          return String(value ?? '')
            .toLowerCase()
            .includes(String(filter.value ?? '').toLowerCase())
        })
      }

      // Apply global filter
      if (globalFilter) {
        const searchStr = String(globalFilter).toLowerCase()
        filtered = filtered.filter((row: Row<TData>) => {
          return table.getAllLeafColumns().some((col: Column<TData, any>) => {
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
          const column = table.getColumn(sort.id)
          if (!column) continue

          const aVal = a.getValue(sort.id)
          const bVal = b.getValue(sort.id)

          // Custom sort function
          const sortFn = column.getSortingFn()
          if (sortFn) {
            const result = sortFn(a, b, sort.id)
            if (result !== 0) return sort.desc ? -result : result
            continue
          }

          // Default comparison
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

  return table
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
