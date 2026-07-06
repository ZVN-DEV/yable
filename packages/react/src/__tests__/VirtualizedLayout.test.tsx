// @zvndev/yable-react — Virtualized layout contract tests
//
// Guards the header/body width-sync contract: virtualized rows must stay real
// table rows (no per-row absolute positioning, which blockifies <tr> and
// detaches cell widths from the shared colgroup), with the mounted window
// offset as one block on the inner table. Also covers virtualViewportHeight.

import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

interface Person {
  id: string
  name: string
  role: string
}

const data: Person[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
  role: i % 2 === 0 ? 'Engineer' : 'Designer',
}))

const col = createColumnHelper<Person>()
const columns = [
  col.accessor('name', { header: 'Name', size: 220 }),
  col.accessor('role', { header: 'Role', size: 140 }),
]

function VirtualTable({ viewportHeight }: { viewportHeight?: number }) {
  const table = useTable<Person>({
    data,
    columns,
    getRowId: (row) => row.id,
    enableVirtualization: true,
    virtualViewportHeight: viewportHeight,
    rowHeight: 40,
    overscan: 0,
    initialState: { pagination: { pageIndex: 0, pageSize: 1000 } },
  })

  return <Table table={table} />
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

async function renderVirtualized(viewportHeight?: number) {
  const { container } = render(<VirtualTable viewportHeight={viewportHeight} />)
  await waitFor(() => {
    expect(
      container.querySelector('.yable-virtual-scroll-container tr[data-row-id="1"]'),
    ).toBeInTheDocument()
  })
  return container
}

describe('<Table> virtualized layout contract', () => {
  it('renders mounted rows as real table rows sharing the colgroup (no absolute positioning)', async () => {
    const restoreHeight = mockVirtualContainerHeight(200)

    try {
      const container = await renderVirtualized()

      const innerTable = container.querySelector<HTMLTableElement>('.yable-virtual-spacer table')
      expect(innerTable).toBeInTheDocument()
      // The window offset lives on the inner table, not on each row.
      expect(innerTable!.style.transform).toMatch(/^translateY\(\d+(\.\d+)?px\)$/)
      // The inner table mirrors the outer table's colgroup widths.
      const colWidths = Array.from(innerTable!.querySelectorAll('colgroup col')).map(
        (c) => (c as HTMLElement).style.width,
      )
      expect(colWidths).toEqual(['220px', '140px'])

      const mountedRows = Array.from(innerTable!.querySelectorAll('tbody tr'))
      expect(mountedRows.length).toBeGreaterThan(0)
      for (const tr of mountedRows) {
        const style = (tr as HTMLElement).style
        expect(style.position).not.toBe('absolute')
        expect(style.transform).toBe('')
        // Rows keep their measured height so scroll math stays exact.
        expect(style.height).toMatch(/px$/)
        // Every mounted row renders a cell in every column slot.
        expect(tr.querySelectorAll('td')).toHaveLength(2)
      }
    } finally {
      restoreHeight()
    }
  })

  it('honors virtualViewportHeight for the scroll viewport', async () => {
    const restoreHeight = mockVirtualContainerHeight(398)

    try {
      const container = await renderVirtualized(398)
      const scroller = container.querySelector<HTMLElement>('.yable-virtual-scroll-container')
      expect(scroller).toBeInTheDocument()
      expect(scroller!.style.height).toBe('398px')
    } finally {
      restoreHeight()
    }
  })

  it('falls back to the ~20-row heuristic viewport without virtualViewportHeight', async () => {
    const restoreHeight = mockVirtualContainerHeight(200)

    try {
      const container = await renderVirtualized()
      const scroller = container.querySelector<HTMLElement>('.yable-virtual-scroll-container')
      expect(scroller!.style.height).toBe('800px') // 40px rowHeight * 20 rows
    } finally {
      restoreHeight()
    }
  })
})
