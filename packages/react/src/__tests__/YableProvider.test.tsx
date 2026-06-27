// @zvndev/yable-react — YableProvider tests

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'
import { YableProvider } from '../YableProvider'
import { createYableConfig, applyYableConfigToColumns, resolveYableProfile } from '../config'

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

  describe('config profiles', () => {
    const config = createYableConfig<TestRow>({
      table: { theme: 'midnight', striped: true, ariaLabel: 'Default profile table' },
      columns: { default: { size: 180, enableResizing: true } },
      rows: { className: 'row-default' },
      cells: {
        named: {
          RichItem: { cellClassName: 'rich-item', cellStyle: { whiteSpace: 'normal' } },
          MutedMeta: { cellClassName: 'muted-meta' },
        },
        byColumn: {
          age: { cellClassName: 'age-by-column', cellType: 'numeric' },
        },
      },
      profiles: {
        compactVariant: {
          table: { theme: 'compact', compact: true, ariaLabel: 'Compact profile table' },
          columns: { default: { size: 96 }, byId: { name: { size: 128 } } },
          cells: { byColumn: { name: { cellClassName: 'compact-name' } } },
        },
      },
    })

    it('resolves named profiles over default config', () => {
      const profile = resolveYableProfile(config, 'compactVariant')

      expect(profile.table?.theme).toBe('compact')
      expect(profile.table?.striped).toBe(true)
      expect(profile.columns?.default?.size).toBe(96)
      expect(profile.columns?.default?.enableResizing).toBe(true)
      expect(profile.rows?.className).toBe('row-default')
    })

    it('applies named cell configs, column configs, and inline column overrides in order', () => {
      const profile = resolveYableProfile(config, 'compactVariant')
      const configured = applyYableConfigToColumns(
        [
          col.accessor('name', {
            header: 'Name',
            cellConfig: 'RichItem',
            cellStyle: { color: 'red' },
          }),
          col.accessor('age', { header: 'Age', cellConfig: 'MutedMeta' }),
        ],
        profile,
      )

      const name = configured[0] as any
      const age = configured[1] as any
      expect(name.cellClassName).toBe('compact-name')
      expect(name.cellStyle).toEqual({ color: 'red' })
      expect(name.size).toBe(128)
      expect(age.cellClassName).toBe('age-by-column')
      expect(age.cellType).toBe('numeric')
    })

    it('applies provider config profile to useTable and Table', () => {
      render(
        <YableProvider config={config} tableProfile="compactVariant">
          <DefaultColumnDefInspector />
          <TestTableWithProvider />
        </YableProvider>,
      )

      const inspector = screen.getByTestId('inspector')
      const resolved = JSON.parse(inspector.getAttribute('data-default-col-def')!)
      expect(resolved.size).toBe(96)

      const container = screen.getByRole('grid')
      expect(container.className).toContain('yable-theme-compact')
      expect(container.className).toContain('yable--compact')
      expect(container).toHaveAttribute('aria-label', 'Compact profile table')
      expect(container.querySelector('tbody tr')).toHaveClass('row-default')
    })

    it('explicit table props override config profile table props', () => {
      render(
        <YableProvider config={config} tableProfile="compactVariant">
          <TestTableWithProvider tableSpecificProps={{ compact: false, theme: 'rose' }} />
        </YableProvider>,
      )

      const container = screen.getByRole('grid')
      expect(container.className).toContain('yable-theme-rose')
      expect(container.className).not.toContain('yable--compact')
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
