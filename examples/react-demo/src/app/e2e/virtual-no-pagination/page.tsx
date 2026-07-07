'use client'

// E2E fixture: row virtualization WITHOUT a pagination override (#54).
//
// With `enableVirtualization` and no pagination config, the default page size
// (10) used to slice the dataset feeding the virtualizer, so only 10 rows ever
// mounted and virtualization looked broken. The fix bypasses the client
// pagination slice under virtualization, so the full dataset scrolls. This
// fixture deliberately sets NO `pagination`/`pageSize`.

import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'

interface Row {
  id: number
  name: string
}

const ROWS: Row[] = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }))

const col = createColumnHelper<Row>()
const columns = [
  col.accessor('id', { header: 'ID', size: 100 }),
  col.accessor('name', { header: 'Name', size: 220 }),
]

function VirtualNoPagination() {
  const table = useTable<Row>({
    data: ROWS,
    columns,
    getRowId: (r) => String(r.id),
    enableVirtualization: true,
    virtualViewportHeight: 300,
    rowHeight: 40,
    overscan: 4,
    // Intentionally NO pagination config — the default page size must not
    // limit the virtualized dataset.
  })
  return <Table table={table} bordered stickyHeader />
}

export default function VirtualNoPaginationFixture() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Virtualization without pagination fixture</h1>
      <section data-testid="grid-virt-nopage" style={{ width: 600 }}>
        <VirtualNoPagination />
      </section>
    </main>
  )
}
