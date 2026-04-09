// @zvndev/yable-core — Shared test fixtures
//
// A small, opt-in factory that builds valid `TableState` objects, sample
// column defs, sample row data, and full `createTable` instances for tests.
//
// These helpers exist so new tests don't have to repeat the ~30-line
// TableState boilerplate that currently lives in cell.test.ts and
// keyboardNavigation.test.ts. Existing tests are intentionally left alone —
// consumers opt in by importing from `../__tests__/helpers` (path depth
// depends on where the test file lives).
//
// Import rule: everything here is imported via workspace-relative paths
// (`../../types`, `../../index`, etc.) — never via `@zvndev/yable-core` —
// so the helpers compile against the in-repo source, not the published
// build output.

import { createTable } from '../../core/table'
import { createColumnHelper } from '../../columnHelper'
import type { ColumnDef, RowData, Table, TableOptions, TableState } from '../../types'

// ---------------------------------------------------------------------------
// Default row shape
// ---------------------------------------------------------------------------

/**
 * The default row shape produced by {@link makeRows} and consumed by
 * {@link makeColumnDefs}. Tests that need a different shape can pass their
 * own column defs / data and only reuse {@link makeTableState}.
 */
export interface TestRow extends RowData {
  id: string
  name: string
  age: number
  email: string
}

// ---------------------------------------------------------------------------
// makeTableState
// ---------------------------------------------------------------------------

/**
 * Build a fully-populated, valid {@link TableState} for tests.
 *
 * Every required slice of `TableState` is initialised to an empty/default
 * value so the returned object satisfies the type without the caller having
 * to know about every feature slice (commits, pivot, formulas, etc.).
 *
 * Callers can pass `overrides` to patch individual top-level slices. The
 * merge is shallow — nested objects are replaced wholesale, matching how
 * tests typically reason about state slices.
 *
 * @example
 *   const state = makeTableState({ globalFilter: 'alice' })
 *   const state = makeTableState({
 *     pagination: { pageIndex: 2, pageSize: 25 },
 *   })
 */
export function makeTableState(overrides: Partial<TableState> = {}): TableState {
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

// ---------------------------------------------------------------------------
// makeColumnDefs
// ---------------------------------------------------------------------------

/**
 * Produce a small, sensible default column set for the {@link TestRow}
 * shape: `id`, `name`, `age`, `email`.
 *
 * Uses {@link createColumnHelper} internally so the returned defs look
 * exactly like what end-users would write. Useful when a test just needs
 * "some columns" and doesn't care about the specific schema.
 *
 * For custom row shapes, pass the type parameter — but note that the
 * returned defs are still shaped for {@link TestRow}, so you'll usually
 * want to write your own column defs in that case.
 */
export function makeColumnDefs(): ColumnDef<TestRow, any>[] {
  const helper = createColumnHelper<TestRow>()
  return [
    helper.accessor('id', { header: 'ID' }),
    helper.accessor('name', { header: 'Name' }),
    helper.accessor('age', { header: 'Age' }),
    helper.accessor('email', { header: 'Email' }),
  ]
}

// ---------------------------------------------------------------------------
// makeRows
// ---------------------------------------------------------------------------

/**
 * Build `n` rows of deterministic sample data matching {@link TestRow}.
 *
 * Values are derived from the row index so tests can make stable
 * assertions (e.g. row 0 is always `Person 0 / age 20 / person0@example.com`).
 *
 * @param n  Number of rows to generate. Must be >= 0.
 */
export function makeRows(n: number): TestRow[] {
  if (n < 0) {
    throw new Error(`makeRows: expected n >= 0, got ${n}`)
  }
  const rows: TestRow[] = []
  for (let i = 0; i < n; i++) {
    rows.push({
      id: String(i),
      name: `Person ${i}`,
      age: 20 + (i % 50),
      email: `person${i}@example.com`,
    })
  }
  return rows
}

// ---------------------------------------------------------------------------
// makeTestTable
// ---------------------------------------------------------------------------

/**
 * Options for {@link makeTestTable}. All fields are optional.
 */
export interface MakeTestTableOptions {
  /** Number of rows to seed. Defaults to 3. */
  rowCount?: number
  /** Override the default column set. */
  columns?: ColumnDef<TestRow, any>[]
  /** Override the default row data (wins over `rowCount`). */
  data?: TestRow[]
  /** Partial TableState overrides, merged into the default state. */
  stateOverrides?: Partial<TableState>
  /** Extra {@link TableOptions} to pass through to `createTable`. */
  tableOptions?: Partial<TableOptions<TestRow>>
}

/**
 * Result shape from {@link makeTestTable}: a live table instance plus a
 * `getState` accessor so tests can assert on the current state without
 * reaching into the table internals.
 */
export interface TestTableHandle {
  table: Table<TestRow>
  getState: () => TableState
}

/**
 * Build a real, live {@link Table} instance wired up with:
 * - default column defs from {@link makeColumnDefs}
 * - `rowCount` rows of sample data from {@link makeRows} (default 3)
 * - a valid default {@link TableState} from {@link makeTableState}
 * - an `onStateChange` callback that mutates local state and re-applies it
 *
 * Use this for smoke-test-style assertions where you just want a working
 * table and don't care about the specific shape beyond "it has rows and
 * columns". For more surgical tests, call {@link makeTableState} /
 * {@link makeColumnDefs} / {@link makeRows} directly and assemble your own.
 *
 * @example
 *   const { table, getState } = makeTestTable({ rowCount: 5 })
 *   expect(table.getRowModel().rows).toHaveLength(5)
 *   expect(getState().globalFilter).toBe('')
 */
export function makeTestTable(opts: MakeTestTableOptions = {}): TestTableHandle {
  const columns = opts.columns ?? makeColumnDefs()
  const data = opts.data ?? makeRows(opts.rowCount ?? 3)

  let state: TableState = makeTableState(opts.stateOverrides)

  const table = createTable<TestRow>({
    data,
    columns,
    getRowId: (row, i) => (row.id !== undefined ? row.id : String(i)),
    state,
    onStateChange: (updater) => {
      state =
        typeof updater === 'function'
          ? (updater as (prev: TableState) => TableState)(state)
          : updater
      table.setOptions((prev) => ({ ...prev, state }))
    },
    ...opts.tableOptions,
  })

  return { table, getState: () => state }
}
