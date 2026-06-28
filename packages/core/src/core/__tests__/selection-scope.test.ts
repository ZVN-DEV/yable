// AG Grid-parity: row-selection scope behaviors (select-all respects filter,
// page-scope select, persistence across sort).

import { describe, it, expect } from 'vitest'
import { createColumnHelper } from '../../columnHelper'
import { makeTable } from './harness'

interface Person {
  id: number
  name: string
  dept: string
}

const ch = createColumnHelper<Person>()
const cols = [ch.accessor('name', {}), ch.accessor('dept', {})]
const data: Person[] = [
  { id: 1, name: 'Alice', dept: 'Eng' },
  { id: 2, name: 'Bob', dept: 'Design' },
  { id: 3, name: 'Carol', dept: 'Eng' },
  { id: 4, name: 'Dave', dept: 'Design' },
]

describe('Row selection scope', () => {
  it('select-all selects every row when no filter is active', () => {
    const { table } = makeTable(data, cols)
    table.toggleAllRowsSelected(true)
    expect(table.getSelectedRowModel().rows.length).toBe(4)
    expect(table.getIsAllRowsSelected()).toBe(true)
  })

  it('select-all respects an active column filter (only filtered rows get selected)', () => {
    const { table, getState } = makeTable(data, cols, {
      initialState: { columnFilters: [{ id: 'dept', value: 'Eng' }] },
    })
    expect(table.getRowModel().rows.length).toBe(2) // Alice + Carol
    table.toggleAllRowsSelected(true)
    const sel = getState().rowSelection
    expect(Object.keys(sel).sort()).toEqual(['1', '3'])
    expect(sel['2']).toBeUndefined()
    expect(sel['4']).toBeUndefined()
  })

  it('clearing the filter does not retroactively select previously hidden rows', () => {
    const { table, getState } = makeTable(data, cols, {
      initialState: { columnFilters: [{ id: 'dept', value: 'Eng' }] },
    })
    table.toggleAllRowsSelected(true) // selects only Eng
    table.setColumnFilters([]) // reveal all rows again
    const sel = getState().rowSelection
    expect(Object.keys(sel).sort()).toEqual(['1', '3'])
    expect(table.getIsAllRowsSelected()).toBe(false) // 4 rows now, only 2 selected
  })

  it('selection persists across a sort (keyed by row id)', () => {
    const { table, getState } = makeTable(data, cols)
    const alice = table.getRowModel().rows.find((r) => r.id === '1')!
    alice.toggleSelected(true)
    table.setSorting([{ id: 'name', desc: true }]) // reverse visual order
    expect(getState().rowSelection['1']).toBe(true)
    expect(table.getSelectedRowModel().rows.map((r) => r.id)).toEqual(['1'])
  })

  it('toggleAllPageRowsSelected only selects the current page', () => {
    const { table, getState } = makeTable(data, cols, {
      initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
    })
    expect(table.getRowModel().rows.length).toBe(2) // page 1 → ids 1,2
    table.toggleAllPageRowsSelected(true)
    expect(Object.keys(getState().rowSelection).sort()).toEqual(['1', '2'])
  })
})
