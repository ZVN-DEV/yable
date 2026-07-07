import { describe, it, expect } from 'vitest'
import { makeTable } from './harness'
import type { ColumnDef } from '../../types'

interface Row {
  id: string
  name: string
}

const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: 'name', header: 'Name' }]

const data: Row[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i),
  name: `Row ${i}`,
}))

// #54 — enableVirtualization must bypass the client pagination slice, so the
// virtualizer receives the whole dataset instead of only the default page.
describe('enableVirtualization bypasses client pagination (#54)', () => {
  it('paginates normally without virtualization (default page size)', () => {
    const { table } = makeTable(data, columns)
    // Default pagination is pageSize 10.
    expect(table.getRowModel().rows).toHaveLength(10)
  })

  it('feeds the full dataset to the row model when virtualization is on', () => {
    const { table } = makeTable(data, columns, { enableVirtualization: true })
    expect(table.getRowModel().rows).toHaveLength(50)
  })

  it('ignores the configured page size under virtualization', () => {
    const { table } = makeTable(data, columns, {
      enableVirtualization: true,
      initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    })
    expect(table.getRowModel().rows).toHaveLength(50)
  })

  it('still respects manualPagination (server controls the page)', () => {
    // Under manualPagination the pre-pagination model IS the server page, so
    // whatever data is provided is returned as-is (no client slice either way).
    const serverPage = data.slice(0, 20)
    const { table } = makeTable(serverPage, columns, {
      enableVirtualization: true,
      manualPagination: true,
    })
    expect(table.getRowModel().rows).toHaveLength(20)
  })
})
