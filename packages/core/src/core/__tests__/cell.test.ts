// @zvndev/yable-core — Cell Model Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTable } from '../table'
import { functionalUpdate } from '../../utils'
import type { TableState, ColumnDef } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestData {
  name: string
  age: number
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
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
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
// getRowSpan — user callback safety
// ===========================================================================

describe('cell.getRowSpan', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('returns undefined when no rowSpan is configured', () => {
    const { table } = makeTable([{ accessorKey: 'name', header: 'Name' }])
    const row = table.getRowModel().rows[0]!
    const cell = row.getAllCells()[0]!
    expect(cell.getRowSpan()).toBeUndefined()
  })

  it('returns the value from a well-behaved rowSpan callback', () => {
    const { table } = makeTable([
      {
        accessorKey: 'name',
        header: 'Name',
        rowSpan:() => 2,
      },
    ])
    const row = table.getRowModel().rows[0]!
    const cell = row.getAllCells()[0]!
    expect(cell.getRowSpan()).toBe(2)
  })

  it('does not propagate when rowSpanFn throws and logs via [yable] prefix', () => {
    const { table } = makeTable([
      {
        accessorKey: 'name',
        header: 'Name',
        rowSpan:() => {
          throw new Error('boom')
        },
      },
    ])
    const row = table.getRowModel().rows[0]!
    const cell = row.getAllCells()[0]!

    // Must not throw
    let result: number | undefined
    expect(() => {
      result = cell.getRowSpan()
    }).not.toThrow()
    expect(result).toBeUndefined()

    // Must log via the established [yable] prefix
    expect(errorSpy).toHaveBeenCalled()
    const firstCall = errorSpy.mock.calls[0]!
    expect(String(firstCall[0])).toContain('[yable]')
    expect(String(firstCall[0])).toContain('rowSpan')
  })
})
