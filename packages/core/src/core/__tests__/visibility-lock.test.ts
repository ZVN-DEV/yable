// AG Grid-parity: column visibility locks — lockVisible (always-visible column)
// and suppressDragHidesColumns (don't hide a column dragged out mid-reorder).

import { describe, it, expect } from 'vitest'
import { createColumnHelper } from '../../columnHelper'
import { makeTable } from './harness'

interface R {
  id: number
  a: string
  b: string
}

const ch = createColumnHelper<R>()
const data: R[] = [{ id: 1, a: 'x', b: 'y' }]

describe('Column visibility locks', () => {
  it('lockVisible keeps a column from being hidden', () => {
    const { table } = makeTable(data, [
      ch.accessor('a', { lockVisible: true }),
      ch.accessor('b', {}),
    ])
    table.getColumn('a')!.toggleVisibility(false)
    expect(table.getColumn('a')!.getIsVisible()).toBe(true) // lock held

    table.getColumn('b')!.toggleVisibility(false)
    expect(table.getColumn('b')!.getIsVisible()).toBe(false) // normal column hides
  })

  it('suppressDragHidesColumns blocks hiding while a column drag is active', () => {
    const { table } = makeTable(data, [ch.accessor('a', {})]) // default suppress = true
    const a = table.getColumn('a')!

    table.setColumnDragActive(true)
    a.toggleVisibility(false)
    expect(a.getIsVisible()).toBe(true) // blocked during an active drag

    table.setColumnDragActive(false)
    a.toggleVisibility(false)
    expect(a.getIsVisible()).toBe(false) // allowed once the drag ends
  })
})
