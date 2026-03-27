// @yable/core — Core test suite

import { describe, it, expect, vi } from 'vitest'
import { createTable } from './core/table'
import { createColumnHelper } from './columnHelper'
import { sortingFns } from './sortingFns'
import { filterFns } from './filterFns'
import { aggregationFns } from './aggregationFns'
import { EventEmitterImpl } from './events/EventEmitter'
import { functionalUpdate, memo, shallowEqual, range, clamp } from './utils'
import type { TableOptions, TableState, RowData } from './types'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
interface Person {
  id: number
  firstName: string
  lastName: string
  age: number
  department: string
  salary: number
  active: boolean
}

const testData: Person[] = [
  { id: 1, firstName: 'Alice', lastName: 'Johnson', age: 32, department: 'Engineering', salary: 125000, active: true },
  { id: 2, firstName: 'Bob', lastName: 'Smith', age: 28, department: 'Design', salary: 95000, active: true },
  { id: 3, firstName: 'Carol', lastName: 'Williams', age: 45, department: 'Engineering', salary: 210000, active: true },
  { id: 4, firstName: 'David', lastName: 'Brown', age: 35, department: 'Product', salary: 140000, active: false },
  { id: 5, firstName: 'Eve', lastName: 'Davis', age: 26, department: 'Engineering', salary: 85000, active: true },
]

const columnHelper = createColumnHelper<Person>()

function createTestColumns() {
  return [
    columnHelper.accessor('firstName', { header: 'First Name' }),
    columnHelper.accessor('lastName', { header: 'Last Name' }),
    columnHelper.accessor('age', { header: 'Age' }),
    columnHelper.accessor('department', { header: 'Department' }),
    columnHelper.accessor('salary', { header: 'Salary' }),
    columnHelper.accessor('active', { header: 'Active' }),
  ]
}

function createTestTable(overrides: Partial<TableOptions<Person>> = {}) {
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
    ...overrides.initialState,
  }

  const table = createTable<Person>({
    data: testData,
    columns: createTestColumns(),
    getRowId: (row) => String(row.id),
    state,
    onStateChange: (updater) => {
      state = functionalUpdate(updater, state)
      table.setOptions((prev) => ({ ...prev, state }))
    },
    ...overrides,
  })

  return { table, getState: () => state }
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------
describe('Utils', () => {
  it('functionalUpdate with value', () => {
    expect(functionalUpdate(5, 10)).toBe(5)
  })

  it('functionalUpdate with function', () => {
    expect(functionalUpdate((prev: number) => prev + 1, 10)).toBe(11)
  })

  it('shallowEqual compares objects', () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false)
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 } as any)).toBe(false)
  })

  it('range generates arrays', () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4])
    expect(range(3, 6)).toEqual([3, 4, 5])
  })

  it('clamp constrains values', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('memo caches results', () => {
    let callCount = 0
    const fn = memo(
      () => ['dep1'],
      () => {
        callCount++
        return 'result'
      },
      { key: 'test' }
    )

    expect(fn()).toBe('result')
    expect(fn()).toBe('result')
    expect(callCount).toBe(1) // Only called once due to memoization
  })
})

// ---------------------------------------------------------------------------
// EventEmitter
// ---------------------------------------------------------------------------
describe('EventEmitter', () => {
  it('emits and listens to events', () => {
    const emitter = new EventEmitterImpl()
    const handler = vi.fn()
    emitter.on('cell:click', handler)
    emitter.emit('cell:click', { type: 'cell:click' } as any)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('removes listeners', () => {
    const emitter = new EventEmitterImpl()
    const handler = vi.fn()
    emitter.on('cell:click', handler)
    emitter.off('cell:click', handler)
    emitter.emit('cell:click', { type: 'cell:click' } as any)
    expect(handler).not.toHaveBeenCalled()
  })

  it('removeAll clears all listeners', () => {
    const emitter = new EventEmitterImpl()
    const h1 = vi.fn()
    const h2 = vi.fn()
    emitter.on('cell:click', h1)
    emitter.on('row:click', h2)
    emitter.removeAllListeners()
    emitter.emit('cell:click', { type: 'cell:click' } as any)
    emitter.emit('row:click', { type: 'row:click' } as any)
    expect(h1).not.toHaveBeenCalled()
    expect(h2).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Table creation
// ---------------------------------------------------------------------------
describe('createTable', () => {
  it('creates a table with data and columns', () => {
    const { table } = createTestTable()
    expect(table).toBeDefined()
    expect(table.getRowModel().rows.length).toBe(5)
  })

  it('resolves row IDs using getRowId', () => {
    const { table } = createTestTable()
    const rows = table.getRowModel().rows
    expect(rows[0]!.id).toBe('1')
    expect(rows[4]!.id).toBe('5')
  })

  it('provides visible columns', () => {
    const { table } = createTestTable()
    expect(table.getVisibleLeafColumns().length).toBe(6)
  })

  it('header groups are created', () => {
    const { table } = createTestTable()
    const headers = table.getHeaderGroups()
    expect(headers.length).toBeGreaterThan(0)
    expect(headers[0]!.headers.length).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// Row Sorting
// ---------------------------------------------------------------------------
describe('Row Sorting', () => {
  it('sorts by a column ascending', () => {
    const { table } = createTestTable({
      initialState: { sorting: [{ id: 'age', desc: false }] },
    })
    const rows = table.getRowModel().rows
    const ages = rows.map((r) => r.getValue('age') as number)
    expect(ages).toEqual([26, 28, 32, 35, 45])
  })

  it('sorts by a column descending', () => {
    const { table } = createTestTable({
      initialState: { sorting: [{ id: 'salary', desc: true }] },
    })
    const rows = table.getRowModel().rows
    const salaries = rows.map((r) => r.getValue('salary') as number)
    expect(salaries).toEqual([210000, 140000, 125000, 95000, 85000])
  })

  it('multi-column sort', () => {
    const { table } = createTestTable({
      initialState: {
        sorting: [
          { id: 'department', desc: false },
          { id: 'salary', desc: true },
        ],
      },
    })
    const rows = table.getRowModel().rows
    const results = rows.map((r) => ({
      dept: r.getValue('department'),
      salary: r.getValue('salary'),
    }))
    // Design, Engineering x3 (sorted by salary desc), Product
    expect(results[0]!.dept).toBe('Design')
    expect(results[1]!.dept).toBe('Engineering')
    expect((results[1]!.salary as number) >= (results[2]!.salary as number)).toBe(true)
  })

  it('toggleSorting toggles sort state', () => {
    const { table, getState } = createTestTable()
    const col = table.getColumn('age')!
    col.toggleSorting()
    expect(getState().sorting).toEqual([{ id: 'age', desc: false }])
    col.toggleSorting()
    expect(getState().sorting).toEqual([{ id: 'age', desc: true }])
  })
})

// ---------------------------------------------------------------------------
// Column Filtering
// ---------------------------------------------------------------------------
describe('Column Filtering', () => {
  it('filters rows by column value', () => {
    const { table } = createTestTable({
      initialState: {
        columnFilters: [{ id: 'department', value: 'Engineering' }],
      },
    })
    const rows = table.getRowModel().rows
    expect(rows.length).toBe(3)
    rows.forEach((r) => {
      expect(r.getValue('department')).toBe('Engineering')
    })
  })
})

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
describe('Row Pagination', () => {
  it('paginates rows', () => {
    const { table } = createTestTable({
      initialState: {
        pagination: { pageIndex: 0, pageSize: 2 },
      },
    })
    const rows = table.getRowModel().rows
    expect(rows.length).toBe(2)
  })

  it('navigates to next page', () => {
    const { table, getState } = createTestTable({
      initialState: {
        pagination: { pageIndex: 0, pageSize: 2 },
      },
    })
    table.nextPage()
    expect(getState().pagination.pageIndex).toBe(1)
  })

  it('getPageCount returns correct count', () => {
    const { table } = createTestTable({
      initialState: {
        pagination: { pageIndex: 0, pageSize: 2 },
      },
    })
    expect(table.getPageCount()).toBe(3)
  })

  it('setPageSize updates page size', () => {
    const { table, getState } = createTestTable()
    table.setPageSize(3)
    expect(getState().pagination.pageSize).toBe(3)
    expect(table.getRowModel().rows.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Row Selection
// ---------------------------------------------------------------------------
describe('Row Selection', () => {
  it('selects a row', () => {
    const { table, getState } = createTestTable()
    const row = table.getRowModel().rows[0]!
    row.toggleSelected()
    expect(getState().rowSelection).toEqual({ '1': true })
  })

  it('getIsSelected returns correct state', () => {
    const { table } = createTestTable({
      initialState: { rowSelection: { '1': true } },
    })
    const rows = table.getRowModel().rows
    expect(rows[0]!.getIsSelected()).toBe(true)
    expect(rows[1]!.getIsSelected()).toBe(false)
  })

  it('toggleAllRowsSelected selects all', () => {
    const { table, getState } = createTestTable()
    table.toggleAllRowsSelected(true)
    expect(Object.keys(getState().rowSelection).length).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Column Visibility
// ---------------------------------------------------------------------------
describe('Column Visibility', () => {
  it('hides a column', () => {
    const { table } = createTestTable({
      initialState: { columnVisibility: { active: false } },
    })
    const visibleCols = table.getVisibleLeafColumns()
    expect(visibleCols.find((c) => c.id === 'active')).toBeUndefined()
    expect(visibleCols.length).toBe(5)
  })

  it('toggleVisibility toggles column', () => {
    const { table, getState } = createTestTable()
    const col = table.getColumn('salary')!
    col.toggleVisibility(false)
    expect(getState().columnVisibility).toEqual({ salary: false })
    expect(table.getVisibleLeafColumns().find((c) => c.id === 'salary')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Cell Editing
// ---------------------------------------------------------------------------
describe('Cell Editing', () => {
  it('setPendingValue and getPendingValue work', () => {
    const { table } = createTestTable()
    table.setPendingValue('1', 'firstName', 'New Name')
    expect(table.getPendingValue('1', 'firstName')).toBe('New Name')
  })

  it('hasPendingChanges returns true after setPendingValue', () => {
    const { table } = createTestTable()
    expect(table.hasPendingChanges()).toBe(false)
    table.setPendingValue('1', 'firstName', 'Updated')
    expect(table.hasPendingChanges()).toBe(true)
  })

  it('getAllPendingChanges returns all pending', () => {
    const { table } = createTestTable()
    table.setPendingValue('1', 'firstName', 'A')
    table.setPendingValue('2', 'lastName', 'B')
    const changes = table.getAllPendingChanges()
    expect(changes['1']).toEqual({ firstName: 'A' })
    expect(changes['2']).toEqual({ lastName: 'B' })
  })

  it('discardAllPending clears pending values', () => {
    const { table } = createTestTable()
    table.setPendingValue('1', 'firstName', 'New')
    table.discardAllPending()
    expect(table.hasPendingChanges()).toBe(false)
    expect(table.getPendingValue('1', 'firstName')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Sorting functions
// ---------------------------------------------------------------------------
describe('sortingFns', () => {
  it('alphanumeric sorts strings correctly', () => {
    const mockRowA = { getValue: () => 'apple' } as any
    const mockRowB = { getValue: () => 'banana' } as any
    expect(sortingFns.alphanumeric(mockRowA, mockRowB, 'col')).toBeLessThan(0)
  })

  it('datetime sorts dates', () => {
    const mockRowA = { getValue: () => new Date('2024-01-01') } as any
    const mockRowB = { getValue: () => new Date('2024-06-01') } as any
    expect(sortingFns.datetime(mockRowA, mockRowB, 'col')).toBeLessThan(0)
  })
})

// ---------------------------------------------------------------------------
// Filter functions
// ---------------------------------------------------------------------------
describe('filterFns', () => {
  it('includesString matches substring', () => {
    const mockRow = { getValue: () => 'Hello World' } as any
    expect(filterFns.includesString(mockRow, 'col', 'world')).toBe(true)
    expect(filterFns.includesString(mockRow, 'col', 'xyz')).toBe(false)
  })

  it('equals matches exact value', () => {
    const mockRow = { getValue: () => 42 } as any
    expect(filterFns.equals(mockRow, 'col', 42)).toBe(true)
    expect(filterFns.equals(mockRow, 'col', 43)).toBe(false)
  })

  it('inNumberRange checks bounds', () => {
    const mockRow = { getValue: () => 50 } as any
    expect(filterFns.inNumberRange(mockRow, 'col', [0, 100])).toBe(true)
    expect(filterFns.inNumberRange(mockRow, 'col', [60, 100])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Aggregation functions
// ---------------------------------------------------------------------------
describe('aggregationFns', () => {
  it('sum aggregates numeric values', () => {
    const rows = [
      { getValue: () => 10 },
      { getValue: () => 20 },
      { getValue: () => 30 },
    ] as any[]
    expect(aggregationFns.sum('col', rows, rows)).toBe(60)
  })

  it('mean computes average', () => {
    const rows = [
      { getValue: () => 10 },
      { getValue: () => 20 },
      { getValue: () => 30 },
    ] as any[]
    expect(aggregationFns.mean('col', rows, rows)).toBe(20)
  })

  it('min returns minimum', () => {
    const rows = [
      { getValue: () => 10 },
      { getValue: () => 5 },
      { getValue: () => 20 },
    ] as any[]
    expect(aggregationFns.min('col', rows, rows)).toBe(5)
  })

  it('max returns maximum', () => {
    const rows = [
      { getValue: () => 10 },
      { getValue: () => 5 },
      { getValue: () => 20 },
    ] as any[]
    expect(aggregationFns.max('col', rows, rows)).toBe(20)
  })

  it('count returns row count', () => {
    const rows = [{}, {}, {}] as any[]
    expect(aggregationFns.count('col', rows, rows)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Row Expanding
// ---------------------------------------------------------------------------
describe('Row Expanding', () => {
  it('toggleExpanded expands a row', () => {
    const { table, getState } = createTestTable()
    const row = table.getRowModel().rows[0]!
    row.toggleExpanded()
    expect(getState().expanded).toEqual({ '1': true })
    expect(row.getIsExpanded()).toBe(true)
  })

  it('toggleExpanded collapses an expanded row', () => {
    const { table, getState } = createTestTable({
      initialState: { expanded: { '1': true } },
    })
    const row = table.getRowModel().rows[0]!
    expect(row.getIsExpanded()).toBe(true)
    row.toggleExpanded()
    expect(row.getIsExpanded()).toBe(false)
  })

  it('toggleAllRowsExpanded with no sub-rows results in empty state', () => {
    const { table, getState } = createTestTable()
    table.toggleAllRowsExpanded(true)
    const expanded = getState().expanded as Record<string, boolean>
    // No rows have subRows, so nothing to expand
    expect(Object.keys(expanded).length).toBe(0)
  })

  it('toggleAllRowsExpanded collapses all', () => {
    const { table, getState } = createTestTable({
      initialState: { expanded: { '1': true, '2': true } },
    })
    table.toggleAllRowsExpanded(false)
    expect(getState().expanded).toEqual({})
  })

  it('getCanExpand returns false for rows without subRows', () => {
    const { table } = createTestTable()
    const row = table.getRowModel().rows[0]!
    expect(row.getCanExpand()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Row Pinning
// ---------------------------------------------------------------------------
describe('Row Pinning', () => {
  it('pins a row to top', () => {
    const { table, getState } = createTestTable()
    const row = table.getRowModel().rows[0]!
    row.pin('top')
    expect(getState().rowPinning.top).toContain('1')
  })

  it('pins a row to bottom', () => {
    const { table, getState } = createTestTable()
    const row = table.getRowModel().rows[2]!
    row.pin('bottom')
    expect(getState().rowPinning.bottom).toContain('3')
  })

  it('getIsPinned returns correct position', () => {
    const { table } = createTestTable({
      initialState: { rowPinning: { top: ['1'], bottom: ['3'] } },
    })
    const rows = table.getRowModel().rows
    expect(rows[0]!.getIsPinned()).toBe('top')
    expect(rows[1]!.getIsPinned()).toBe(false)
    expect(rows[2]!.getIsPinned()).toBe('bottom')
  })

  it('getTopRows returns pinned rows', () => {
    const { table } = createTestTable({
      initialState: { rowPinning: { top: ['1', '2'], bottom: [] } },
    })
    const topRows = table.getTopRows()
    expect(topRows.length).toBe(2)
    expect(topRows[0]!.id).toBe('1')
  })

  it('getBottomRows returns pinned rows', () => {
    const { table } = createTestTable({
      initialState: { rowPinning: { top: [], bottom: ['5'] } },
    })
    const bottomRows = table.getBottomRows()
    expect(bottomRows.length).toBe(1)
    expect(bottomRows[0]!.id).toBe('5')
  })

  it('unpinning removes row from pinned state', () => {
    const { table, getState } = createTestTable({
      initialState: { rowPinning: { top: ['1'], bottom: [] } },
    })
    const row = table.getRowModel().rows[0]!
    row.pin(false)
    expect(getState().rowPinning.top).not.toContain('1')
  })
})

// ---------------------------------------------------------------------------
// Column Pinning
// ---------------------------------------------------------------------------
describe('Column Pinning', () => {
  it('pins a column to left', () => {
    const { table, getState } = createTestTable()
    const col = table.getColumn('firstName')!
    col.pin('left')
    expect(getState().columnPinning.left).toContain('firstName')
  })

  it('pins a column to right', () => {
    const { table, getState } = createTestTable()
    const col = table.getColumn('salary')!
    col.pin('right')
    expect(getState().columnPinning.right).toContain('salary')
  })

  it('getIsPinned returns correct position', () => {
    const { table } = createTestTable({
      initialState: { columnPinning: { left: ['firstName'], right: ['salary'] } },
    })
    expect(table.getColumn('firstName')!.getIsPinned()).toBe('left')
    expect(table.getColumn('salary')!.getIsPinned()).toBe('right')
    expect(table.getColumn('age')!.getIsPinned()).toBe(false)
  })

  it('getPinnedIndex returns correct index', () => {
    const { table } = createTestTable({
      initialState: { columnPinning: { left: ['firstName', 'lastName'], right: [] } },
    })
    expect(table.getColumn('firstName')!.getPinnedIndex()).toBe(0)
    expect(table.getColumn('lastName')!.getPinnedIndex()).toBe(1)
    expect(table.getColumn('age')!.getPinnedIndex()).toBe(-1)
  })
})

// ---------------------------------------------------------------------------
// Column Ordering
// ---------------------------------------------------------------------------
describe('Column Ordering', () => {
  it('setColumnOrder changes column order', () => {
    const { table, getState } = createTestTable()
    table.setColumnOrder(['salary', 'age', 'firstName', 'lastName', 'department', 'active'])
    expect(getState().columnOrder).toEqual(['salary', 'age', 'firstName', 'lastName', 'department', 'active'])
  })

  it('resetColumnOrder resets to default when passed true', () => {
    const { table, getState } = createTestTable({
      initialState: { columnOrder: ['salary', 'age'] },
    })
    table.resetColumnOrder(true)
    expect(getState().columnOrder).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Global Filtering
// ---------------------------------------------------------------------------
describe('Global Filtering', () => {
  it('setGlobalFilter filters across all columns', () => {
    const { table, getState } = createTestTable()
    table.setGlobalFilter('Alice')
    expect(getState().globalFilter).toBe('Alice')
    const rows = table.getRowModel().rows
    expect(rows.length).toBe(1)
    expect(rows[0]!.getValue('firstName')).toBe('Alice')
  })

  it('global filter is case-insensitive by default', () => {
    const { table } = createTestTable()
    table.setGlobalFilter('alice')
    const rows = table.getRowModel().rows
    expect(rows.length).toBe(1)
  })

  it('resetGlobalFilter clears the filter when passed true', () => {
    const { table, getState } = createTestTable()
    table.setGlobalFilter('Engineering')
    expect(table.getRowModel().rows.length).toBeLessThan(5)
    table.resetGlobalFilter(true)
    expect(getState().globalFilter).toBe('')
    expect(table.getRowModel().rows.length).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
describe('Export', () => {
  it('exports data as JSON by default', () => {
    const { table } = createTestTable()
    const result = table.exportData()
    const parsed = JSON.parse(result)
    expect(parsed.length).toBe(5)
    expect(parsed[0]).toHaveProperty('firstName')
    expect(parsed[0]).toHaveProperty('age')
  })

  it('exports data as CSV', () => {
    const { table } = createTestTable()
    const csv = table.exportData({ format: 'csv' })
    const lines = csv.split('\n')
    expect(lines.length).toBe(6) // 1 header + 5 data rows
    expect(lines[0]).toContain('First Name')
  })

  it('exports only visible columns', () => {
    const { table } = createTestTable({
      initialState: { columnVisibility: { active: false, salary: false } },
    })
    const result = table.exportData()
    const parsed = JSON.parse(result)
    expect(parsed[0]).not.toHaveProperty('active')
    expect(parsed[0]).not.toHaveProperty('salary')
    expect(parsed[0]).toHaveProperty('firstName')
  })

  it('exports specific columns', () => {
    const { table } = createTestTable()
    const result = table.exportData({ columns: ['firstName', 'age'] })
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed[0])).toEqual(['firstName', 'age'])
  })

  it('exports all rows ignoring pagination', () => {
    const { table } = createTestTable({
      initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
    })
    // Without allRows, should respect pagination
    const paginated = JSON.parse(table.exportData())
    expect(paginated.length).toBe(2)

    // With allRows, should return all
    const all = JSON.parse(table.exportData({ allRows: true }))
    expect(all.length).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Column Resizing
// ---------------------------------------------------------------------------
describe('Column Resizing', () => {
  it('getCanResize defaults to true', () => {
    const { table } = createTestTable()
    expect(table.getColumn('firstName')!.getCanResize()).toBe(true)
  })

  it('getIsResizing returns false initially', () => {
    const { table } = createTestTable()
    expect(table.getColumn('firstName')!.getIsResizing()).toBe(false)
  })

  it('setColumnSizing updates sizes', () => {
    const { table, getState } = createTestTable()
    table.setColumnSizing({ firstName: 200, lastName: 150 })
    expect(getState().columnSizing).toEqual({ firstName: 200, lastName: 150 })
  })

  it('resetSize clears column size', () => {
    const { table, getState } = createTestTable({
      initialState: { columnSizing: { firstName: 200 } },
    })
    table.getColumn('firstName')!.resetSize()
    expect(getState().columnSizing.firstName).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Row Model Pipeline
// ---------------------------------------------------------------------------
describe('Row Model Pipeline', () => {
  it('filter → sort → paginate pipeline works correctly', () => {
    const { table } = createTestTable({
      initialState: {
        columnFilters: [{ id: 'department', value: 'Engineering' }],
        sorting: [{ id: 'salary', desc: true }],
        pagination: { pageIndex: 0, pageSize: 2 },
      },
    })
    const rows = table.getRowModel().rows
    // Should have 2 rows (page 1 of 3 engineering rows, sorted by salary desc)
    expect(rows.length).toBe(2)
    const salaries = rows.map((r) => r.getValue('salary') as number)
    expect(salaries[0]! > salaries[1]!).toBe(true)
    // All should be engineering
    rows.forEach((r) => expect(r.getValue('department')).toBe('Engineering'))
  })

  it('getPrePaginationRowModel returns all filtered+sorted rows', () => {
    const { table } = createTestTable({
      initialState: {
        columnFilters: [{ id: 'department', value: 'Engineering' }],
        pagination: { pageIndex: 0, pageSize: 2 },
      },
    })
    // Paginated should be 2
    expect(table.getRowModel().rows.length).toBe(2)
    // Pre-pagination should be all 3 engineering rows
    expect(table.getPrePaginationRowModel().rows.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Column Helper
// ---------------------------------------------------------------------------
describe('createColumnHelper', () => {
  it('creates accessor column with key', () => {
    const col = columnHelper.accessor('firstName', { header: 'First' })
    expect(col).toHaveProperty('accessorKey', 'firstName')
    expect(col).toHaveProperty('header', 'First')
  })

  it('creates accessor column with function', () => {
    const col = columnHelper.accessor((row: Person) => row.firstName, {
      id: 'fullName',
      header: 'Full Name',
    })
    expect(col).toHaveProperty('accessorFn')
    expect(col).toHaveProperty('id', 'fullName')
  })

  it('creates display column', () => {
    const col = columnHelper.display({ id: 'actions', header: 'Actions' })
    expect(col).toHaveProperty('id', 'actions')
  })
})
