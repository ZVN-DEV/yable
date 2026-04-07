// @yable/core — Keyboard Navigation Tests

import { describe, expect, it } from 'vitest'
import { createColumnHelper } from '../../columnHelper'
import { createTable } from '../../core/table'
import { functionalUpdate } from '../../utils'
import {
  getCellPositionByIds,
  getNextFocusedCell,
  getResolvedFocusedCell,
} from '../keyboardNavigation'
import type { RowData, TableOptions, TableState } from '../../types'

interface GridRow extends RowData {
  a: string
  b: string
  c: string
  d: string
}

const columnHelper = createColumnHelper<GridRow>()

const columns = [
  columnHelper.accessor('a', { header: 'A' }),
  columnHelper.accessor('b', { header: 'B' }),
  columnHelper.accessor('c', { header: 'C' }),
  columnHelper.accessor('d', { header: 'D' }),
]

const data: GridRow[] = [
  { a: 'A1', b: 'B1', c: '', d: 'D1' },
  { a: 'A2', b: '', c: '', d: 'D2' },
  { a: '', b: 'B3', c: 'C3', d: '' },
  { a: 'A4', b: 'B4', c: '', d: 'D4' },
]

function createKeyboardTable(overrides: Partial<TableOptions<GridRow>> = {}) {
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
    ...overrides.initialState,
  }

  const table = createTable<GridRow>({
    data,
    columns,
    state,
    onStateChange: (updater) => {
      state = functionalUpdate(updater, state)
      table.setOptions((prev) => ({ ...prev, state }))
    },
    ...overrides,
  })

  return { table, getState: () => state }
}

describe('keyboard navigation', () => {
  it('tracks focused cells through the table API', () => {
    const { table, getState } = createKeyboardTable()

    table.setFocusedCell({ rowIndex: 1, columnIndex: 2 })

    expect(getState().keyboardNavigation.focusedCell).toEqual({
      rowIndex: 1,
      columnIndex: 2,
    })

    expect(getCellPositionByIds(table, '2', 'c')).toEqual({
      rowIndex: 2,
      columnIndex: 2,
    })

    const resolved = getResolvedFocusedCell(table, table.getFocusedCell())
    expect(resolved?.row.id).toBe('1')
    expect(resolved?.column.id).toBe('c')
  })

  it('clamps arrow-key movement at table edges', () => {
    const { table } = createKeyboardTable()

    table.setFocusedCell({ rowIndex: 0, columnIndex: 0 })
    expect(table.moveFocus({ type: 'arrow', direction: 'up' })).toEqual({
      rowIndex: 0,
      columnIndex: 0,
    })
    expect(table.moveFocus({ type: 'arrow', direction: 'left' })).toEqual({
      rowIndex: 0,
      columnIndex: 0,
    })

    table.setFocusedCell({ rowIndex: 3, columnIndex: 3 })
    expect(table.moveFocus({ type: 'arrow', direction: 'down' })).toEqual({
      rowIndex: 3,
      columnIndex: 3,
    })
    expect(table.moveFocus({ type: 'arrow', direction: 'right' })).toEqual({
      rowIndex: 3,
      columnIndex: 3,
    })
  })

  it('wraps Tab and Shift+Tab across row boundaries', () => {
    const { table } = createKeyboardTable()

    table.setFocusedCell({ rowIndex: 0, columnIndex: 3 })
    expect(table.moveFocus({ type: 'tab' })).toEqual({
      rowIndex: 1,
      columnIndex: 0,
    })

    table.setFocusedCell({ rowIndex: 1, columnIndex: 0 })
    expect(table.moveFocus({ type: 'tab', shiftKey: true })).toEqual({
      rowIndex: 0,
      columnIndex: 3,
    })
  })

  it('supports Home/End, Ctrl+Home/End, and page jumps', () => {
    const { table } = createKeyboardTable()

    table.setFocusedCell({ rowIndex: 1, columnIndex: 2 })

    expect(table.moveFocus({ type: 'home' })).toEqual({
      rowIndex: 1,
      columnIndex: 0,
    })

    table.setFocusedCell({ rowIndex: 1, columnIndex: 1 })
    expect(table.moveFocus({ type: 'end' })).toEqual({
      rowIndex: 1,
      columnIndex: 3,
    })

    expect(getNextFocusedCell(table, null, { type: 'home', ctrlKey: true })).toEqual({
      rowIndex: 0,
      columnIndex: 0,
    })

    expect(getNextFocusedCell(table, null, { type: 'end', ctrlKey: true })).toEqual({
      rowIndex: 3,
      columnIndex: 3,
    })

    table.setFocusedCell({ rowIndex: 0, columnIndex: 1 })
    expect(table.moveFocus({ type: 'page', direction: 'down', pageSize: 2 })).toEqual({
      rowIndex: 2,
      columnIndex: 1,
    })

    expect(table.moveFocus({ type: 'page', direction: 'up', pageSize: 2 })).toEqual({
      rowIndex: 0,
      columnIndex: 1,
    })
  })

  it('jumps to data boundaries with Ctrl+Arrow from non-empty cells', () => {
    const { table } = createKeyboardTable()

    table.setFocusedCell({ rowIndex: 0, columnIndex: 0 })
    expect(table.moveFocus({ type: 'arrow', direction: 'right', ctrlKey: true })).toEqual({
      rowIndex: 0,
      columnIndex: 1,
    })

    table.setFocusedCell({ rowIndex: 0, columnIndex: 0 })
    expect(table.moveFocus({ type: 'arrow', direction: 'down', ctrlKey: true })).toEqual({
      rowIndex: 1,
      columnIndex: 0,
    })
  })

  it('jumps to the next non-empty cell with Ctrl+Arrow from empty cells', () => {
    const { table } = createKeyboardTable()

    table.setFocusedCell({ rowIndex: 0, columnIndex: 2 })
    expect(table.moveFocus({ type: 'arrow', direction: 'right', ctrlKey: true })).toEqual({
      rowIndex: 0,
      columnIndex: 3,
    })

    table.setFocusedCell({ rowIndex: 2, columnIndex: 0 })
    expect(table.moveFocus({ type: 'arrow', direction: 'down', ctrlKey: true })).toEqual({
      rowIndex: 3,
      columnIndex: 0,
    })
  })
})
