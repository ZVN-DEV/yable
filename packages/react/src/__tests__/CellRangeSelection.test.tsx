// @zvndev/yable-react — Cell range selection integration tests

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

function RangeSelectionHarness({ onReady }: { onReady: (table: CoreTable<TestRow>) => void }) {
  const table = useTable<TestRow>({
    data,
    columns: [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('age', { header: 'Age' }),
      columnHelper.accessor('city', { header: 'City' }),
    ],
    getRowId: (row) => row.id,
  })

  useEffect(() => {
    onReady(table)
  }, [onReady, table])

  return <Table table={table} />
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

    const startCell = container.querySelector(
      '[data-row-index="0"][data-column-index="0"]',
    ) as HTMLTableCellElement | null
    const endCell = container.querySelector(
      '[data-row-index="1"][data-column-index="1"]',
    ) as HTMLTableCellElement | null
    const outsideCell = container.querySelector(
      '[data-row-index="0"][data-column-index="2"]',
    ) as HTMLTableCellElement | null

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
})
