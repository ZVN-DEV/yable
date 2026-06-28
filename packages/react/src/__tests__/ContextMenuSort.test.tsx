// @zvndev/yable-react — Context menu sort action tests
//
// FIX 3 regression: the context-menu "Sort Ascending"/"Sort Descending"
// items previously called table.setSorting([]) (clearing the sort) instead of
// sorting the right-clicked column. These tests assert the menu sorts the
// column the user actually right-clicked.

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

interface TestRow {
  id: string
  name: string
  age: number
}

const testData: TestRow[] = [
  { id: '1', name: 'Charlie', age: 45 },
  { id: '2', name: 'Alice', age: 30 },
  { id: '3', name: 'Bob', age: 25 },
]

const col = createColumnHelper<TestRow>()
const columns = [
  col.accessor('name', { header: 'Name', enableSorting: true }),
  col.accessor('age', { header: 'Age', enableSorting: true }),
]

function MenuTable() {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
  })
  return <Table table={table} />
}

// Right-click the named column header, then open the "Sort" submenu via the
// keyboard (ArrowRight on the parent item reveals its children deterministically,
// without relying on hover timers).
function openSortSubmenu(columnHeaderName: RegExp) {
  const header = screen.getByRole('columnheader', { name: columnHeaderName })
  fireEvent.contextMenu(header)
  const sortItem = screen.getByText('Sort').closest('[role="menuitem"]') as HTMLElement
  expect(sortItem).not.toBeNull()
  fireEvent.keyDown(sortItem, { key: 'ArrowRight' })
}

describe('ContextMenu sort actions', () => {
  // jsdom has no layout engine, so the keyboard-navigation focus effect's
  // scrollIntoView call would throw. Stub it (matches CellRangeSelection.test).
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView
  })

  it('"Sort Ascending" sorts the right-clicked column ascending', () => {
    render(<MenuTable />)

    openSortSubmenu(/Age/)
    fireEvent.click(screen.getByText('Sort Ascending'))

    expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    // Name was not the target — it must remain unsorted.
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'none')
  })

  it('"Sort Descending" sorts the right-clicked column descending', () => {
    render(<MenuTable />)

    openSortSubmenu(/Age/)
    fireEvent.click(screen.getByText('Sort Descending'))

    expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('"Clear Sort" still resets the sort', () => {
    render(<MenuTable />)

    openSortSubmenu(/Age/)
    fireEvent.click(screen.getByText('Sort Ascending'))
    expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )

    openSortSubmenu(/Age/)
    fireEvent.click(screen.getByText('Clear Sort'))
    expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute('aria-sort', 'none')
  })
})
