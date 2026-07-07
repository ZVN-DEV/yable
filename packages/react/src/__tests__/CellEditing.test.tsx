// @zvndev/yable-react — Cell editing tests

import { beforeAll, describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'
import { CellInput } from '../form/CellInput'

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

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

// ---------------------------------------------------------------------------
// Helper — renders a Table with data displayed via default cell rendering
// ---------------------------------------------------------------------------

function TestCellDisplay({ data = testData }: { data?: TestRow[] }) {
  const columns = [col.accessor('name', { header: 'Name' }), col.accessor('age', { header: 'Age' })]

  const table = useTable<TestRow>({
    data,
    columns,
    getRowId: (row) => row.id,
  })

  return <Table table={table} />
}

// ---------------------------------------------------------------------------
// Helper — renders a Table with editable columns
// ---------------------------------------------------------------------------

function TestEditableTable({ data = testData }: { data?: TestRow[] }) {
  const columns = [
    col.accessor('name', {
      header: 'Name',
      editable: true,
    }),
    col.accessor('age', {
      header: 'Age',
      editable: true,
    }),
  ]

  const table = useTable<TestRow>({
    data,
    columns,
    getRowId: (row) => row.id,
  })

  return <Table table={table} />
}

function TestAlwaysEditableTable({ data = testData }: { data?: TestRow[] }) {
  const columns = [
    col.accessor('name', {
      header: 'Name',
      editable: true,
      meta: { alwaysEditable: true },
      cell: (context) => <CellInput context={context} />,
    }),
    col.accessor('age', {
      header: 'Age',
    }),
  ]

  const table = useTable<TestRow>({
    data,
    columns,
    getRowId: (row) => row.id,
  })

  return <Table table={table} />
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Cell display', () => {
  it('renders cell values in view mode', () => {
    render(<TestCellDisplay />)

    // Cells should show their values as plain text
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('renders cells with role="gridcell"', () => {
    render(<TestCellDisplay />)

    const cells = screen.getAllByRole('gridcell')
    // 2 rows x 2 columns = 4 cells
    expect(cells.length).toBe(4)
  })

  it('cells have correct data-column-id attributes', () => {
    render(<TestCellDisplay />)

    const cells = screen.getAllByRole('gridcell')
    const columnIds = cells.map((c) => c.getAttribute('data-column-id'))
    expect(columnIds).toEqual(['name', 'age', 'name', 'age'])
  })

  it('cells have aria-colindex attributes', () => {
    render(<TestCellDisplay />)

    const cells = screen.getAllByRole('gridcell')
    // First row: col 1, col 2; Second row: col 1, col 2
    expect(cells[0]).toHaveAttribute('aria-colindex', '1')
    expect(cells[1]).toHaveAttribute('aria-colindex', '2')
    expect(cells[2]).toHaveAttribute('aria-colindex', '1')
    expect(cells[3]).toHaveAttribute('aria-colindex', '2')
  })
})

describe('Editable cells', () => {
  it('renders editable table with cell values displayed', () => {
    render(<TestEditableTable />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('cells are not in editing state by default', () => {
    render(<TestEditableTable />)

    const cells = screen.getAllByRole('gridcell')
    // No cell should have data-editing attribute
    cells.forEach((cell) => {
      expect(cell).not.toHaveAttribute('data-editing')
    })
  })

  it('cells do not show cell-status by default (idle state)', () => {
    render(<TestEditableTable />)

    const cells = screen.getAllByRole('gridcell')
    // Idle cells should not have data-cell-status attribute
    cells.forEach((cell) => {
      expect(cell).not.toHaveAttribute('data-cell-status')
    })
  })

  it('rerenders always-editable cells when pending values change', () => {
    render(<TestAlwaysEditableTable />)

    const input = screen.getByDisplayValue('Alice')
    fireEvent.change(input, { target: { value: 'Alice QA' } })

    expect(screen.getByDisplayValue('Alice QA')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Configured editors (#58) — editConfig should render a built-in editor while
// editing, even when the column also defines a custom `cell` display renderer.
// ---------------------------------------------------------------------------

describe('Configured editors from editConfig (#58)', () => {
  function StyledEditableTable() {
    const columns = [
      col.accessor('name', {
        header: 'Name',
        editable: true,
        editConfig: { type: 'text' },
        // A real column styles its cells — this must NOT block edit mode.
        cell: (ctx) => <span className="tabular-nums">{`«${ctx.getValue()}»`}</span>,
      }),
      col.accessor('age', { header: 'Age' }),
    ]
    const table = useTable<TestRow>({ data: testData, columns, getRowId: (row) => row.id })
    return <Table table={table} />
  }

  function DefaultEditableWithConfig() {
    const columns = [
      col.accessor('name', { header: 'Name', editable: true, editConfig: { type: 'text' } }),
      col.accessor('age', { header: 'Age' }),
    ]
    const table = useTable<TestRow>({ data: testData, columns, getRowId: (row) => row.id })
    return <Table table={table} />
  }

  function SelectEditableTable() {
    const columns = [
      col.accessor('name', {
        header: 'Name',
        editable: true,
        editConfig: {
          type: 'select',
          options: [
            { label: 'Alice', value: 'Alice' },
            { label: 'Zoe', value: 'Zoe' },
          ],
        },
        cell: (ctx) => <strong>{String(ctx.getValue())}</strong>,
      }),
      col.accessor('age', { header: 'Age' }),
    ]
    const table = useTable<TestRow>({ data: testData, columns, getRowId: (row) => row.id })
    return <Table table={table} />
  }

  it('renders the custom cell in display mode', () => {
    render(<StyledEditableTable />)
    expect(screen.getByText('«Alice»')).toBeInTheDocument()
  })

  it('swaps in the configured text editor when a styled cell enters edit mode', () => {
    render(<StyledEditableTable />)

    // Click the styled display cell to enter edit mode.
    fireEvent.click(screen.getByText('«Alice»'))

    // The built-in editor now renders with the current value — previously the
    // custom `cell` fn won and no input ever appeared.
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('renders an editor for a default editable column with only editConfig', () => {
    render(<DefaultEditableWithConfig />)

    fireEvent.click(screen.getByText('Alice'))
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('renders a select editor for editConfig.type "select"', () => {
    render(<SelectEditableTable />)

    fireEvent.click(screen.getByText('Alice'))
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    expect(select.value).toBe('Alice')
  })
})
