// @zvndev/yable-react — Pinned rows tests
//
// FIX 6 regression: TableBody rendered only table.getRowModel().rows and
// ignored the core row-pinning getters (getTopRows/getCenterRows/getBottomRows),
// so pinned rows never appeared. These tests assert pinned rows render with a
// data-pinned-row attribute (non-virtualized path) and that an empty pinning
// state leaves the body unchanged.

import { useEffect } from 'react'
import { describe, it, expect } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  createColumnHelper,
  type RowPinningState,
  type Table as CoreTable,
} from '@zvndev/yable-core'
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

function PinHarness({
  onReady,
  virtualized = false,
  initialRowPinning,
}: {
  onReady: (table: CoreTable<TestRow>) => void
  virtualized?: boolean
  initialRowPinning?: RowPinningState
}) {
  const table = useTable<TestRow>({
    data: testData,
    columns,
    getRowId: (row) => row.id,
    enableRowPinning: true,
    enableVirtualization: virtualized,
    rowHeight: 40,
    initialState: initialRowPinning ? { rowPinning: initialRowPinning } : undefined,
  })

  useEffect(() => {
    onReady(table)
  }, [onReady, table])

  return <Table table={table} />
}

function bodyRows(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll('tbody.yable-tbody tr.yable-tr')
}

function mockVirtualContainerHeight(height: number): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')

  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return this.classList?.contains('yable-virtual-scroll-container')
        ? height
        : (descriptor?.get?.call(this) ?? 0)
    },
  })

  return () => {
    if (descriptor) {
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', descriptor)
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight')
    }
  }
}

describe('Pinned rows', () => {
  it('renders a top-pinned row with data-pinned-row="top" and no duplication', () => {
    let tableInstance: CoreTable<TestRow> | null = null
    const { container } = render(
      <PinHarness
        onReady={(table) => {
          tableInstance = table
        }}
      />,
    )

    // Baseline: nothing pinned.
    expect(bodyRows(container).length).toBe(3)
    expect(container.querySelector('[data-pinned-row]')).toBeNull()

    act(() => {
      tableInstance!
        .getRowModel()
        .rows.find((r) => r.id === '2')!
        .pin('top')
    })

    const pinnedTop = container.querySelectorAll('[data-pinned-row="top"]')
    expect(pinnedTop.length).toBe(1)
    expect(pinnedTop[0]).toHaveAttribute('data-row-id', '2')

    // Row '2' must appear exactly once (pinned, not also in the center).
    expect(container.querySelectorAll('tr[data-row-id="2"]').length).toBe(1)
    // Still three data rows in total.
    expect(bodyRows(container).length).toBe(3)
  })

  it('renders a bottom-pinned row with data-pinned-row="bottom"', () => {
    let tableInstance: CoreTable<TestRow> | null = null
    const { container } = render(
      <PinHarness
        onReady={(table) => {
          tableInstance = table
        }}
      />,
    )

    act(() => {
      tableInstance!
        .getRowModel()
        .rows.find((r) => r.id === '3')!
        .pin('bottom')
    })

    const pinnedBottom = container.querySelectorAll('[data-pinned-row="bottom"]')
    expect(pinnedBottom.length).toBe(1)
    expect(pinnedBottom[0]).toHaveAttribute('data-row-id', '3')
    expect(container.querySelectorAll('tr[data-row-id="3"]').length).toBe(1)
    expect(bodyRows(container).length).toBe(3)
  })

  it('leaves the body unchanged when nothing is pinned', () => {
    const { container } = render(<PinHarness onReady={() => {}} />)

    const rows = bodyRows(container)
    expect(rows.length).toBe(3)
    expect(container.querySelector('[data-pinned-row]')).toBeNull()
    // Original row-model order preserved.
    expect(Array.from(rows).map((r) => r.getAttribute('data-row-id'))).toEqual(['1', '2', '3'])
  })

  it('renders pinned rows outside the virtualized center window without duplication', async () => {
    const restoreHeight = mockVirtualContainerHeight(120)

    try {
      const { container } = render(
        <PinHarness
          onReady={() => {}}
          virtualized
          initialRowPinning={{ top: ['2'], bottom: ['3'] }}
        />,
      )

      await waitFor(() => {
        expect(
          container.querySelector('.yable-virtual-scroll-container tr[data-row-id="1"]'),
        ).toBeInTheDocument()
      })

      const dataRows = Array.from(container.querySelectorAll('tr.yable-tr'))
      expect(dataRows.map((row) => row.getAttribute('data-row-id'))).toEqual(['2', '1', '3'])
      expect(dataRows[0]).toHaveAttribute('data-pinned-row', 'top')
      expect(dataRows[1]).not.toHaveAttribute('data-pinned-row')
      expect(dataRows[2]).toHaveAttribute('data-pinned-row', 'bottom')

      // Pinned rows render outside the virtualized center window (the spacer).
      // The scroll container now wraps the whole surface (header + pinned rows +
      // window) so pinned rows live inside it, but never inside the spacer that
      // holds the virtualized center rows.
      expect(
        container.querySelector('.yable-virtual-spacer tr[data-row-id="2"]'),
      ).not.toBeInTheDocument()
      expect(
        container.querySelector('.yable-virtual-spacer tr[data-row-id="3"]'),
      ).not.toBeInTheDocument()
      expect(container.querySelectorAll('tr[data-row-id="2"]')).toHaveLength(1)
      expect(container.querySelectorAll('tr[data-row-id="3"]')).toHaveLength(1)
    } finally {
      restoreHeight()
    }
  })
})
