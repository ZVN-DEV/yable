// @zvndev/yable-core — Column Model Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTable } from '../table'
import { functionalUpdate, MAX_ACCESSOR_DEPTH } from '../../utils'
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

// ===========================================================================
// Column sizing — min/max bounds & validation
// ===========================================================================

describe('Column sizing min/max bounds', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('clamps a small size up to minSize', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name', size: 50, minSize: 100 },
    ])
    expect(table.getColumn('name')!.getSize()).toBe(100)
  })

  it('clamps a large size down to maxSize', () => {
    const { table } = makeTable([
      { accessorKey: 'name', header: 'Name', size: 500, maxSize: 300 },
    ])
    expect(table.getColumn('name')!.getSize()).toBe(300)
  })

  it('warns once when minSize > maxSize and resolves to a sane size (min wins)', () => {
    const { table } = makeTable([
      // minSize 400, maxSize 200 — invalid; min wins per documented policy.
      { accessorKey: 'name', header: 'Name', size: 150, minSize: 400, maxSize: 200 },
    ])

    const col = table.getColumn('name')!
    const size = col.getSize()

    // Resolved size lands inside a sane range — at or above the minSize floor.
    expect(size).toBeGreaterThanOrEqual(400)

    // Warning fired with the [yable] prefix and the column id.
    expect(warnSpy).toHaveBeenCalled()
    const firstCall = warnSpy.mock.calls[0]!
    expect(String(firstCall[0])).toContain('[yable]')
    expect(String(firstCall[0])).toContain('name')
    expect(String(firstCall[0])).toContain('minSize')
    expect(String(firstCall[0])).toContain('maxSize')

    // Subsequent reads must not re-warn (one-shot guard).
    col.getSize()
    col.getSize()
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// Accessor depth guard
// ===========================================================================

describe('createColumn accessorKey depth guard', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('rejects accessorKey paths deeper than MAX_ACCESSOR_DEPTH', () => {
    // Build a path with MAX_ACCESSOR_DEPTH + 1 segments
    const tooDeepKey = Array.from(
      { length: MAX_ACCESSOR_DEPTH + 1 },
      (_, i) => `s${i}`
    ).join('.')

    const { table } = makeTable([
      { accessorKey: tooDeepKey as any, header: 'Deep', id: 'deep' },
    ])

    const col = table.getColumn('deep')!
    // Build a deeply-nested object so a real walk would actually find a value.
    const row: any = {}
    let cursor = row
    for (let i = 0; i < MAX_ACCESSOR_DEPTH + 1; i++) {
      cursor[`s${i}`] = i === MAX_ACCESSOR_DEPTH ? 'leaf' : {}
      cursor = cursor[`s${i}`]
    }

    // accessor must short-circuit to undefined and log via [yable] prefix
    expect(col.accessorFn!(row, 0)).toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
    const firstCall = errorSpy.mock.calls[0]!
    expect(String(firstCall[0])).toContain('[yable]')
    expect(String(firstCall[0])).toContain('too deep')
  })
})
