'use client'

import { useMemo } from 'react'
import { useTable, Table, createColumnHelper, type CellContext } from '@zvndev/yable-react'
import { planRows, type PlanRow, type PlanCell } from '../_data'
import { DemoFrame } from '../_chrome'

const col = createColumnHelper<PlanRow>()

function planCell(ctx: CellContext<PlanRow, PlanCell>) {
  const v = ctx.getValue()
  if (v === true) return <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
  if (v === false) return <span style={{ opacity: 0.35 }}>—</span>
  return <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{String(v)}</strong>
}

export default function PricingDemo() {
  const columns = useMemo(
    () => [
      col.accessor('feature', {
        header: 'Capability',
        size: 280,
        cell: (ctx) => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 550 }}>{ctx.getValue() as string}</span>
            <span style={{ fontSize: 11, color: 'var(--yable-text-muted, #999)' }}>
              {ctx.row.original.group}
            </span>
          </div>
        ),
      }),
      col.accessor('starter', {
        header: 'Starter',
        size: 120,
        cell: planCell,
        cellStyle: { textAlign: 'center' },
      }),
      col.accessor('pro', {
        header: () => <span style={{ color: '#635bff', fontWeight: 700 }}>Pro · popular</span>,
        size: 140,
        cell: planCell,
        cellStyle: { background: 'rgba(99,91,255,0.07)', textAlign: 'center' },
      }),
      col.accessor('enterprise', {
        header: 'Enterprise',
        size: 130,
        cell: planCell,
        cellStyle: { textAlign: 'center' },
      }),
    ],
    [],
  )

  const table = useTable<PlanRow>({
    data: planRows,
    columns,
    getRowId: (r) => r.feature,
    enableSorting: false,
  })

  return (
    <DemoFrame slug="pricing">
      <Table table={table} className="yable-theme-mono" bordered />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        A pricing matrix is just a table with opinionated cells — custom <code>cell</code> renderers
        for ✓/—, per-column <code>cellStyle</code> to spotlight the Pro tier, and sorting turned
        off.
      </p>
    </DemoFrame>
  )
}
