// @zvndev/yable-react — Cell range selection integration tests
//
// Exercises the wiring in TableCell/TableBody (mouseDown/mouseEnter/mouseUp +
// shiftKey) against the shipped <Table> component, asserting both the rendered
// data-cell-selected attributes and the clipboard payload.

import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper, type Table as CoreTable } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

interface TestRow {
  id: string
  name: string
  age: number
  city: string
}

const data: TestRow[] = [
  { id: '1', name: 'Alice', age: 30, city: 'New York' },
  { id: '2', name: 'Bob', age: 25, city: 'Boston' },
]

const columnHelper = createColumnHelper<TestRow>()

function RangeSelectionHarness({
  onReady,
  enableCellSelection,
}: {
  onReady: (table: CoreTable<TestRow>) => void
  enableCellSelection?: boolean
}) {
  const table = useTable<TestRow>({
    data,
    columns: [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('age', { header: 'Age' }),
      columnHelper.accessor('city', { header: 'City' }),
    ],
    getRowId: (row) => row.id,
    enableCellSelection,
  })

  useEffect(() => {
    onReady(table)
  }, [onReady, table])

  return <Table table={table} />
}

function cell(container: HTMLElement, rowIndex: number, columnIndex: number) {
  return container.querySelector(
    `[data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`,
  ) as HTMLTableCellElement | null
}

describe('cell range selection', () => {
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView
  })

  it('supports drag-selection and copies only the selected range', () => {
    let tableInstance: CoreTable<TestRow> | null = null
    const { container } = render(
      <RangeSelectionHarness
        onReady={(table) => {
          tableInstance = table
        }}
      />,
    )

    const startCell = cell(container, 0, 0)
    const endCell = cell(container, 1, 1)
    const outsideCell = cell(container, 0, 2)

    expect(startCell).not.toBeNull()
    expect(endCell).not.toBeNull()
    expect(tableInstance).not.toBeNull()

    fireEvent.mouseDown(startCell!)
    fireEvent.mouseEnter(endCell!)
    fireEvent.mouseUp(endCell!)

    expect(startCell).toHaveAttribute('data-cell-selected', 'true')
    expect(endCell).toHaveAttribute('data-cell-selected', 'true')
    expect(outsideCell).not.toHaveAttribute('data-cell-selected', 'true')
    expect(tableInstance!.copyToClipboard()).toBe('Alice\t30\nBob\t25')
  })

  it('selects a single cell on a plain click', () => {
    let tableInstance: CoreTable<TestRow> | null = null
    const { container } = render(
      <RangeSelectionHarness
        onReady={(table) => {
          tableInstance = table
        }}
      />,
    )

    const ageCell = cell(container, 0, 1) // Alice / age = 30
    fireEvent.mouseDown(ageCell!)
    fireEvent.mouseUp(ageCell!)

    expect(ageCell).toHaveAttribute('data-cell-selected', 'true')
    expect(cell(container, 0, 0)).not.toHaveAttribute('data-cell-selected', 'true')
    expect(tableInstance!.copyToClipboard()).toBe('30')
  })

  it('extends the selection from the anchor on shift+click', () => {
    let tableInstance: CoreTable<TestRow> | null = null
    const { container } = render(
      <RangeSelectionHarness
        onReady={(table) => {
          tableInstance = table
        }}
      />,
    )

    // Anchor on (0,0) with a normal click, then shift+click (1,1) to extend.
    const anchor = cell(container, 0, 0)
    fireEvent.mouseDown(anchor!)
    fireEvent.mouseUp(anchor!)

    const target = cell(container, 1, 1)
    fireEvent.mouseDown(target!, { shiftKey: true })
    fireEvent.mouseUp(target!)

    expect(cell(container, 0, 0)).toHaveAttribute('data-cell-selected', 'true')
    expect(cell(container, 0, 1)).toHaveAttribute('data-cell-selected', 'true')
    expect(cell(container, 1, 0)).toHaveAttribute('data-cell-selected', 'true')
    expect(cell(container, 1, 1)).toHaveAttribute('data-cell-selected', 'true')
    // City column is outside the extended range.
    expect(cell(container, 0, 2)).not.toHaveAttribute('data-cell-selected', 'true')
    expect(tableInstance!.copyToClipboard()).toBe('Alice\t30\nBob\t25')
  })

  it('does not select when enableCellSelection is false', () => {
    const { container } = render(
      <RangeSelectionHarness onReady={() => {}} enableCellSelection={false} />,
    )

    const startCell = cell(container, 0, 0)
    fireEvent.mouseDown(startCell!)
    fireEvent.mouseEnter(cell(container, 1, 1)!)
    fireEvent.mouseUp(cell(container, 1, 1)!)

    expect(startCell).not.toHaveAttribute('data-cell-selected', 'true')
    expect(cell(container, 1, 1)).not.toHaveAttribute('data-cell-selected', 'true')
  })
})
