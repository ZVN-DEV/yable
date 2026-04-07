// @zvndev/yable-react — Sorting interaction tests

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

interface TestRow {
  id: string
  name: string
  age: number
}

const testData: TestRow[] = [
  { id: '1', name: 'Charlie', age: 45 },
  { id: '2', name: 'Alice', age: 30 },
  { id: '3', name: 'Bob', age: 25 },
]

const col = createColumnHelper<TestRow>()

const columns = [
  col.accessor('name', { header: 'Name', enableSorting: true }),
  col.accessor('age', { header: 'Age', enableSorting: true }),
]

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function SortableTable() {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
  })

  return <Table table={table} />
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Sorting', () => {
  it('renders sortable headers with aria-sort="none"', () => {
    render(<SortableTable />)

    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    expect(nameHeader).toHaveAttribute('aria-sort', 'none')
    expect(nameHeader).toHaveAttribute('data-sortable', 'true')
  })

  it('clicking a sortable header changes aria-sort to ascending', async () => {
    const user = userEvent.setup()
    render(<SortableTable />)

    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    await user.click(nameHeader)

    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('clicking a sortable header twice changes aria-sort to descending', async () => {
    const user = userEvent.setup()
    render(<SortableTable />)

    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    await user.click(nameHeader)
    await user.click(nameHeader)

    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('sorts row data in ascending order after click', async () => {
    const user = userEvent.setup()
    render(<SortableTable />)

    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    await user.click(nameHeader)

    const cells = screen.getAllByRole('gridcell')
    // After ascending sort on name: Alice, Bob, Charlie
    const nameValues = cells
      .filter((_cell, i) => i % 2 === 0) // name is first column (even indices)
      .map((cell) => cell.textContent)

    expect(nameValues).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('sorts row data in descending order after two clicks', async () => {
    const user = userEvent.setup()
    render(<SortableTable />)

    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    await user.click(nameHeader)
    await user.click(nameHeader)

    const cells = screen.getAllByRole('gridcell')
    const nameValues = cells
      .filter((_cell, i) => i % 2 === 0)
      .map((cell) => cell.textContent)

    expect(nameValues).toEqual(['Charlie', 'Bob', 'Alice'])
  })

  it('renders a sort indicator on the sorted column', async () => {
    const user = userEvent.setup()
    render(<SortableTable />)

    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    await user.click(nameHeader)

    // SortIndicator renders within the header
    const indicator = nameHeader.querySelector('.yable-sort-indicator')
    expect(indicator).toBeInTheDocument()
  })
})
