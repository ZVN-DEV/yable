// @zvndev/yable-react — Master/detail (renderDetailPanel) tests
//
// FIX 4 regression: TableBody rendered expanded rows via a magic
// `row._renderExpanded()` property that nothing ever set, so the documented
// `renderDetailPanel` option never displayed. These tests assert the detail
// panel renders for expanded rows (and only for expanded rows).

import { useEffect } from 'react'
import { describe, it, expect } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper, type Table as CoreTable } from '@zvndev/yable-core'
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
const columns = [col.accessor('name', { header: 'Name' }), col.accessor('age', { header: 'Age' })]

function DetailHarness({ onReady }: { onReady: (table: CoreTable<TestRow>) => void }) {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    enableExpanding: true,
    renderDetailPanel: (row) => <div>detail-{row.id}</div>,
  })

  useEffect(() => {
    onReady(table)
  }, [onReady, table])

  return <Table table={table} />
}

describe('Master/detail renderDetailPanel', () => {
  it('renders the detail panel only after a row is expanded', () => {
    let tableInstance: CoreTable<TestRow> | null = null
    const { container } = render(
      <DetailHarness
        onReady={(table) => {
          tableInstance = table
        }}
      />,
    )

    // Nothing expanded → no detail panel.
    expect(container.querySelector('.yable-detail-row')).toBeNull()
    expect(screen.queryByText('detail-2')).toBeNull()

    act(() => {
      tableInstance!
        .getRowModel()
        .rows.find((r) => r.id === '2')!
        .toggleExpanded()
    })

    // Expanded → detail panel renders with the row-specific content.
    expect(container.querySelector('.yable-detail-row')).not.toBeNull()
    expect(screen.getByText('detail-2')).toBeInTheDocument()
    // Only the one expanded row has a detail panel.
    expect(container.querySelectorAll('.yable-detail-row').length).toBe(1)
    // Other rows did not render a panel.
    expect(screen.queryByText('detail-1')).toBeNull()
    expect(screen.queryByText('detail-3')).toBeNull()
  })

  it('removes the detail panel when the row is collapsed again', () => {
    let tableInstance: CoreTable<TestRow> | null = null
    render(
      <DetailHarness
        onReady={(table) => {
          tableInstance = table
        }}
      />,
    )

    act(() => {
      tableInstance!
        .getRowModel()
        .rows.find((r) => r.id === '2')!
        .toggleExpanded()
    })
    expect(screen.getByText('detail-2')).toBeInTheDocument()

    act(() => {
      tableInstance!
        .getRowModel()
        .rows.find((r) => r.id === '2')!
        .toggleExpanded()
    })
    expect(screen.queryByText('detail-2')).toBeNull()
  })
})
