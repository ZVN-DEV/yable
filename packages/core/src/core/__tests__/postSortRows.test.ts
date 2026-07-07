import { describe, it, expect, vi } from 'vitest'
import { makeTable } from './harness'
import type { ColumnDef } from '../../types'

interface Row {
  id: string
  parentId: string | null
  name: string
  order: number
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'order', header: 'Order' },
]

// Parents P1/P2 with children; sorting by name would separate children from
// parents. postSortRows re-groups each child under its parent — the canonical
// AG-parity use case.
const data: Row[] = [
  { id: 'c2', parentId: 'p2', name: 'zeta', order: 5 },
  { id: 'p1', parentId: null, name: 'alpha', order: 1 },
  { id: 'c1', parentId: 'p1', name: 'yankee', order: 4 },
  { id: 'p2', parentId: null, name: 'bravo', order: 2 },
]

function regroupUnderParents(rows: { id: string; original: Row }[]) {
  const byParent = new Map<string, typeof rows>()
  const parents: typeof rows = []
  for (const r of rows) {
    if (r.original.parentId === null) {
      parents.push(r)
    } else {
      const bucket = byParent.get(r.original.parentId) ?? []
      bucket.push(r)
      byParent.set(r.original.parentId, bucket)
    }
  }
  const out: typeof rows = []
  for (const p of parents) {
    out.push(p)
    for (const child of byParent.get(p.original.id) ?? []) out.push(child)
  }
  return out
}

describe('postSortRows', () => {
  it('reorders rows after sorting, keeping children under parents', () => {
    const { table } = makeTable(data, columns, {
      initialState: { sorting: [{ id: 'name', desc: false }] },
      postSortRows: (rows) => regroupUnderParents(rows as never) as never,
    })

    const ids = table.getSortedRowModel().rows.map((r) => r.id)
    // name-sorted order is alpha(p1), bravo(p2), yankee(c1), zeta(c2);
    // regrouping yields p1 > c1, p2 > c2.
    expect(ids).toEqual(['p1', 'c1', 'p2', 'c2'])
  })

  it('runs even when no column sorting is active', () => {
    const spy = vi.fn((rows: unknown[]) => rows)
    const { table } = makeTable(data, columns, {
      postSortRows: spy as never,
    })

    table.getSortedRowModel()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('supports in-place mutation (void return) of the provided array', () => {
    const { table } = makeTable(data, columns, {
      postSortRows: (rows) => {
        rows.reverse()
        // no return — mutation should be honored
      },
    })

    const ids = table.getSortedRowModel().rows.map((r) => r.id)
    expect(ids).toEqual(['p2', 'c1', 'p1', 'c2'])
  })

  it('does not mutate the filtered row model when reordering', () => {
    const { table } = makeTable(data, columns, {
      postSortRows: (rows) => rows.slice().reverse(),
    })

    const filteredBefore = table.getFilteredRowModel().rows.map((r) => r.id)
    table.getSortedRowModel()
    const filteredAfter = table.getFilteredRowModel().rows.map((r) => r.id)
    expect(filteredAfter).toEqual(filteredBefore)
  })

  it('is skipped under manualSorting', () => {
    const spy = vi.fn((rows: unknown[]) => rows)
    const { table } = makeTable(data, columns, {
      manualSorting: true,
      postSortRows: spy as never,
    })

    table.getSortedRowModel()
    expect(spy).not.toHaveBeenCalled()
  })
})
