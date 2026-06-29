// @zvndev/yable-react — Row Grouping component tests
// Mounts a real <Table> with `grouping` + an aggregated column and proves group
// header rows render (toggle + group value + leaf count), aggregates show, and
// the toggle expands/collapses the underlying leaf rows.

import { describe, it, expect } from 'vitest'
import { fireEvent, render, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

interface Sale {
  id: string
  region: string
  amount: number
}

const data: Sale[] = [
  { id: '1', region: 'West', amount: 100 },
  { id: '2', region: 'West', amount: 200 },
  { id: '3', region: 'East', amount: 50 },
]

const col = createColumnHelper<Sale>()
const columns = [
  col.accessor('region', { header: 'Region' }),
  col.accessor('amount', { header: 'Amount', aggregationFn: 'sum' }),
]

function GroupedTable() {
  const table = useTable<Sale>({
    data,
    columns,
    getRowId: (row) => row.id,
    initialState: {
      grouping: ['region'],
      pagination: { pageIndex: 0, pageSize: 50 },
    },
  })
  return <Table table={table} />
}

describe('<Table> row grouping', () => {
  it('renders group header rows with aggregated values', () => {
    const { container } = render(<GroupedTable />)

    const groupCells = container.querySelectorAll('td[data-grouped]')
    expect(groupCells.length).toBeGreaterThan(0)

    // Group values + leaf counts.
    expect(container.textContent).toContain('West')
    expect(container.textContent).toContain('(2)')
    expect(container.textContent).toContain('East')
    expect(container.textContent).toContain('(1)')

    // Aggregated amount column rolls up to the sum on the group row.
    expect(container.textContent).toContain('300') // West: 100 + 200

    // Collapsed by default → individual leaf amounts are not rendered.
    expect(container.textContent).not.toContain('100')
    expect(container.textContent).not.toContain('200')
  })

  it('expands and collapses a group via the toggle', () => {
    const { container } = render(<GroupedTable />)

    const toggle = container.querySelector('.yable-group-toggle') as HTMLButtonElement
    expect(toggle).toBeTruthy()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    // Expand the first group (West) → its leaf amounts become visible.
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(container.textContent).toContain('100')
    expect(container.textContent).toContain('200')

    // Collapse again → leaves hidden once more.
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(container.textContent).not.toContain('100')
  })

  it('marks only group rows with data-grouped', () => {
    const { container } = render(<GroupedTable />)
    const rows = container.querySelectorAll('tbody tr')
    // Two collapsed groups → two visible rows, both group headers.
    expect(rows.length).toBe(2)
    rows.forEach((row) => {
      expect(within(row as HTMLElement).queryByText(/\(\d+\)/)).toBeTruthy()
    })
  })
})
