// Shared test harness for core behavioral suites. Not a test file itself
// (vitest only picks up *.test.ts), so it runs nothing on its own.

import { createTable } from '../table'
import { functionalUpdate } from '../../utils'
import type { TableState, TableOptions, RowData, Table } from '../../types'

export function baseState(overrides: Partial<TableState> = {}): TableState {
  return {
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
    ...overrides,
  }
}

/** Create a controlled table with local state, mirroring how consumers wire it. */
export function makeTable<T extends RowData>(
  data: T[],
  columns: TableOptions<T>['columns'],
  opts: Partial<TableOptions<T>> = {},
): { table: Table<T>; getState: () => TableState } {
  let state = baseState(opts.initialState)
  const table = createTable<T>({
    data,
    columns,
    getRowId: (row) => String((row as unknown as { id: unknown }).id),
    ...opts,
    state,
    onStateChange: (updater) => {
      state = functionalUpdate(updater, state)
      table.setOptions((prev) => ({ ...prev, state }))
    },
  })
  return { table, getState: () => state }
}
