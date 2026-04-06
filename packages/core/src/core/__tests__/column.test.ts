// @yable/core — Column Model Tests

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
  nested: { value: number }
}

function makeTable(
  colDefs: ColumnDef<TestData, any>[],
  stateOverrides: Partial<TableState> = {}
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
      { name: 'Alice', age: 30, email: 'alice@test.com', nested: { value: 1 } },
      { name: 'Bob', age: 25, email: 'bob@test.com', nested: { value: 2 } },
    ],
    columns: colDefs,
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
// createColumn — accessor key
// ===========================================================================

describe('createColumn with accessorKey', () => {
  it('should create a column with id from accessorKey', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
    ])

    const col = table.getColumn('name')
    expect(col).toBeDefined()
    expect(col!.id).toBe('name')
  })

  it('should set up accessorFn from accessorKey', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
    ])

    const col = table.getColumn('name')!
    const row = { name: 'Test', age: 99, email: '', nested: { value: 0 } }
    expect(col.accessorFn!(row, 0)).toBe('Test')
  })

  it('should support nested accessorKey (dot notation)', () => {
    const { table } = makeTable([
      { accessorKey: 'nested.value' as any, header: 'Nested', id: 'nested_val' },
    ])

    const col = table.getColumn('nested_val')!
    const row = { name: 'Test', age: 0, email: '', nested: { value: 42 } }
    expect(col.accessorFn!(row, 0)).toBe(42)
  })
})

// ===========================================================================
// createColumn — accessor function
// ===========================================================================

describe('createColumn with accessorFn', () => {
  it('should create a column with custom accessorFn', () => {
    const { table } = makeTable([
      {
        id: 'full_name',
        accessorFn: (row) => `${row.name} (${row.age})`,
        header: 'Full',
      },
    ])

    const col = table.getColumn('full_name')!
    expect(col.id).toBe('full_name')
    const row = { name: 'Alice', age: 30, email: '', nested: { value: 0 } }
    expect(col.accessorFn!(row, 0)).toBe('Alice (30)')
  })
})

// ===========================================================================
// createColumn — display column
// ===========================================================================

describe('createColumn with display column (no accessor)', () => {
  it('should create a column without accessorFn', () => {
    const { table } = makeTable([
      { id: 'actions', header: 'Actions' },
    ])

    const col = table.getColumn('actions')!
    expect(col.id).toBe('actions')
    // accessorFn should be falsy
    expect(col.accessorFn).toBeFalsy()
  })
})

// ===========================================================================
// Sorting
// ===========================================================================

describe('Column sorting methods', () => {
  it('getIsSorted should return false when not sorted', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
    ])

    const col = table.getColumn('name')!
    expect(col.getIsSorted()).toBe(false)
  })

  it('getIsSorted should return "asc" when sorted ascending', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name', header: 'Name' }],
      { sorting: [{ id: 'name', desc: false }] }
    )

    const col = table.getColumn('name')!
    expect(col.getIsSorted()).toBe('asc')
  })

  it('getIsSorted should return "desc" when sorted descending', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name', header: 'Name' }],
      { sorting: [{ id: 'name', desc: true }] }
    )

    const col = table.getColumn('name')!
    expect(col.getIsSorted()).toBe('desc')
  })

  it('getCanSort should return true by default', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
    ])

    expect(table.getColumn('name')!.getCanSort()).toBe(true)
  })

  it('getCanSort should return false when enableSorting is false', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name', enableSorting: false },
    ])

    expect(table.getColumn('name')!.getCanSort()).toBe(false)
  })
})

// ===========================================================================
// Filtering
// ===========================================================================

describe('Column filtering methods', () => {
  it('getCanFilter should return true by default', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
    ])

    expect(table.getColumn('name')!.getCanFilter()).toBe(true)
  })

  it('getCanFilter should return false when enableColumnFilter is false', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name', enableColumnFilter: false },
    ])

    expect(table.getColumn('name')!.getCanFilter()).toBe(false)
  })

  it('getIsFiltered should return true when filter is active', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name', header: 'Name' }],
      { columnFilters: [{ id: 'name', value: 'Alice' }] }
    )

    expect(table.getColumn('name')!.getIsFiltered()).toBe(true)
  })

  it('getFilterValue should return the active filter value', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name', header: 'Name' }],
      { columnFilters: [{ id: 'name', value: 'Alice' }] }
    )

    expect(table.getColumn('name')!.getFilterValue()).toBe('Alice')
  })
})

// ===========================================================================
// Visibility
// ===========================================================================

describe('Column visibility methods', () => {
  it('getIsVisible should return true by default', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
    ])

    expect(table.getColumn('name')!.getIsVisible()).toBe(true)
  })

  it('getIsVisible should return false when column is hidden', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name', header: 'Name' }],
      { columnVisibility: { name: false } }
    )

    expect(table.getColumn('name')!.getIsVisible()).toBe(false)
  })
})

// ===========================================================================
// Pinning
// ===========================================================================

describe('Column pinning methods', () => {
  it('getIsPinned should return false when not pinned', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
    ])

    expect(table.getColumn('name')!.getIsPinned()).toBe(false)
  })

  it('getIsPinned should return "left" when pinned left', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name', header: 'Name' }],
      { columnPinning: { left: ['name'], right: [] } }
    )

    expect(table.getColumn('name')!.getIsPinned()).toBe('left')
  })

  it('getIsPinned should return "right" when pinned right', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name', header: 'Name' }],
      { columnPinning: { left: [], right: ['name'] } }
    )

    expect(table.getColumn('name')!.getIsPinned()).toBe('right')
  })
})

// ===========================================================================
// Column sizing
// ===========================================================================

describe('Column sizing', () => {
  it('should return default size of 150', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name' },
    ])

    expect(table.getColumn('name')!.getSize()).toBe(150)
  })

  it('should return custom size from column def', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name', size: 200 },
    ])

    expect(table.getColumn('name')!.getSize()).toBe(200)
  })

  it('should return override size from state', () => {
    const { table } = makeTable(
      [{ accessorKey: 'name', header: 'Name', size: 200 }],
      { columnSizing: { name: 300 } }
    )

    expect(table.getColumn('name')!.getSize()).toBe(300)
  })
})
