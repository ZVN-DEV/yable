'use client'

// E2E fixture: header/body alignment regression guard.
//
// Both grids sit in containers deliberately WIDER than their summed column
// widths — the geometry where the 2026-07 homepage misalignment manifested
// (a stretched header table over a fixed-width virtualized body). The spec in
// e2e/alignment.spec.ts asserts pixel alignment for every column at rest,
// mid-scroll, and after a resize. Keep this page free of decorative layout;
// it exists only to hold that geometry stable for the tests.

import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'

interface AlignRow {
  id: number
  name: string
  team: string
  role: string
  score: number
}

const ROWS: AlignRow[] = Array.from({ length: 2000 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  team: ['Platform', 'Design', 'Product', 'Research'][i % 4]!,
  role: i % 2 === 0 ? 'Engineer' : 'Designer',
  score: (i * 7) % 100,
}))

const col = createColumnHelper<AlignRow>()

// Sums to 620px — rendered inside 1200px containers below.
const columns = [
  col.accessor('name', { header: 'Name', size: 200 }),
  col.accessor('team', { header: 'Team', size: 180 }),
  col.accessor('role', { header: 'Role', size: 140 }),
  col.accessor('score', { header: 'Score', size: 100 }),
]

function FixedHeightGrid() {
  const table = useTable<AlignRow>({
    data: ROWS,
    columns,
    getRowId: (row) => String(row.id),
    enableVirtualization: true,
    virtualViewportHeight: 300,
    rowHeight: 40,
    overscan: 3,
    enableColumnResizing: true,
    initialState: { pagination: { pageIndex: 0, pageSize: 100_000 } },
  })

  return <Table table={table} bordered />
}

function VariableHeightGrid() {
  const table = useTable<AlignRow>({
    data: ROWS,
    columns,
    getRowId: (row) => String(row.id),
    enableVirtualization: true,
    virtualViewportHeight: 300,
    rowHeight: (index) => 36 + (index % 5) * 12,
    overscan: 3,
    enableColumnResizing: true,
    initialState: { pagination: { pageIndex: 0, pageSize: 100_000 } },
  })

  return <Table table={table} bordered />
}

export default function AlignmentFixturePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Alignment fixture</h1>
      <section data-testid="align-fixed" style={{ width: 1200, marginBottom: 48 }}>
        <h2>Fixed row height</h2>
        <FixedHeightGrid />
      </section>
      <section data-testid="align-variable" style={{ width: 1200 }}>
        <h2>Variable row height</h2>
        <VariableHeightGrid />
      </section>
    </main>
  )
}
