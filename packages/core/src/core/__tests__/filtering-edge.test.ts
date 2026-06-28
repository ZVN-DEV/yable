// AG Grid-parity: filtering edge cases (case-insensitive contains, inclusive
// number range, blank/empty handling, filter+sort interaction).

import { describe, it, expect } from 'vitest'
import { createColumnHelper } from '../../columnHelper'
import { makeTable } from './harness'

describe('Filtering edge cases', () => {
  it('text "contains" filter is case-insensitive', () => {
    interface R {
      id: number
      name: string
    }
    const ch = createColumnHelper<R>()
    const data: R[] = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Alistair' },
    ]
    const { table } = makeTable(data, [ch.accessor('name', { filterFn: 'includesString' })])
    table.setColumnFilters([{ id: 'name', value: 'ALI' }])
    expect(
      table
        .getRowModel()
        .rows.map((r) => r.id)
        .sort(),
    ).toEqual(['1', '3'])
  })

  it('inNumberRange uses inclusive boundaries (rows at min and max included)', () => {
    interface R {
      id: number
      n: number
    }
    const ch = createColumnHelper<R>()
    const data: R[] = [
      { id: 1, n: 5 },
      { id: 2, n: 10 },
      { id: 3, n: 20 },
      { id: 4, n: 25 },
    ]
    const { table } = makeTable(data, [ch.accessor('n', { filterFn: 'inNumberRange' })])
    table.setColumnFilters([{ id: 'n', value: [10, 20] }])
    expect(
      table
        .getRowModel()
        .rows.map((r) => r.id)
        .sort(),
    ).toEqual(['2', '3'])
  })

  it('a contains filter excludes empty / null cell values', () => {
    interface R {
      id: number
      name: string | null
    }
    const ch = createColumnHelper<R>()
    const data: R[] = [
      { id: 1, name: 'Anna' },
      { id: 2, name: '' },
      { id: 3, name: null },
    ]
    const { table } = makeTable(data, [ch.accessor('name', { filterFn: 'includesString' })])
    table.setColumnFilters([{ id: 'name', value: 'a' }])
    expect(table.getRowModel().rows.map((r) => r.id)).toEqual(['1'])
  })

  it('filter then sort yields the correctly ordered subset', () => {
    interface R {
      id: number
      name: string
      dept: string
    }
    const ch = createColumnHelper<R>()
    const data: R[] = [
      { id: 1, name: 'Alice', dept: 'Eng' },
      { id: 2, name: 'Bob', dept: 'Design' },
      { id: 3, name: 'Carol', dept: 'Eng' },
    ]
    const { table } = makeTable(data, [
      ch.accessor('name', {}),
      ch.accessor('dept', { filterFn: 'includesString' }),
    ])
    table.setColumnFilters([{ id: 'dept', value: 'Eng' }])
    table.setSorting([{ id: 'name', desc: true }])
    expect(table.getRowModel().rows.map((r) => r.id)).toEqual(['3', '1']) // Carol, Alice
  })
})
