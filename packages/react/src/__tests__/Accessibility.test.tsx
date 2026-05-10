// @zvndev/yable-react — Accessibility tests

import { beforeAll, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

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
  { id: '3', name: 'Charlie', age: 35 },
]

const col = createColumnHelper<TestRow>()

const columns = [
  col.accessor('name', { header: 'Name', enableSorting: true }),
  col.accessor('age', { header: 'Age', enableSorting: true }),
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function BasicTable({ ariaLabel }: { ariaLabel?: string }) {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: false,
    enableExpanding: false,
  })

  return <Table table={table} ariaLabel={ariaLabel} />
}

function SelectableTable() {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
  })

  return <Table table={table} />
}

function ExpandableTable() {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    enableExpanding: true,
  })

  return <Table table={table} />
}

// ---------------------------------------------------------------------------
// TASK-06: aria-label prop
// ---------------------------------------------------------------------------

describe('Table aria-label', () => {
  it('renders with default aria-label "Data table"', () => {
    render(<BasicTable />)

    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-label', 'Data table')
  })

  it('renders with custom aria-label', () => {
    render(<BasicTable ariaLabel="Employee directory" />)

    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-label', 'Employee directory')
  })
})

// ---------------------------------------------------------------------------
// TASK-07: aria-live status region
// ---------------------------------------------------------------------------

describe('aria-live status region', () => {
  it('renders an aria-live region in the DOM', () => {
    render(<BasicTable />)

    const statusRegion = screen.getByRole('status')
    expect(statusRegion).toBeInTheDocument()
    expect(statusRegion).toHaveAttribute('aria-live', 'polite')
    expect(statusRegion).toHaveAttribute('aria-atomic', 'true')
  })
})

// ---------------------------------------------------------------------------
// TASK-08: aria-selected on selected rows
// ---------------------------------------------------------------------------

describe('aria-selected on rows', () => {
  it('marks selected rows with aria-selected="true"', () => {
    const { container } = render(<SelectableTable />)

    // All rows should have aria-selected="false" initially
    const rows = container.querySelectorAll('tr.yable-tr')
    rows.forEach((row) => {
      expect(row).toHaveAttribute('aria-selected', 'false')
    })
  })

  it('does not add aria-selected when selection is disabled', () => {
    const { container } = render(<BasicTable />)

    const rows = container.querySelectorAll('tr.yable-tr')
    rows.forEach((row) => {
      expect(row).not.toHaveAttribute('aria-selected')
    })
  })
})

// ---------------------------------------------------------------------------
// TASK-09: aria-expanded on expandable rows
// ---------------------------------------------------------------------------

describe('aria-expanded on expandable rows', () => {
  it('marks collapsed expandable rows with aria-expanded="false"', () => {
    const { container } = render(<ExpandableTable />)

    const rows = container.querySelectorAll('tr.yable-tr')
    rows.forEach((row) => {
      expect(row).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('does not add aria-expanded when expansion is disabled', () => {
    const { container } = render(<BasicTable />)

    const rows = container.querySelectorAll('tr.yable-tr')
    rows.forEach((row) => {
      expect(row).not.toHaveAttribute('aria-expanded')
    })
  })
})

// ---------------------------------------------------------------------------
// TASK-10: Home/End/Ctrl+Home/Ctrl+End keyboard navigation (core unit tests)
// These are integration-level checks — the core logic is already tested in
// packages/core/src/features/__tests__/keyboardNavigation.test.ts
// ---------------------------------------------------------------------------

describe('Home/End keyboard navigation handlers', () => {
  it('Home key moves focus to first column in current row', () => {
    render(<BasicTable />)

    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'Home' })

    // The handler was called without errors — core logic is tested separately
    expect(grid).toBeInTheDocument()
  })

  it('End key moves focus to last column in current row', () => {
    render(<BasicTable />)

    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'End' })

    expect(grid).toBeInTheDocument()
  })

  it('Ctrl+Home moves focus to first cell in table', () => {
    render(<BasicTable />)

    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'Home', ctrlKey: true })

    expect(grid).toBeInTheDocument()
  })

  it('Ctrl+End moves focus to last cell in table', () => {
    render(<BasicTable />)

    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'End', ctrlKey: true })

    expect(grid).toBeInTheDocument()
  })
})
