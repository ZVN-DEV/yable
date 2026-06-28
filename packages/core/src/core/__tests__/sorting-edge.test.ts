// AG Grid-parity: sorting edge cases (stability, null ordering, custom
// comparator, natural numeric-string order, multi-sort precedence).

import { describe, it, expect } from 'vitest'
import { createColumnHelper } from '../../columnHelper'
import { makeTable } from './harness'
import type { Row } from '../../types'

describe('Sorting edge cases', () => {
  it('is stable for equal keys (preserves original relative order)', () => {
    interface R {
      id: number
      k: string
    }
    const ch = createColumnHelper<R>()
    const data: R[] = [
      { id: 1, k: 'a' },
      { id: 2, k: 'a' },
      { id: 3, k: 'a' },
    ]
    const { table } = makeTable(data, [ch.accessor('k', {})])
    table.setSorting([{ id: 'k', desc: false }])
    expect(table.getRowModel().rows.map((r) => r.id)).toEqual(['1', '2', '3'])
  })

  it('handles null/undefined values without crashing and keeps all rows', () => {
    interface R {
      id: number
      v: number | null | undefined
    }
    const ch = createColumnHelper<R>()
    const data: R[] = [
      { id: 1, v: 3 },
      { id: 2, v: null },
      { id: 3, v: 1 },
      { id: 4, v: undefined },
    ]
    const { table } = makeTable(data, [ch.accessor('v', {})])
    table.setSorting([{ id: 'v', desc: false }])
    const rows = table.getRowModel().rows
    expect(rows.length).toBe(4)
    // non-null values must be in ascending order among themselves
    const nums = rows.map((r) => (r.original as R).v).filter((v): v is number => v != null)
    expect(nums).toEqual([1, 3])
  })

  it('uses a custom sortingFn function', () => {
    interface R {
      id: number
      s: string
    }
    const ch = createColumnHelper<R>()
    const byLength = (a: Row<R>, b: Row<R>, columnId: string) =>
      (a.getValue(columnId) as string).length - (b.getValue(columnId) as string).length
    const data: R[] = [
      { id: 1, s: 'ccc' },
      { id: 2, s: 'a' },
      { id: 3, s: 'bb' },
    ]
    const { table } = makeTable(data, [ch.accessor('s', { sortingFn: byLength })])
    table.setSorting([{ id: 's', desc: false }])
    expect(table.getRowModel().rows.map((r) => r.id)).toEqual(['2', '3', '1'])
  })

  it('alphanumeric sort orders numeric strings naturally (2 before 10)', () => {
    interface R {
      id: number
      s: string
    }
    const ch = createColumnHelper<R>()
    const data: R[] = [
      { id: 1, s: '10' },
      { id: 2, s: '2' },
      { id: 3, s: '1' },
    ]
    const { table } = makeTable(data, [ch.accessor('s', { sortingFn: 'alphanumeric' })])
    table.setSorting([{ id: 's', desc: false }])
    expect(table.getRowModel().rows.map((r) => (r.original as R).s)).toEqual(['1', '2', '10'])
  })

  it('multi-sort applies primary then secondary key', () => {
    interface R {
      id: number
      g: string
      n: number
    }
    const ch = createColumnHelper<R>()
    const data: R[] = [
      { id: 1, g: 'b', n: 1 },
      { id: 2, g: 'a', n: 2 },
      { id: 3, g: 'a', n: 1 },
    ]
    const { table } = makeTable(data, [ch.accessor('g', {}), ch.accessor('n', {})])
    table.setSorting([
      { id: 'g', desc: false },
      { id: 'n', desc: false },
    ])
    // g asc → a,a,b; within a, n asc → id3 (n1), id2 (n2); then id1
    expect(table.getRowModel().rows.map((r) => r.id)).toEqual(['3', '2', '1'])
  })
})
