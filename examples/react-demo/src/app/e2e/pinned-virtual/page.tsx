'use client'

// E2E fixture: pinned columns under ROW virtualization.
//
// Backlog item 2 (2026-07): under `enableVirtualization`, pinned body cells rode
// away during horizontal scroll while the pinned header stayed put, and the
// horizontal scrollbar was unreachable without scrolling to the last row. The
// fix makes `.yable-virtual-scroll-container` the single scroll container for
// both axes and moves the header inside it so header `th` and body `td` resolve
// `position: sticky` against the same scroller.
//
// This grid is deliberately WIDER than its container (columns sum to ~1700px in
// a 700px section) so horizontal scroll is forced, with columns pinned on both
// edges. e2e/interactions.spec.ts drives real wheel input over it.

import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'

interface PinRow {
  id: number
  a: string
  b: string
  c: string
  d: string
  e: string
  f: string
  g: string
  h: string
  actions: string
}

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

const ROWS: PinRow[] = Array.from({ length: 1000 }, (_, i) => {
  const row: PinRow = {
    id: i + 1,
    a: `a${i + 1}`,
    b: `b${i + 1}`,
    c: `c${i + 1}`,
    d: `d${i + 1}`,
    e: `e${i + 1}`,
    f: `f${i + 1}`,
    g: `g${i + 1}`,
    h: `h${i + 1}`,
    actions: `act${i + 1}`,
  }
  return row
})

const col = createColumnHelper<PinRow>()

// id(120) + a..h(180 * 8 = 1440) + actions(140) = 1700px in a 700px container.
const columns = [
  col.accessor('id', { header: 'ID', size: 120 }),
  ...LETTERS.map((key) => col.accessor(key, { header: key.toUpperCase(), size: 180 })),
  col.accessor('actions', { header: 'Actions', size: 140 }),
]

function PinnedVirtualGrid() {
  const table = useTable<PinRow>({
    data: ROWS,
    columns,
    getRowId: (row) => String(row.id),
    enableVirtualization: true,
    virtualViewportHeight: 300,
    rowHeight: 40,
    overscan: 5,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 100_000 },
      columnPinning: { left: ['id'], right: ['actions'] },
    },
  })

  return <Table table={table} bordered stickyHeader />
}

export default function PinnedVirtualFixturePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Pinned + virtualized fixture</h1>
      <section data-testid="grid-pinned-virtual" style={{ width: 700 }}>
        <h2>Pinned columns under row virtualization</h2>
        <PinnedVirtualGrid />
      </section>
    </main>
  )
}
