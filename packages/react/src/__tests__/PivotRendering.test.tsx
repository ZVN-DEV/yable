// @zvndev/yable-react — Pivot rendering tests
// Verifies that <Table> can render the generated pivot row model and dynamic
// pivot columns, instead of requiring consumers to read getPivotRowModel().

import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper, type PivotConfig } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'
import { Pagination } from '../components/Pagination'

interface Sale {
  id: string
  region: string
  category: string
  amount: number
}

const data: Sale[] = [
  { id: '1', region: 'West', category: 'Hardware', amount: 100 },
  { id: '2', region: 'East', category: 'Hardware', amount: 50 },
  { id: '3', region: 'West', category: 'Software', amount: 75 },
  { id: '4', region: 'East', category: 'Software', amount: 125 },
]

const col = createColumnHelper<Sale>()
const columns = [
  col.accessor('region', { header: 'Region' }),
  col.accessor('category', { header: 'Category' }),
  col.accessor('amount', { header: 'Amount' }),
]

const pivotConfig: PivotConfig = {
  rowFields: [{ field: 'category', label: 'Category' }],
  columnFields: [{ field: 'region', label: 'Region' }],
  valueFields: [{ field: 'amount', aggregation: 'sum', label: 'Revenue' }],
  showGrandTotal: true,
}

function PivotTable({ stateDriven = false }: { stateDriven?: boolean }) {
  const table = useTable<Sale>({
    data,
    columns,
    getRowId: (row) => row.id,
    enablePivot: !stateDriven,
    pivotConfig: stateDriven ? undefined : pivotConfig,
    initialState: stateDriven
      ? {
          pivot: {
            enabled: true,
            config: pivotConfig,
            expandedRowGroups: {},
            expandedColumnGroups: {},
          },
        }
      : undefined,
  })

  return <Table table={table} />
}

function PivotCards() {
  const table = useTable<Sale>({
    data,
    columns,
    getRowId: (row) => row.id,
    enablePivot: true,
    pivotConfig,
  })

  return (
    <Table
      table={table}
      adaptiveLayout={{
        mode: 'cards',
        primaryColumnId: '_pivotLabel',
        secondaryColumnIds: ['pivot_East_amount', 'pivot_West_amount'],
      }}
    />
  )
}

function PivotWithPagination() {
  const table = useTable<Sale>({
    data,
    columns,
    getRowId: (row) => row.id,
    enablePivot: true,
    pivotConfig,
  })

  return (
    <Table table={table}>
      <Pagination showPageSize={false} />
    </Table>
  )
}

function getBodyRows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('tbody tr'))
}

describe('<Table> pivot rendering', () => {
  it('renders dynamic pivot columns and synthetic aggregate rows from pivotConfig', () => {
    const { container } = render(<PivotTable />)

    expect(screen.getByRole('columnheader', { name: /Category/ })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /East/ })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /West/ })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /Amount/ })).not.toBeInTheDocument()

    const rows = getBodyRows(container)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('Hardware')
    expect(rows[0]).toHaveTextContent('50')
    expect(rows[0]).toHaveTextContent('100')
    expect(rows[1]).toHaveTextContent('Software')
    expect(rows[1]).toHaveTextContent('125')
    expect(rows[1]).toHaveTextContent('75')
    expect(rows[2]).toHaveTextContent('Grand Total')
    expect(rows[2]).toHaveTextContent('175')
  })

  it('renders pivot mode from state.pivot config', () => {
    const { container } = render(<PivotTable stateDriven />)

    const rows = getBodyRows(container)
    expect(screen.getByRole('columnheader', { name: /East/ })).toBeInTheDocument()
    expect(rows[0]).toHaveTextContent('Hardware')
    expect(rows[0]).toHaveTextContent('50')
    expect(rows[0]).toHaveTextContent('100')
  })

  it('sorts generated pivot value columns through the rendered header', () => {
    const { container } = render(<PivotTable />)

    fireEvent.click(screen.getByRole('columnheader', { name: /West/ }))

    const rows = getBodyRows(container)
    expect(rows[0]).toHaveTextContent('Software')
    expect(rows[1]).toHaveTextContent('Hardware')
  })

  it('can render pivot rows through the adaptive card layout', () => {
    render(<PivotCards />)

    const cards = screen.getAllByRole('row')
    expect(cards).toHaveLength(3)
    expect(within(cards[0]!).getByText('Hardware')).toBeInTheDocument()
    expect(within(cards[0]!).getByText('East')).toBeInTheDocument()
    expect(within(cards[0]!).getByText('50')).toBeInTheDocument()
    expect(within(cards[0]!).getByText('West')).toBeInTheDocument()
    expect(within(cards[0]!).getByText('100')).toBeInTheDocument()
  })

  it('provides the pivot render table to child pagination controls', () => {
    render(<PivotWithPagination />)

    expect(screen.getByText('1–3 of 3')).toBeInTheDocument()
  })
})
