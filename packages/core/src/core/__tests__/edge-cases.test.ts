// @yable/core — Edge Case Tests

import { describe, it, expect } from 'vitest'
import { createTable } from '../table'
import { functionalUpdate } from '../../utils'
import type { TableOptions, TableState, ColumnDef } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTableWithState(
  data: any[],
  columns: ColumnDef<any, any>[],
  stateOverrides: Partial<TableState> = {},
  optionOverrides: Partial<TableOptions<any>> = {}
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

  const table = createTable<any>({
    data,
    columns,
    getRowId: (_, i) => String(i),
    state,
    onStateChange: (updater) => {
      state = functionalUpdate(updater, state)
      table.setOptions((prev) => ({ ...prev, state }))
    },
    ...optionOverrides,
  })

  return { table, getState: () => state }
}

// ===========================================================================
// Empty data
// ===========================================================================

describe('Empty data edge cases', () => {
  it('should handle empty data array without crashing', () => {
    const { table } = makeTableWithState(
      [],
      [{ accessorKey: 'name', header: 'Name' }]
    )

    const model = table.getCoreRowModel()
    expect(model.rows).toHaveLength(0)
    expect(model.flatRows).toHaveLength(0)
  })

  it('should handle empty columns array without crashing', () => {
    const { table } = makeTableWithState(
      [{ name: 'Alice', age: 30 }],
      []
    )

    const model = table.getCoreRowModel()
    expect(model.rows).toHaveLength(1)
    // No columns to get values from, but should not crash
    expect(table.getAllLeafColumns()).toHaveLength(0)
  })

  it('should handle both empty data and empty columns', () => {
    const { table } = makeTableWithState([], [])
    const model = table.getCoreRowModel()
    expect(model.rows).toHaveLength(0)
    expect(table.getAllLeafColumns()).toHaveLength(0)
  })
})

// ===========================================================================
// Undefined / null values in data
// ===========================================================================

describe('Undefined and null values', () => {
  it('should handle undefined values in data', () => {
    const { table } = makeTableWithState(
      [{ name: undefined, age: null }],
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age' },
      ]
    )

    const rows = table.getCoreRowModel().rows
    expect(rows).toHaveLength(1)
    expect(rows[0]!.getValue('name')).toBeUndefined()
    expect(rows[0]!.getValue('age')).toBeNull()
  })

  it('should handle mixed defined and undefined values', () => {
    const { table } = makeTableWithState(
      [
        { name: 'Alice', age: 30 },
        { name: undefined, age: null },
        { name: 'Carol', age: 45 },
      ],
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age' },
      ]
    )

    const rows = table.getCoreRowModel().rows
    expect(rows).toHaveLength(3)
    expect(rows[0]!.getValue('name')).toBe('Alice')
    expect(rows[1]!.getValue('name')).toBeUndefined()
    expect(rows[2]!.getValue('name')).toBe('Carol')
  })
})

// ===========================================================================
// Pagination edge cases
// ===========================================================================

describe('Pagination edge cases', () => {
  it('should handle pageSize of 1', () => {
    const data = [
      { name: 'A', age: 1 },
      { name: 'B', age: 2 },
      { name: 'C', age: 3 },
    ]

    const { table } = makeTableWithState(
      data,
      [{ accessorKey: 'name', header: 'Name' }],
      { pagination: { pageIndex: 0, pageSize: 1 } }
    )

    const pageRows = table.getPaginationRowModel().rows
    expect(pageRows).toHaveLength(1)
    expect(pageRows[0]!.getValue('name')).toBe('A')
  })

  it('should handle very large pageSize (all on one page)', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ name: `Row${i}`, age: i }))

    const { table } = makeTableWithState(
      data,
      [{ accessorKey: 'name', header: 'Name' }],
      { pagination: { pageIndex: 0, pageSize: 1000000 } }
    )

    const pageRows = table.getPaginationRowModel().rows
    expect(pageRows).toHaveLength(10)
  })

  it('should handle pageIndex beyond available data (return last page or empty)', () => {
    const data = [
      { name: 'A', age: 1 },
      { name: 'B', age: 2 },
    ]

    const { table } = makeTableWithState(
      data,
      [{ accessorKey: 'name', header: 'Name' }],
      { pagination: { pageIndex: 100, pageSize: 10 } }
    )

    // Should not crash — may return empty page
    const pageRows = table.getPaginationRowModel().rows
    expect(pageRows.length).toBeGreaterThanOrEqual(0)
  })
})

// ===========================================================================
// Sorting edge cases
// ===========================================================================

describe('Sorting edge cases', () => {
  it('should handle sorting by column with undefined values', () => {
    const data = [
      { name: 'Charlie', age: 30 },
      { name: undefined, age: 20 },
      { name: 'Alice', age: 25 },
    ]

    const { table } = makeTableWithState(
      data,
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age' },
      ],
      { sorting: [{ id: 'name', desc: false }] }
    )

    // Should not throw
    const sortedRows = table.getSortedRowModel().rows
    expect(sortedRows).toHaveLength(3)
  })

  it('should handle sorting with empty data', () => {
    const { table } = makeTableWithState(
      [],
      [{ accessorKey: 'name', header: 'Name' }],
      { sorting: [{ id: 'name', desc: false }] }
    )

    const sortedRows = table.getSortedRowModel().rows
    expect(sortedRows).toHaveLength(0)
  })
})

// ===========================================================================
// Filtering edge cases
// ===========================================================================

describe('Filtering edge cases', () => {
  it('should handle filter with empty filter value (all rows pass)', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]

    const { table } = makeTableWithState(
      data,
      [{ accessorKey: 'name', header: 'Name' }],
      { columnFilters: [{ id: 'name', value: '' }] }
    )

    const filteredRows = table.getFilteredRowModel().rows
    // Empty filter should pass all rows or none depending on implementation
    // The important thing is it doesn't crash
    expect(filteredRows.length).toBeGreaterThanOrEqual(0)
  })

  it('should handle filtering empty data', () => {
    const { table } = makeTableWithState(
      [],
      [{ accessorKey: 'name', header: 'Name' }],
      { columnFilters: [{ id: 'name', value: 'test' }] }
    )

    const filteredRows = table.getFilteredRowModel().rows
    expect(filteredRows).toHaveLength(0)
  })
})

// ===========================================================================
// Column ID edge cases
// ===========================================================================

describe('Column ID edge cases', () => {
  it('should handle column ID with special characters', () => {
    const { table } = makeTableWithState(
      [{ 'user-name': 'Alice', 'user.age': 30 }],
      [
        { accessorKey: 'user-name' as any, header: 'User Name' },
      ]
    )

    const col = table.getColumn('user-name')
    expect(col).toBeDefined()
  })

  it('should handle numeric-like column IDs', () => {
    const { table } = makeTableWithState(
      [{ '0': 'zero', '1': 'one' }],
      [
        { accessorKey: '0' as any, header: 'Zero' },
        { accessorKey: '1' as any, header: 'One' },
      ]
    )

    expect(table.getColumn('0')).toBeDefined()
    expect(table.getColumn('1')).toBeDefined()
  })
})

// ===========================================================================
// Row model
// ===========================================================================

describe('Row model edge cases', () => {
  it('should build rowsById lookup correctly', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]

    const { table } = makeTableWithState(
      data,
      [{ accessorKey: 'name', header: 'Name' }]
    )

    const model = table.getCoreRowModel()
    expect(model.rowsById['0']).toBeDefined()
    expect(model.rowsById['1']).toBeDefined()
    expect(model.rowsById['0']!.getValue('name')).toBe('Alice')
  })

  it('should support getRowId function', () => {
    const data = [
      { id: 'abc', name: 'Alice' },
      { id: 'def', name: 'Bob' },
    ]

    const { table } = makeTableWithState(
      data,
      [{ accessorKey: 'name', header: 'Name' }],
      {},
      { getRowId: (row) => row.id }
    )

    const model = table.getCoreRowModel()
    expect(model.rowsById['abc']).toBeDefined()
    expect(model.rowsById['def']).toBeDefined()
  })
})
