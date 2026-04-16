// @zvndev/yable-core — Cell range selection tests

import { describe, expect, it } from 'vitest'
import { createTable } from '../../core/table'
import { createCellRange, isCellInRange, normalizeCellRange } from '../selection'

interface TestRow {
  id: string
  name: string
  age: number
  city: string
}

const data: TestRow[] = [
  { id: '1', name: 'Alice', age: 30, city: 'New York' },
  { id: '2', name: 'Bob', age: 25, city: 'Boston' },
  { id: '3', name: 'Cara', age: 28, city: 'Chicago' },
]

function makeTable() {
  return createTable<TestRow>({
    data,
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'city', header: 'City' },
    ],
    getRowId: (row) => row.id,
  })
}

describe('cell range selection helpers', () => {
  it('normalizes ranges regardless of drag direction', () => {
    const range = createCellRange({ rowIndex: 2, columnIndex: 2 }, { rowIndex: 0, columnIndex: 1 })

    expect(normalizeCellRange(range)).toEqual({
      top: 0,
      right: 2,
      bottom: 2,
      left: 1,
    })
    expect(isCellInRange(range, 1, 1)).toBe(true)
    expect(isCellInRange(range, 2, 0)).toBe(false)
  })
})

describe('table cell selection state', () => {
  it('tracks anchor-based extension and selected cell edges', () => {
    const table = makeTable()

    table.selectCell({ rowIndex: 0, columnIndex: 0 })
    table.selectCell({ rowIndex: 1, columnIndex: 1 }, { extend: true })

    expect(table.getCellSelectionRange()).toEqual({
      start: { rowIndex: 0, columnIndex: 0 },
      end: { rowIndex: 1, columnIndex: 1 },
    })
    expect(table.getIsCellSelected(0, 0)).toBe(true)
    expect(table.getIsCellSelected(1, 1)).toBe(true)
    expect(table.getIsCellSelected(2, 2)).toBe(false)
    expect(table.getCellSelectionEdges(0, 0)).toEqual({
      top: true,
      right: false,
      bottom: false,
      left: true,
    })
    expect(table.getCellSelectionEdges(1, 1)).toEqual({
      top: false,
      right: true,
      bottom: true,
      left: false,
    })
  })

  it('copies only the selected cell range to clipboard text', () => {
    const table = makeTable()

    table.startCellRangeSelection({ rowIndex: 0, columnIndex: 0 })
    table.updateCellRangeSelection({ rowIndex: 1, columnIndex: 1 })
    table.endCellRangeSelection()

    expect(table.copyToClipboard()).toBe('Alice\t30\nBob\t25')
  })
})
