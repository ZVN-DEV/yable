// @zvndev/yable-react — Row spanning rendering tests

import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper, type Row } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

interface WorkItem {
  id: string
  team: string
  owner: string
}

const data: WorkItem[] = [
  { id: '1', team: 'Platform', owner: 'Ada' },
  { id: '2', team: 'Platform', owner: 'Ben' },
  { id: '3', team: 'Design', owner: 'Cora' },
]

function spanMatchingTeams(
  row: Row<WorkItem>,
  rows: Row<WorkItem>[],
  rowIndex: number,
): number | undefined {
  const team = row.getValue('team')
  let span = 1

  while (rowIndex + span < rows.length && rows[rowIndex + span]?.getValue('team') === team) {
    span++
  }

  return span > 1 ? span : undefined
}

const col = createColumnHelper<WorkItem>()
const columns = [
  col.accessor('team', { header: 'Team', rowSpan: spanMatchingTeams }),
  col.accessor('owner', { header: 'Owner' }),
]

function RowSpanTable({ pinnedTopIds = [] }: { pinnedTopIds?: string[] }) {
  const table = useTable<WorkItem>({
    data,
    columns,
    getRowId: (row) => row.id,
    enableRowPinning: pinnedTopIds.length > 0,
    initialState:
      pinnedTopIds.length > 0 ? { rowPinning: { top: pinnedTopIds, bottom: [] } } : undefined,
  })

  return <Table table={table} />
}

function VirtualRowSpanTable() {
  const table = useTable<WorkItem>({
    data,
    columns,
    getRowId: (row) => row.id,
    enableVirtualization: true,
    rowHeight: 40,
    overscan: 0,
  })

  return <Table table={table} />
}

function bodyRows(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('tbody.yable-tbody tr.yable-tr'))
}

function teamCell(row: Element): Element | null {
  return row.querySelector('td[data-column-id="team"]')
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

describe('<Table> row spanning', () => {
  it('renders native rowSpan attributes and skips covered cells', () => {
    const { container } = render(<RowSpanTable />)
    const rows = bodyRows(container)

    expect(rows).toHaveLength(3)
    expect(teamCell(rows[0]!)).toHaveTextContent('Platform')
    expect(teamCell(rows[0]!)).toHaveAttribute('rowspan', '2')
    expect(teamCell(rows[0]!)).toHaveAttribute('data-row-span', '2')
    expect(teamCell(rows[1]!)).not.toBeInTheDocument()
    expect(rows[1]!.querySelector('td[data-column-id="owner"]')).toHaveTextContent('Ben')
    expect(teamCell(rows[2]!)).toHaveTextContent('Design')
    expect(teamCell(rows[2]!)).not.toHaveAttribute('rowspan')
  })

  it('keeps pinned row spans scoped to their rendered section', () => {
    const { container } = render(<RowSpanTable pinnedTopIds={['1']} />)
    const rows = bodyRows(container)

    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveAttribute('data-pinned-row', 'top')
    expect(teamCell(rows[0]!)).toHaveTextContent('Platform')
    expect(teamCell(rows[0]!)).not.toHaveAttribute('rowspan')
    expect(teamCell(rows[1]!)).toHaveTextContent('Platform')
    expect(teamCell(rows[1]!)).not.toHaveAttribute('rowspan')
  })

  it('renders spans in the mounted virtual row window', async () => {
    const restoreHeight = mockVirtualContainerHeight(120)

    try {
      const { container } = render(<VirtualRowSpanTable />)

      await waitFor(() => {
        expect(
          container.querySelector('.yable-virtual-scroll-container tr[data-row-id="1"]'),
        ).toBeInTheDocument()
      })

      const firstTeamCell = container.querySelector(
        '.yable-virtual-scroll-container tr[data-row-id="1"] td[data-column-id="team"]',
      )
      expect(firstTeamCell).toHaveTextContent('Platform')
      expect(firstTeamCell).toHaveAttribute('rowspan', '2')
      expect(
        container.querySelector(
          '.yable-virtual-scroll-container tr[data-row-id="2"] td[data-column-id="team"]',
        ),
      ).not.toBeInTheDocument()
    } finally {
      restoreHeight()
    }
  })
})
