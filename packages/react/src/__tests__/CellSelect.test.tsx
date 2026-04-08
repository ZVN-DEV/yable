// @zvndev/yable-react — CellSelect tests

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'
import { CellSelect } from '../form/CellSelect'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

interface TestRow {
  id: string
  department: string
}

const departments = ['Eng', 'Sales', 'HR']
const departmentOptions = departments.map((d) => ({ label: d, value: d }))

const testData: TestRow[] = [
  { id: '1', department: 'Eng' },
]

const col = createColumnHelper<TestRow>()

// Render a table with one always-editable select column. We use
// `meta.alwaysEditable` so the select renders as soon as the table mounts.
function TestSelectTable({
  onCommit,
}: {
  onCommit?: (rowId: string, columnId: string, value: unknown) => void
}) {
  const columns = [
    col.accessor('department', {
      header: 'Department',
      editable: true,
      editConfig: {
        type: 'select',
        options: departmentOptions,
      },
      cell: (info: any) => (
        <CellSelect context={info} options={departmentOptions} />
      ),
      meta: { alwaysEditable: true },
    }),
  ]

  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    onCommit: onCommit
      ? (patches) => {
          for (const p of patches) onCommit(p.rowId, p.columnId, p.value)
          return Promise.resolve()
        }
      : undefined,
  })

  return <Table table={table} />
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CellSelect', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    consoleErrorSpy.mockRestore()
  })

  it('renders a select with the provided options', () => {
    render(<TestSelectTable />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    expect(select.value).toBe('Eng')
    expect(screen.getByRole('option', { name: 'Sales' })).toBeInTheDocument()
  })

  // B1 regression — see CellSelect.tsx commitTimerRef cleanup. If the
  // component unmounts before the deferred commit fires, no commit must
  // run and no console errors should be emitted.
  it('cancels the deferred commit if it unmounts before the timer fires', () => {
    const { unmount } = render(<TestSelectTable />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'Sales' } })

    // Unmount BEFORE the macrotask runs
    unmount()

    // Flush all pending timers — the cleanup effect should have already
    // cancelled the commit timer, so this must be a no-op.
    expect(() => vi.runAllTimers()).not.toThrow()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
