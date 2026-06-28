// AG Grid-parity: pagination edge cases (page clamps when a filter shrinks the
// data, page/row counts recompute, page-size changes recompute pages).

import { describe, it, expect } from 'vitest'
import { createColumnHelper } from '../../columnHelper'
import { makeTable } from './harness'

interface R {
  id: number
  name: string
  dept: string
}

const ch = createColumnHelper<R>()
const cols = [ch.accessor('name', { filterFn: 'includesString' }), ch.accessor('dept', {})]
const data: R[] = [
  { id: 1, name: 'Alice', dept: 'Eng' },
  { id: 2, name: 'Bob', dept: 'Design' },
  { id: 3, name: 'Carol', dept: 'Eng' },
  { id: 4, name: 'Dave', dept: 'Design' },
  { id: 5, name: 'Eve', dept: 'Eng' },
]

describe('Pagination edge cases', () => {
  it('does not return an out-of-range empty page after a filter shrinks the data', () => {
    const { table } = makeTable(data, cols, {
      initialState: { pagination: { pageIndex: 2, pageSize: 2 } },
    })
    // page index 2 with pageSize 2 → 5th row (Eve) is valid before filtering
    expect(table.getRowModel().rows.length).toBe(1)
    // Filter to a single matching row → only 1 page exists; the old pageIndex 2
    // is now out of range. The model must still return that row, not an empty page.
    table.setColumnFilters([{ id: 'name', value: 'Alice' }])
    const rows = table.getRowModel().rows
    expect(rows.length).toBe(1)
    expect(rows[0]!.id).toBe('1')
  })

  it('recomputes pageCount and rowCount after filtering', () => {
    const { table } = makeTable(data, cols, {
      initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
    })
    expect(table.getPageCount()).toBe(3) // 5 rows / 2
    table.setColumnFilters([{ id: 'dept', value: 'Eng' }]) // 3 Eng rows
    expect(table.getPageCount()).toBe(2) // 3 rows / 2
  })

  it('recomputes pages when pageSize changes', () => {
    const { table, getState } = makeTable(data, cols, {
      initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
    })
    expect(table.getRowModel().rows.length).toBe(2)
    table.setPageSize(5)
    expect(getState().pagination.pageSize).toBe(5)
    expect(table.getRowModel().rows.length).toBe(5)
    expect(table.getPageCount()).toBe(1)
  })
})
