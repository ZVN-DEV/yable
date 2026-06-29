'use client'

import { useMemo } from 'react'
import {
  useTable,
  Table,
  createColumnHelper,
  getPivotRowModel,
  generatePivotColumnDefs,
  type CellContext,
} from '@zvndev/yable-react'
import { sales, type Sale } from '../_data'
import { DemoFrame } from '../_chrome'

type PivotData = Record<string, unknown>
// Derive the config type from the function so it matches exactly across dist chunks.
type PivotCfg = Parameters<typeof getPivotRowModel>[2]
const srcCol = createColumnHelper<Sale>()
const usd = (v: unknown) =>
  typeof v === 'number' && v !== 0 ? `$${Math.round(v).toLocaleString()}` : v === 0 ? '·' : ''

export default function PivotDemo() {
  // 1) A source table so getPivotRowModel can resolve field accessors.
  const sourceColumns = useMemo(
    () => [
      srcCol.accessor('region', { header: 'Region' }),
      srcCol.accessor('quarter', { header: 'Quarter' }),
      srcCol.accessor('revenue', { header: 'Revenue' }),
      srcCol.accessor('units', { header: 'Units' }),
    ],
    [],
  )
  const sourceTable = useTable<Sale>({ data: sales, columns: sourceColumns, getRowId: (r) => r.id })

  const config = useMemo<PivotCfg>(
    () => ({
      rowFields: [{ field: 'region' }],
      columnFields: [{ field: 'quarter' }],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    }),
    [],
  )

  // 2) Cross-tabulate → flattened rows + dynamic columns.
  const { rowModel, columns: pivotCols } = useMemo(
    () => getPivotRowModel<Sale>(sourceTable, sales, config),
    [sourceTable, config],
  )

  const pivotData = useMemo<PivotData[]>(
    () => rowModel.rows.map((r) => r.original as unknown as PivotData),
    [rowModel],
  )

  const pivotColumns = useMemo(() => {
    return generatePivotColumnDefs<PivotData>(config, pivotCols).map((cd) => {
      const isLabel = cd.id === '_pivotLabel'
      return {
        ...cd,
        size: isLabel ? 180 : 130,
        header: isLabel ? 'Region' : cd.header,
        cell: isLabel
          ? (ctx: CellContext<PivotData, unknown>) => (
              <strong>{String(ctx.getValue() ?? '')}</strong>
            )
          : (ctx: CellContext<PivotData, unknown>) => usd(ctx.getValue()),
        cellStyle: (ctx: CellContext<PivotData, unknown>) =>
          ctx.row.original._pivotIsGrandTotal
            ? { fontWeight: 700, background: 'rgba(110,199,255,0.10)' }
            : undefined,
      }
    })
  }, [pivotCols, config])

  const pivotTable = useTable<PivotData>({
    data: pivotData,
    columns: pivotColumns,
    getRowId: (_r, i) => `pivot-${i}`,
  })

  return (
    <DemoFrame slug="pivot">
      <Table table={pivotTable} className="yable-theme-midnight" bordered />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        <code>getPivotRowModel()</code> cross-tabs {sales.length} sales rows into revenue by{' '}
        <strong>region × quarter</strong>, with a grand-total row — then{' '}
        <code>generatePivotColumnDefs()</code> turns the dynamic columns into a normal{' '}
        <code>&lt;Table&gt;</code>.
      </p>
    </DemoFrame>
  )
}
