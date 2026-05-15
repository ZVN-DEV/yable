// @zvndev/yable-react — YableProvider tests

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'
import { YableProvider } from '../YableProvider'

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

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function BasicTable(props: React.ComponentProps<typeof Table<TestRow>>) {
  return <Table {...props} />
}

function TestTableWithProvider({
  tableSpecificProps,
}: {
  tableSpecificProps?: Partial<React.ComponentProps<typeof Table<TestRow>>>
}) {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
  })

  return <BasicTable table={table} {...tableSpecificProps} />
}

// Helper that exposes the resolved table options via a data attribute
function DefaultColumnDefInspector({
  defaultColumnDef,
}: {
  defaultColumnDef?: Parameters<typeof useTable<TestRow>>[0]['defaultColumnDef']
}) {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    defaultColumnDef,
  })

  // Expose the resolved defaultColumnDef from options for inspection
  const resolved = table.options.defaultColumnDef
  return (
    <div data-testid="inspector" data-default-col-def={JSON.stringify(resolved)}>
      {resolved ? 'has-defaults' : 'no-defaults'}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('YableProvider', () => {
  describe('tableProps defaults', () => {
    it('applies provider defaults to Table', () => {
      render(
        <YableProvider striped bordered compact>
          <TestTableWithProvider />
        </YableProvider>,
      )

      const container = screen.getByRole('grid')
      expect(container.className).toContain('yable--striped')
      expect(container.className).toContain('yable--bordered')
      expect(container.className).toContain('yable--compact')
    })

    it('applies stickyHeader from provider', () => {
      render(
        <YableProvider stickyHeader>
          <TestTableWithProvider />
        </YableProvider>,
      )

      const container = screen.getByRole('grid')
      expect(container.className).toContain('yable--sticky-header')
    })

    it('applies theme from provider', () => {
      render(
        <YableProvider theme="stripe">
          <TestTableWithProvider />
        </YableProvider>,
      )

      const container = screen.getByRole('grid')
      expect(container.className).toContain('yable-theme-stripe')
      expect(container).toHaveAttribute('data-theme', 'stripe')
    })

    it('applies ariaLabel from provider', () => {
      render(
        <YableProvider ariaLabel="Employee data">
          <TestTableWithProvider />
        </YableProvider>,
      )

      const container = screen.getByRole('grid')
      expect(container).toHaveAttribute('aria-label', 'Employee data')
    })

    it('explicit props override provider defaults', () => {
      render(
        <YableProvider striped theme="stripe" ariaLabel="Default label">
          <TestTableWithProvider
            tableSpecificProps={{
              striped: false,
              theme: 'alpine',
              ariaLabel: 'Custom label',
            }}
          />
        </YableProvider>,
      )

      const container = screen.getByRole('grid')
      // striped=false should override provider's striped=true
      expect(container.className).not.toContain('yable--striped')
      // theme should be alpine, not stripe
      expect(container.className).toContain('yable-theme-alpine')
      expect(container.className).not.toContain('yable-theme-stripe')
      // ariaLabel should be overridden
      expect(container).toHaveAttribute('aria-label', 'Custom label')
    })
  })

  describe('defaultColumnDef', () => {
    it('picks up defaultColumnDef from provider in useTable', () => {
      render(
        <YableProvider defaultColumnDef={{ enableSorting: true, size: 200 }}>
          <DefaultColumnDefInspector />
        </YableProvider>,
      )

      const inspector = screen.getByTestId('inspector')
      expect(inspector.textContent).toBe('has-defaults')
      const resolved = JSON.parse(inspector.getAttribute('data-default-col-def')!)
      expect(resolved.enableSorting).toBe(true)
      expect(resolved.size).toBe(200)
    })

    it('table-level defaultColumnDef overrides provider-level', () => {
      render(
        <YableProvider defaultColumnDef={{ enableSorting: true, size: 200 }}>
          <DefaultColumnDefInspector defaultColumnDef={{ size: 300, enableResizing: true }} />
        </YableProvider>,
      )

      const inspector = screen.getByTestId('inspector')
      const resolved = JSON.parse(inspector.getAttribute('data-default-col-def')!)
      // Table-level size wins
      expect(resolved.size).toBe(300)
      // Provider-level enableSorting is still inherited
      expect(resolved.enableSorting).toBe(true)
      // Table-level enableResizing is present
      expect(resolved.enableResizing).toBe(true)
    })
  })

  describe('without provider', () => {
    it('renders without crashing when no YableProvider is present', () => {
      render(<TestTableWithProvider />)

      // Table still works
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('useTable works without provider — no defaultColumnDef injected', () => {
      render(<DefaultColumnDefInspector />)

      const inspector = screen.getByTestId('inspector')
      expect(inspector.textContent).toBe('no-defaults')
    })
  })
})
