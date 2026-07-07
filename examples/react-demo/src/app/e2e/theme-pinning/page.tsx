'use client'

// E2E fixture: container-level `data-yable-theme` pinning (#51).
//
// A grid wrapped in a `data-yable-theme="light"` container must render with
// LIGHT tokens even when the OS prefers dark (and vice-versa for a "dark"
// container under a light OS). Before the fix the auto dark tokens only keyed
// off `:root`, so a light-pinned container inherited dark tokens on a dark-OS
// machine. The spec emulates `prefers-color-scheme` to exercise both.

import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'

interface Row {
  id: number
  name: string
  value: number
}

const DATA: Row[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `Row ${i + 1}`,
  value: i * 10,
}))

const col = createColumnHelper<Row>()
const columns = [
  col.accessor('name', { header: 'Name', size: 160 }),
  col.accessor('value', { header: 'Value', size: 120 }),
]

function Grid() {
  const table = useTable<Row>({ data: DATA, columns, getRowId: (r) => String(r.id) })
  return <Table table={table} bordered />
}

export default function ThemePinningFixture() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Theme pinning fixture</h1>
      <section data-testid="theme-light" data-yable-theme="light" style={{ marginBottom: 32 }}>
        <h2>Pinned light</h2>
        <Grid />
      </section>
      <section data-testid="theme-dark" data-yable-theme="dark" style={{ marginBottom: 32 }}>
        <h2>Pinned dark</h2>
        <Grid />
      </section>
      <section data-testid="theme-auto">
        <h2>Auto (follows OS)</h2>
        <Grid />
      </section>
    </main>
  )
}
