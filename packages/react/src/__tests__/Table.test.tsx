// @yable/react — Table component tests

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@yable/core'
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
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
]

const col = createColumnHelper<TestRow>()

const columns = [
  col.accessor('name', { header: 'Name' }),
  col.accessor('age', { header: 'Age' }),
]

// ---------------------------------------------------------------------------
// Helper — renders a Table with useTable wired up
// ---------------------------------------------------------------------------

function TestTable({
  data = testData,
  loading,
  striped,
  bordered,
  compact,
  emptyMessage,
}: {
  data?: TestRow[]
  loading?: boolean
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  emptyMessage?: string
}) {
  const table = useTable<TestRow>({
    data,
    columns,
    getRowId: (row) => row.id,
  })

  return (
    <Table
      table={table}
      loading={loading}
      striped={striped}
      bordered={bordered}
      compact={compact}
      emptyMessage={emptyMessage}
    />
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Table', () => {
  it('renders a basic table with headers and rows', () => {
    render(<TestTable />)

    // Headers
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()

    // Row data
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('renders NoRowsOverlay when data is an empty array', () => {
    render(<TestTable data={[]} />)

    // Default empty message from NoRowsOverlay
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.getByText('There are no rows to display.')).toBeInTheDocument()
  })

  it('renders custom emptyMessage when provided', () => {
    render(<TestTable data={[]} emptyMessage="Nothing here" />)

    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('renders LoadingOverlay when loading=true', () => {
    render(<TestTable loading />)

    const overlay = screen.getByRole('alert')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('does not render NoRowsOverlay when loading=true even with empty data', () => {
    render(<TestTable data={[]} loading />)

    // Loading overlay should be present
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // NoRowsOverlay should NOT be shown while loading
    expect(screen.queryByText('No data')).not.toBeInTheDocument()
  })

  it('applies striped class when striped={true}', () => {
    const { container } = render(<TestTable striped />)

    const wrapper = container.querySelector('.yable')
    expect(wrapper).toHaveClass('yable--striped')
  })

  it('applies bordered class when bordered={true}', () => {
    const { container } = render(<TestTable bordered />)

    const wrapper = container.querySelector('.yable')
    expect(wrapper).toHaveClass('yable--bordered')
  })

  it('applies compact class when compact={true}', () => {
    const { container } = render(<TestTable compact />)

    const wrapper = container.querySelector('.yable')
    expect(wrapper).toHaveClass('yable--compact')
  })

  it('does not apply variant classes when props are not set', () => {
    const { container } = render(<TestTable />)

    const wrapper = container.querySelector('.yable')
    expect(wrapper).not.toHaveClass('yable--striped')
    expect(wrapper).not.toHaveClass('yable--bordered')
    expect(wrapper).not.toHaveClass('yable--compact')
  })

  it('renders with role="grid" and correct aria attributes', () => {
    render(<TestTable />)

    const grid = screen.getByRole('grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveAttribute('aria-rowcount', '2')
    expect(grid).toHaveAttribute('aria-colcount', '2')
  })
})
