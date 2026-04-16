import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

interface WideRow extends Record<string, string> {
  id: string
}

interface EmployeeRow {
  id: string
  name: string
  department: string
}

const originalRaf = globalThis.requestAnimationFrame
const originalCancelRaf = globalThis.cancelAnimationFrame

beforeEach(() => {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  }
  globalThis.cancelAnimationFrame = () => {}
})

afterEach(() => {
  globalThis.requestAnimationFrame = originalRaf
  globalThis.cancelAnimationFrame = originalCancelRaf
  vi.restoreAllMocks()
})

function WideTableFixture() {
  const col = createColumnHelper<WideRow>()
  const data: WideRow[] = [
    Object.fromEntries(
      ['id', ...Array.from({ length: 12 }, (_, index) => `c${index}`)].map((key, index) => [
        key,
        key === 'id' ? 'row-1' : `v${index - 1}`,
      ]),
    ) as WideRow,
  ]

  const columns = Array.from({ length: 12 }, (_, index) =>
    col.accessor((row) => row[`c${index}`], {
      id: `c${index}`,
      header: `C${index}`,
      size: 120,
    }),
  )

  const table = useTable<WideRow>({
    data,
    columns,
    getRowId: (row) => row.id,
  })

  return <Table table={table} columnVirtualization />
}

function FilterTableFixture() {
  const col = createColumnHelper<EmployeeRow>()
  const data: EmployeeRow[] = [
    { id: '1', name: 'Alice', department: 'Engineering' },
    { id: '2', name: 'Bob', department: 'Sales' },
    { id: '3', name: 'Charlie', department: 'Engineering' },
  ]

  const columns = [
    col.accessor('name', {
      header: 'Name',
      meta: { filterVariant: 'text' },
    }),
    col.accessor('department', {
      header: 'Department',
      meta: { filterVariant: 'set' },
    }),
  ]

  const table = useTable<EmployeeRow>({
    data,
    columns,
    getRowId: (row) => row.id,
  })

  return <Table table={table} floatingFilters />
}

describe('column virtualization + floating filters', () => {
  it('virtualizes wide tables horizontally on the first visible slice', async () => {
    const { container } = render(<WideTableFixture />)
    const scrollContainer = container.querySelector(
      '.yable-horizontal-scroll-container',
    ) as HTMLDivElement
    expect(scrollContainer).toBeInTheDocument()

    let scrollLeft = 0
    Object.defineProperty(scrollContainer, 'clientWidth', {
      configurable: true,
      value: 300,
    })
    Object.defineProperty(scrollContainer, 'scrollLeft', {
      configurable: true,
      get: () => scrollLeft,
      set: (value: number) => {
        scrollLeft = value
      },
    })

    fireEvent.scroll(scrollContainer)

    await waitFor(() => {
      const headers = container.querySelectorAll('thead tr:first-child th[role="columnheader"]')
      expect(headers.length).toBeLessThan(12)
    })

    expect(screen.getByText('C0')).toBeInTheDocument()
    expect(screen.queryByText('C11')).not.toBeInTheDocument()
    expect(container.querySelector('table[data-column-virtualized="true"]')).toBeInTheDocument()

    const renderedCells = container.querySelectorAll('tbody td[role="gridcell"]')
    expect(renderedCells.length).toBeLessThan(12)
  })

  it('renders floating text + set filters and wires them to columnFilters', async () => {
    const user = userEvent.setup()
    render(<FilterTableFixture />)

    const nameFilter = screen.getByLabelText('Filter Name')
    await user.type(nameFilter, 'Ali')

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.queryByText('Bob')).not.toBeInTheDocument()
      expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
    })

    await user.clear(nameFilter)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Filter Department' }))
    await user.click(screen.getByLabelText(/Engineering/))

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
      expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    })
  })
})
