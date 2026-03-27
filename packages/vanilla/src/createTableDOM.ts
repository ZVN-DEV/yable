// @yable/vanilla — createTableDOM factory

import {
  createTable,
  functionalUpdate,
  type RowData,
  type TableOptions,
  type TableState,
  type Table,
  type Updater,
} from '@yable/core'
import { renderTable, renderPagination } from './renderer'
import { attachEventDelegation, type VanillaEventHandlers, type VanillaEventHandler } from './events'

export interface CreateTableDOMOptions<TData extends RowData> extends Omit<TableOptions<TData>, 'state' | 'onStateChange'> {
  element: HTMLElement
  /** Optional initial state override */
  initialState?: Partial<TableState>

  // Display options
  stickyHeader?: boolean
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  theme?: string
  clickableRows?: boolean
  footer?: boolean
  emptyMessage?: string

  // Pagination display options
  pagination?: boolean | {
    showPageSize?: boolean
    pageSizes?: number[]
    showInfo?: boolean
  }
}

export interface TableDOM<TData extends RowData> {
  /** The underlying core table instance */
  table: Table<TData>
  /** Re-render the table */
  render: () => void
  /** Update data and re-render */
  setData: (data: TData[]) => void
  /** Get current state */
  getState: () => TableState
  /** Update table options */
  setOptions: (opts: Partial<CreateTableDOMOptions<TData>>) => void
  /** Register event handler */
  on: (event: string, handler: VanillaEventHandler) => void
  /** Remove event handler */
  off: (event: string) => void
  /** Destroy the table instance and clean up */
  destroy: () => void
}

export function createTableDOM<TData extends RowData>(
  options: CreateTableDOMOptions<TData>
): TableDOM<TData> {
  const { element, initialState, ...tableOpts } = options
  const {
    stickyHeader,
    striped,
    bordered,
    compact,
    theme,
    clickableRows,
    footer,
    emptyMessage,
    pagination: paginationOpts,
    ...coreOptions
  } = tableOpts

  // Internal state
  let state: TableState = {
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
    ...initialState,
  }

  // Display options (mutable for updates)
  let displayOpts = {
    stickyHeader,
    striped,
    bordered,
    compact,
    theme,
    clickableRows,
    footer,
    emptyMessage,
  }

  let paginationDisplayOpts = typeof paginationOpts === 'object'
    ? paginationOpts
    : paginationOpts
      ? {}
      : undefined

  // Event handlers (registered via .on())
  const handlers: VanillaEventHandlers = {}

  // Create core table
  const coreTable = createTable<TData>({
    ...coreOptions,
    state,
    onStateChange: (updater: Updater<TableState>) => {
      state = functionalUpdate(updater, state)
      render()
    },
  } as TableOptions<TData>)

  let cleanupEvents: (() => void) | null = null

  function render() {
    // Update state on the core instance
    coreTable.setOptions((prev) => ({
      ...prev,
      ...coreOptions,
      state,
      onStateChange: (updater: Updater<TableState>) => {
        state = functionalUpdate(updater, state)
        render()
      },
    }))

    // Clean up old event listeners
    cleanupEvents?.()

    // Generate HTML
    let html = renderTable(coreTable, displayOpts)

    if (paginationDisplayOpts !== undefined) {
      html += renderPagination(coreTable, paginationDisplayOpts)
    }

    element.innerHTML = html

    // Re-attach event delegation
    cleanupEvents = attachEventDelegation(element, coreTable, handlers, render)
  }

  // Initial render
  render()

  const instance: TableDOM<TData> = {
    table: coreTable,

    render,

    setData(data: TData[]) {
      coreTable.setOptions((prev) => ({
        ...prev,
        data,
        state,
        onStateChange: (updater: Updater<TableState>) => {
          state = functionalUpdate(updater, state)
          render()
        },
      }))
      render()
    },

    getState() {
      return state
    },

    setOptions(opts) {
      const { element: _el, initialState: _is, ...rest } = opts as any
      const {
        stickyHeader: sh, striped: st, bordered: bd, compact: cp,
        theme: th, clickableRows: cr, footer: ft, emptyMessage: em,
        pagination: pg,
        ...core
      } = rest

      if (sh !== undefined || st !== undefined || bd !== undefined || cp !== undefined || th !== undefined || cr !== undefined || ft !== undefined || em !== undefined) {
        displayOpts = { ...displayOpts, stickyHeader: sh ?? displayOpts.stickyHeader, striped: st ?? displayOpts.striped, bordered: bd ?? displayOpts.bordered, compact: cp ?? displayOpts.compact, theme: th ?? displayOpts.theme, clickableRows: cr ?? displayOpts.clickableRows, footer: ft ?? displayOpts.footer, emptyMessage: em ?? displayOpts.emptyMessage }
      }

      if (pg !== undefined) {
        paginationDisplayOpts = typeof pg === 'object' ? pg : pg ? {} : undefined
      }

      if (Object.keys(core).length > 0) {
        Object.assign(coreOptions, core)
      }

      render()
    },

    on(event: string, handler: VanillaEventHandler) {
      handlers[event] = handler
    },

    off(event: string) {
      delete handlers[event]
    },

    destroy() {
      cleanupEvents?.()
      element.innerHTML = ''
    },
  }

  return instance
}
