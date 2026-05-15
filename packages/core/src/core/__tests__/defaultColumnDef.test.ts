// @zvndev/yable-core — defaultColumnDef Tests

import { describe, it, expect } from 'vitest'
import { createTable } from '../table'
import { functionalUpdate } from '../../utils'
import type { TableState, ColumnDef } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestData {
  name: string
  age: number
  email: string
}

function makeTable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TValue variance
  colDefs: ColumnDef<TestData, any>[],
  defaultColumnDef?: Record<string, unknown>,
  stateOverrides: Partial<TableState> = {},
) {
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
    ...stateOverrides,
  }

  const table = createTable<TestData>({
    data: [
      { name: 'Alice', age: 30, email: 'alice@test.com' },
      { name: 'Bob', age: 25, email: 'bob@test.com' },
    ],
    columns: colDefs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper uses loose typing for defaultColumnDef
    defaultColumnDef: defaultColumnDef as any,
    getRowId: (_, i) => String(i),
    state,
    onStateChange: (updater) => {
      state = functionalUpdate(updater, state)
      table.setOptions((prev) => ({ ...prev, state }))
    },
  })

  return { table, getState: () => state }
}

// ===========================================================================
// defaultColumnDef — applies defaults to all columns
// ===========================================================================

describe('defaultColumnDef', () => {
  it('applies default size to all columns', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age' },
        { accessorKey: 'email', header: 'Email' },
      ],
      { size: 200 },
    )

    expect(table.getColumn('name')!.getSize()).toBe(200)
    expect(table.getColumn('age')!.getSize()).toBe(200)
    expect(table.getColumn('email')!.getSize()).toBe(200)
  })

  it('column-specific size overrides default', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name', size: 300 },
        { accessorKey: 'age', header: 'Age' },
      ],
      { size: 200 },
    )

    expect(table.getColumn('name')!.getSize()).toBe(300)
    expect(table.getColumn('age')!.getSize()).toBe(200)
  })

  it('applies enableSorting default to all columns', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age' },
      ],
      { enableSorting: false },
    )

    expect(table.getColumn('name')!.getCanSort()).toBe(false)
    expect(table.getColumn('age')!.getCanSort()).toBe(false)
  })

  it('column-specific enableSorting overrides default', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name', enableSorting: true },
        { accessorKey: 'age', header: 'Age' },
      ],
      { enableSorting: false },
    )

    expect(table.getColumn('name')!.getCanSort()).toBe(true)
    expect(table.getColumn('age')!.getCanSort()).toBe(false)
  })

  it('applies enableResizing default to all columns', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age' },
      ],
      { enableResizing: false },
    )

    expect(table.getColumn('name')!.getCanResize()).toBe(false)
    expect(table.getColumn('age')!.getCanResize()).toBe(false)
  })

  it('applies enableHiding default to all columns', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age' },
      ],
      { enableHiding: false },
    )

    expect(table.getColumn('name')!.getCanHide()).toBe(false)
    expect(table.getColumn('age')!.getCanHide()).toBe(false)
  })

  it('applies enableColumnFilter default to all columns', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age' },
      ],
      { enableColumnFilter: false },
    )

    expect(table.getColumn('name')!.getCanFilter()).toBe(false)
    expect(table.getColumn('age')!.getCanFilter()).toBe(false)
  })

  it('applies minSize and maxSize defaults', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name', size: 50 },
        { accessorKey: 'age', header: 'Age', size: 500 },
      ],
      { minSize: 100, maxSize: 400 },
    )

    // size 50 clamped up to minSize 100
    expect(table.getColumn('name')!.getSize()).toBe(100)
    // size 500 clamped down to maxSize 400
    expect(table.getColumn('age')!.getSize()).toBe(400)
  })

  it('works without defaultColumnDef (no-op)', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
    ])

    // Default size of 150 when no defaultColumnDef
    expect(table.getColumn('name')!.getSize()).toBe(150)
    expect(table.getColumn('age')!.getSize()).toBe(150)
  })

  it('applies default header to columns without explicit header', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name' }, { accessorKey: 'age', header: 'Custom Age' }],
      { header: 'Default Header' },
    )

    // Column without explicit header inherits the default
    const nameCol = table.getColumn('name')!
    expect(nameCol.columnDef.header).toBe('Default Header')

    // Column with explicit header keeps its own
    const ageCol = table.getColumn('age')!
    expect(ageCol.columnDef.header).toBe('Custom Age')
  })

  it('applies cellClassName default', () => {
    const { table } = makeTable(
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age', cellClassName: 'custom-cell' },
      ],
      { cellClassName: 'default-cell' },
    )

    const nameDef = table.getColumn('name')!.columnDef as { cellClassName?: string }
    const ageDef = table.getColumn('age')!.columnDef as { cellClassName?: string }

    expect(nameDef.cellClassName).toBe('default-cell')
    expect(ageDef.cellClassName).toBe('custom-cell')
  })
})
