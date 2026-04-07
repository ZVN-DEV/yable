// @zvndev/yable-react — Pagination component tests

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Pagination } from '../components/Pagination'

// ---------------------------------------------------------------------------
// Test data — 25 rows so we get multiple pages with pageSize=10
// ---------------------------------------------------------------------------

interface TestRow {
  id: string
  value: number
}

function makeRows(count: number): TestRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    value: i + 1,
  }))
}

const col = createColumnHelper<TestRow>()
const columns = [
  col.accessor('id', { header: 'ID' }),
  col.accessor('value', { header: 'Value' }),
]

// ---------------------------------------------------------------------------
// Helper — renders Pagination wired to a real useTable instance
// ---------------------------------------------------------------------------

function TestPagination({
  rowCount = 25,
  pageSize = 10,
  showPageSize = true,
  showInfo = true,
  showFirstLast = true,
}: {
  rowCount?: number
  pageSize?: number
  showPageSize?: boolean
  showInfo?: boolean
  showFirstLast?: boolean
}) {
  const table = useTable<TestRow>({
    data: makeRows(rowCount),
    columns,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize },
    },
  })

  return (
    <Pagination
      table={table}
      showPageSize={showPageSize}
      showInfo={showInfo}
      showFirstLast={showFirstLast}
    />
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Pagination', () => {
  it('renders pagination controls with navigation role', () => {
    render(<TestPagination />)

    const nav = screen.getByRole('navigation', { name: 'Table pagination' })
    expect(nav).toBeInTheDocument()
  })

  it('shows correct row info for the first page', () => {
    render(<TestPagination rowCount={25} pageSize={10} />)

    // "1-10 of 25" — the en-dash is \u2013
    expect(screen.getByText('1\u201310 of 25')).toBeInTheDocument()
  })

  it('shows "No results" when there are no rows', () => {
    render(<TestPagination rowCount={0} />)

    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('renders page number buttons', () => {
    render(<TestPagination rowCount={25} pageSize={10} />)

    // 3 pages total — buttons labelled "Page 1", "Page 2", "Page 3"
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
  })

  it('marks the current page button as active', () => {
    render(<TestPagination rowCount={25} pageSize={10} />)

    const page1 = screen.getByRole('button', { name: 'Page 1' })
    expect(page1).toHaveAttribute('aria-current', 'page')
  })

  it('disables previous/first buttons on the first page', () => {
    render(<TestPagination rowCount={25} pageSize={10} />)

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled()
  })

  it('enables next/last buttons when more pages exist', () => {
    render(<TestPagination rowCount={25} pageSize={10} />)

    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Last page' })).toBeEnabled()
  })

  it('navigates to next page when Next is clicked', async () => {
    const user = userEvent.setup()
    render(<TestPagination rowCount={25} pageSize={10} />)

    const nextBtn = screen.getByRole('button', { name: 'Next page' })
    await user.click(nextBtn)

    // After clicking next, page 2 should be active
    const page2 = screen.getByRole('button', { name: 'Page 2' })
    expect(page2).toHaveAttribute('aria-current', 'page')

    // Info should update to "11-20 of 25"
    expect(screen.getByText('11\u201320 of 25')).toBeInTheDocument()
  })

  it('navigates to previous page when Previous is clicked', async () => {
    const user = userEvent.setup()
    render(<TestPagination rowCount={25} pageSize={10} />)

    // First go to page 2
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')

    // Then go back to page 1
    await user.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('renders page size selector with options', () => {
    render(<TestPagination />)

    const select = screen.getByRole('combobox', { name: 'Rows per page' })
    expect(select).toBeInTheDocument()

    // Default page sizes: 10, 20, 50, 100
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveTextContent('10 rows')
    expect(options[1]).toHaveTextContent('20 rows')
    expect(options[2]).toHaveTextContent('50 rows')
    expect(options[3]).toHaveTextContent('100 rows')
  })

  it('changes page size when selector is changed', async () => {
    const user = userEvent.setup()
    render(<TestPagination rowCount={25} pageSize={10} />)

    const select = screen.getByRole('combobox', { name: 'Rows per page' })
    await user.selectOptions(select, '20')

    // With pageSize=20, first page shows 1-20 of 25
    expect(screen.getByText('1\u201320 of 25')).toBeInTheDocument()
  })

  it('hides page size selector when showPageSize=false', () => {
    render(<TestPagination showPageSize={false} />)

    expect(screen.queryByRole('combobox', { name: 'Rows per page' })).not.toBeInTheDocument()
  })

  it('hides first/last buttons when showFirstLast=false', () => {
    render(<TestPagination showFirstLast={false} />)

    expect(screen.queryByRole('button', { name: 'First page' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Last page' })).not.toBeInTheDocument()
    // Previous and Next should still be present
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
  })
})
