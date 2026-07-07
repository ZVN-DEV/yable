'use client'

// E2E fixture: density presets (Feature B).
//
// Three grids, one per `density` preset, over identical data. The spec in
// e2e/interactions.spec.ts reads each preset's rendered row heights and asserts
// condensed < regular < spacious. Keep the geometry stable.

import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'

interface DensityRow {
  id: number
  name: string
  team: string
  role: string
}

const ROWS: DensityRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  team: ['Platform', 'Design', 'Product', 'Research'][i % 4]!,
  role: i % 2 === 0 ? 'Engineer' : 'Designer',
}))

const col = createColumnHelper<DensityRow>()
const columns = [
  col.accessor('name', { header: 'Name', size: 200 }),
  col.accessor('team', { header: 'Team', size: 160 }),
  col.accessor('role', { header: 'Role', size: 140 }),
]

function DensityGrid({ density }: { density: 'condensed' | 'regular' | 'spacious' }) {
  const table = useTable<DensityRow>({
    data: ROWS,
    columns,
    getRowId: (row) => String(row.id),
  })
  return <Table table={table} density={density} bordered />
}

export default function DensityFixturePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Density fixture</h1>
      <section data-testid="density-condensed" style={{ width: 640, marginBottom: 32 }}>
        <h2>Condensed</h2>
        <DensityGrid density="condensed" />
      </section>
      <section data-testid="density-regular" style={{ width: 640, marginBottom: 32 }}>
        <h2>Regular</h2>
        <DensityGrid density="regular" />
      </section>
      <section data-testid="density-spacious" style={{ width: 640 }}>
        <h2>Spacious</h2>
        <DensityGrid density="spacious" />
      </section>
    </main>
  )
}
