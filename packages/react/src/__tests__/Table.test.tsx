// @zvndev/yable-react — Table component tests

import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'
import { selectColumn } from '../presets'

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

const columns = [col.accessor('name', { header: 'Name' }), col.accessor('age', { header: 'Age' })]

const sizedColumns = [
  col.accessor('name', { header: 'Name', size: 180 }),
  col.accessor('age', { header: 'Age', size: 90 }),
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

function SizedTable({ virtualized = false }: { virtualized?: boolean }) {
  const table = useTable<TestRow>({
    data: testData,
    columns: sizedColumns,
    getRowId: (row) => row.id,
    enableVirtualization: virtualized,
  })

  return <Table table={table} />
}

function SelectableTable() {
  const table = useTable<TestRow>({
    data: testData,
    columns: [selectColumn<TestRow>(), ...columns],
    getRowId: (row) => row.id,
    enableRowClickSelection: true,
  })

  return <Table table={table} />
}

function AlignedTable() {
  const table = useTable<TestRow>({
    data: testData,
    columns: [
      col.accessor('name', { header: 'Name' }),
      col.accessor('age', { header: 'Age', align: 'right', footer: 'Total' }),
    ],
    getRowId: (row) => row.id,
  })

  return <Table table={table} footer />
}

function RowClickTable({
  onRowClick,
  clickableRows,
}: {
  onRowClick: NonNullable<Parameters<typeof useTable<TestRow>>[0]['onRowClick']>
  clickableRows?: boolean
}) {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    onRowClick,
  })

  return <Table table={table} clickableRows={clickableRows} />
}

function HeaderEventsTable({
  onHeaderClick,
  onHeaderContextMenu,
}: {
  onHeaderClick: NonNullable<Parameters<typeof useTable<TestRow>>[0]['onHeaderClick']>
  onHeaderContextMenu: NonNullable<Parameters<typeof useTable<TestRow>>[0]['onHeaderContextMenu']>
}) {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    onHeaderClick,
    onHeaderContextMenu,
  })

  return <Table table={table} />
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

  it('selects rows from the row body and sorts the checkbox column by selected state', () => {
    render(<SelectableTable />)

    const aliceCell = screen.getByText('Alice')
    fireEvent.click(aliceCell)
    expect(aliceCell.closest('tr')).toHaveAttribute('data-selected', 'true')

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[2]!)
    expect(screen.getByText('Bob').closest('tr')).toHaveAttribute('data-selected', 'true')
    fireEvent.click(checkboxes[2]!)
    expect(screen.getByText('Bob').closest('tr')).not.toHaveAttribute('data-selected')

    fireEvent.click(screen.getByRole('columnheader', { name: /select all rows/i }))
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Bob')
    expect(rows[2]).toHaveTextContent('Alice')
  })

  it('emits header click and context menu events', () => {
    const onHeaderClick = vi.fn()
    const onHeaderContextMenu = vi.fn()

    render(
      <HeaderEventsTable onHeaderClick={onHeaderClick} onHeaderContextMenu={onHeaderContextMenu} />,
    )

    const nameHeader = screen.getByRole('columnheader', { name: 'Name' })
    fireEvent.click(nameHeader)
    fireEvent.contextMenu(nameHeader)

    expect(onHeaderClick).toHaveBeenCalledWith(
      expect.objectContaining({ column: expect.objectContaining({ id: 'name' }) }),
    )
    expect(onHeaderContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ column: expect.objectContaining({ id: 'name' }) }),
    )
  })

  // One `align` on the column def has to reach the header, the body, and the
  // footer — otherwise it is no better than a per-cell style.
  it('emits data-align on the header, body, and footer cells of a column', () => {
    const { container } = render(<AlignedTable />)

    expect(container.querySelector('th[data-column-id="age"]')).toHaveAttribute(
      'data-align',
      'right',
    )
    expect(container.querySelector('td[data-column-id="age"]')).toHaveAttribute(
      'data-align',
      'right',
    )
    expect(container.querySelector('tfoot td[data-column-id="age"]')).toHaveAttribute(
      'data-align',
      'right',
    )

    // Unaligned columns stay clean rather than emitting a default.
    expect(container.querySelector('th[data-column-id="name"]')).not.toHaveAttribute('data-align')
  })

  // `onRowClick` used to require a SECOND opt-in (`clickableRows` on the Table
  // element) before the event fired at all, so wiring it through `useTable`
  // alone did nothing. The flag is now purely visual.
  it('fires onRowClick from useTable without a Table-level clickableRows flag', () => {
    const onRowClick = vi.fn()
    render(<RowClickTable onRowClick={onRowClick} />)

    fireEvent.click(screen.getByText('Alice').closest('tr')!)

    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ row: expect.objectContaining({ id: '1' }) }),
    )
  })

  it('marks rows clickable when an onRowClick handler is present', () => {
    render(<RowClickTable onRowClick={vi.fn()} />)

    expect(screen.getByText('Alice').closest('tr')).toHaveAttribute('data-clickable', 'true')
  })

  it('leaves rows unmarked with no handler, and honours an explicit opt-out', () => {
    const { unmount } = render(<TestTable />)
    expect(screen.getByText('Alice').closest('tr')).not.toHaveAttribute('data-clickable')
    unmount()

    const onRowClick = vi.fn()
    render(<RowClickTable onRowClick={onRowClick} clickableRows={false} />)
    const row = screen.getByText('Alice').closest('tr')!
    expect(row).not.toHaveAttribute('data-clickable')

    // Opting out of the affordance must not opt out of the event.
    fireEvent.click(row)
    expect(onRowClick).toHaveBeenCalledTimes(1)
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

  it('renders a shared colgroup for header and body column alignment', () => {
    const { container } = render(<SizedTable />)

    const table = container.querySelector('.yable-table') as HTMLTableElement
    const columns = table.querySelectorAll('colgroup col')

    expect(columns).toHaveLength(2)
    expect(columns[0]).toHaveStyle({ width: '180px' })
    expect(columns[1]).toHaveStyle({ width: '90px' })
    expect(table).toHaveStyle({ minWidth: '270px', tableLayout: 'fixed' })
  })

  it('keeps the virtualized body table on the same colgroup widths', () => {
    const { container } = render(<SizedTable virtualized />)

    const colgroups = container.querySelectorAll('colgroup')

    expect(colgroups).toHaveLength(2)
    for (const colgroup of colgroups) {
      const columns = colgroup.querySelectorAll('col')
      expect(columns[0]).toHaveStyle({ width: '180px' })
      expect(columns[1]).toHaveStyle({ width: '90px' })
    }
  })

  it('updates shared column widths when dragging a resize handle', () => {
    const { container } = render(<SizedTable />)

    const resizeHandle = container.querySelector('.yable-resize-overlay-handle') as HTMLDivElement
    fireEvent.mouseDown(resizeHandle, { clientX: 100 })
    fireEvent.mouseMove(document, { clientX: 140 })
    fireEvent.mouseUp(document, { clientX: 140 })

    const columns = container.querySelectorAll('colgroup col')
    expect(columns[0]).toHaveStyle({ width: '220px' })
    expect(columns[1]).toHaveStyle({ width: '90px' })
  })
})
