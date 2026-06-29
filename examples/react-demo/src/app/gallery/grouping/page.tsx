'use client'

import { useMemo } from 'react'
import { useTable, Table, createColumnHelper, type CellContext } from '@zvndev/yable-react'
import { sales, type Sale } from '../_data'
import { DemoFrame } from '../_chrome'
import s from '../gallery.module.css'

const col = createColumnHelper<Sale>()
const usd = (v: unknown) => (typeof v === 'number' ? `$${Math.round(v).toLocaleString()}` : '')
const pct = (v: unknown) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : '')
const num = (v: unknown) => (typeof v === 'number' ? v.toLocaleString() : '')

export default function GroupingDemo() {
  const columns = useMemo(
    () => [
      col.accessor('region', { header: 'Region', size: 220 }),
      col.accessor('category', { header: 'Category', size: 160 }),
      col.accessor('rep', { header: 'Rep', size: 120 }),
      col.accessor('units', {
        header: 'Units',
        size: 120,
        cell: (c: CellContext<Sale, number>) => num(c.getValue()),
        aggregationFn: 'sum',
        aggregatedCell: (c) => <strong>{num(c.getValue())}</strong>,
      }),
      col.accessor('revenue', {
        header: 'Revenue',
        size: 150,
        cell: (c: CellContext<Sale, number>) => usd(c.getValue()),
        aggregationFn: 'sum',
        aggregatedCell: (c) => <strong>{usd(c.getValue())}</strong>,
      }),
      col.accessor('margin', {
        header: 'Margin',
        size: 110,
        cell: (c: CellContext<Sale, number>) => pct(c.getValue()),
        aggregationFn: 'mean',
        aggregatedCell: (c) => <em>{pct(c.getValue())}</em>,
      }),
    ],
    [],
  )

  const table = useTable<Sale>({
    data: sales,
    columns,
    getRowId: (r) => r.id,
    initialState: {
      grouping: ['region', 'category'],
      pagination: { pageIndex: 0, pageSize: 100 },
    },
  })

  return (
    <DemoFrame slug="grouping">
      <div className={s.controls}>
        <button className={s.btn} onClick={() => table.setExpanded(true)}>
          Expand all
        </button>
        <button className={s.btn} onClick={() => table.setExpanded({})}>
          Collapse all
        </button>
        <span className={s.statPill}>
          grouping by <b>region → category</b> · {sales.length} source rows
        </span>
      </div>
      <Table table={table} className="yable-theme-ocean" />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        Set <code>initialState.grouping = [&apos;region&apos;, &apos;category&apos;]</code> and give
        a column an <code>aggregationFn</code> — group headers roll up <code>sum</code>{' '}
        revenue/units and <code>mean</code> margin automatically. New in 0.6.0.
      </p>
    </DemoFrame>
  )
}
