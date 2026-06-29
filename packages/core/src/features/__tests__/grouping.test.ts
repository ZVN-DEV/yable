// @zvndev/yable-core — Row Grouping integration tests (through createTable()).
// Proves grouped row models build synthetic group rows with aggregates and
// expand/collapse, multi-level nesting, and a no-op when grouping is empty.

import { describe, it, expect } from 'vitest'
import type { ColumnDef } from '../../types'
import { makeTable } from '../../core/__tests__/harness'

interface Sale {
  id: string
  region: string
  rep: string
  amount: number
}

const data: Sale[] = [
  { id: '1', region: 'West', rep: 'A', amount: 100 },
  { id: '2', region: 'West', rep: 'B', amount: 200 },
  { id: '3', region: 'East', rep: 'C', amount: 50 },
  { id: '4', region: 'East', rep: 'D', amount: 70 },
]

const columns: ColumnDef<Sale>[] = [
  { accessorKey: 'region', header: 'Region' },
  { accessorKey: 'rep', header: 'Rep' },
  { accessorKey: 'amount', header: 'Amount', aggregationFn: 'sum' },
]

describe('row grouping', () => {
  it('groups leaf rows by a single column and aggregates (collapsed by default)', () => {
    const { table } = makeTable<Sale>(data, columns, { initialState: { grouping: ['region'] } })
    const model = table.getGroupedRowModel()

    expect(model.rows.length).toBe(2) // collapsed → only the two group headers
    expect(model.rows.every((r) => r.getIsGrouped())).toBe(true)

    const west = model.rows.find((r) => r.groupingValue === 'West')!
    expect(west.getLeafRows().length).toBe(2)
    expect(west.getValue('amount')).toBe(300) // 100 + 200
    expect(west.getValue('region')).toBe('West')

    const east = model.rows.find((r) => r.groupingValue === 'East')!
    expect(east.getValue('amount')).toBe(120) // 50 + 70
  })

  it('expands a group to reveal its leaf rows', () => {
    const { table } = makeTable<Sale>(data, columns, { initialState: { grouping: ['region'] } })
    const west = table.getGroupedRowModel().rows.find((r) => r.groupingValue === 'West')!

    table.setExpanded({ [west.id]: true })
    const model = table.getGroupedRowModel()

    expect(model.rows.length).toBe(4) // 2 headers + 2 expanded West leaves
    const visibleLeaves = model.rows.filter((r) => !r.getIsGrouped())
    expect(visibleLeaves.length).toBe(2)
    expect(visibleLeaves.map((r) => r.getValue('amount')).sort()).toEqual([100, 200])
  })

  it('supports multi-level grouping', () => {
    const { table } = makeTable<Sale>(data, columns, {
      initialState: { grouping: ['region', 'rep'], expanded: true },
    })
    const model = table.getGroupedRowModel()

    const topGroups = model.rows.filter((r) => r.getIsGrouped() && r.depth === 0)
    expect(topGroups.map((r) => r.groupingValue).sort()).toEqual(['East', 'West'])

    const repGroups = model.rows.filter((r) => r.getIsGrouped() && r.depth === 1)
    expect(repGroups.length).toBe(4) // A,B under West; C,D under East
    // Each rep group aggregates its single leaf.
    const repA = repGroups.find((r) => r.groupingValue === 'A')!
    expect(repA.getValue('amount')).toBe(100)
  })

  it('returns the rows unchanged when grouping is empty', () => {
    const { table } = makeTable<Sale>(data, columns)
    const model = table.getGroupedRowModel()
    expect(model.rows.length).toBe(4)
    expect(model.rows.every((r) => !r.getIsGrouped())).toBe(true)
  })

  it('select-all reaches leaf rows and never selects synthetic group rows', () => {
    const { table } = makeTable<Sale>(data, columns, { initialState: { grouping: ['region'] } })
    // Collapsed groups: the only visible rows are headers, but select-all must
    // still reach every (collapsed) leaf and skip the unselectable group rows.
    table.toggleAllRowsSelected(true)
    const sel = table.getState().rowSelection
    expect(Object.keys(sel).sort()).toEqual(['1', '2', '3', '4'])
    expect(Object.keys(sel).some((k) => k.includes('region:'))).toBe(false)
  })

  it('keeps distinct group values that share a string form in separate groups', () => {
    interface KRow {
      id: string
      k: unknown
      n: number
    }
    const rows: KRow[] = [
      { id: '1', k: 'null', n: 1 },
      { id: '2', k: null, n: 2 },
      { id: '3', k: 1, n: 3 },
      { id: '4', k: '1', n: 4 },
    ]
    const cols: ColumnDef<KRow>[] = [
      { accessorKey: 'k', header: 'K' },
      { accessorKey: 'n', header: 'N', aggregationFn: 'count' },
    ]
    const { table } = makeTable<KRow>(rows, cols, { initialState: { grouping: ['k'] } })
    // `null` vs `'null'` and `1` vs `'1'` must NOT collapse → four distinct groups.
    expect(table.getGroupedRowModel().rows.length).toBe(4)
  })

  it('drives the rendered row model (getRowModel) through grouping', () => {
    const { table } = makeTable<Sale>(data, columns, {
      initialState: { grouping: ['region'], pagination: { pageIndex: 0, pageSize: 50 } },
    })
    // getRowModel = paginated(pre-pagination = grouped) → group headers only while collapsed.
    expect(table.getRowModel().rows.every((r) => r.getIsGrouped())).toBe(true)
    expect(table.getRowModel().rows.length).toBe(2)
  })
})
