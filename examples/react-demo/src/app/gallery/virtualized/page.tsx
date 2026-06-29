'use client'

import { useMemo } from 'react'
import { useTable, Table, GlobalFilter, createColumnHelper } from '@zvndev/yable-react'
import { makeEmployees, type Employee } from '../_data'
import { DemoFrame } from '../_chrome'
import s from '../gallery.module.css'

const col = createColumnHelper<Employee>()
const TOTAL = 50_000

export default function VirtualizedDemo() {
  const data = useMemo(() => makeEmployees(TOTAL), [])
  const columns = useMemo(
    () => [
      col.accessor('id', { header: '#', size: 80, cellType: 'numeric' }),
      col.accessor('name', { header: 'Name', size: 170 }),
      col.accessor('email', { header: 'Email', size: 240 }),
      col.accessor('department', {
        header: 'Department',
        size: 140,
        cellType: 'badge',
        cellTypeProps: { variant: 'info', appearance: 'soft' },
      }),
      col.accessor('level', { header: 'Level', size: 110 }),
      col.accessor('location', { header: 'Location', size: 150 }),
      col.accessor('salary', {
        header: 'Salary',
        size: 130,
        cellType: 'currency',
        cellTypeProps: { decimals: 0 },
      }),
      col.accessor('performance', {
        header: 'Performance',
        size: 150,
        cellType: 'progress',
        cellTypeProps: { max: 100, showLabel: true },
      }),
      col.accessor('active', {
        header: 'Status',
        size: 110,
        cellType: 'boolean',
        cellTypeProps: { mode: 'dot', trueLabel: 'Active', falseLabel: 'Inactive' },
      }),
    ],
    [],
  )

  const table = useTable<Employee>({
    data,
    columns,
    getRowId: (e) => String(e.id),
    enableVirtualization: true,
    rowHeight: 40,
    overscan: 12,
  })

  const shown = table.getRowModel().rows.length

  return (
    <DemoFrame slug="virtualized">
      <div className={s.controls}>
        <div style={{ maxWidth: 300, flex: 1 }}>
          <GlobalFilter table={table} placeholder="Filter 50,000 rows…" />
        </div>
        <span className={s.statPill}>
          <b>{shown.toLocaleString()}</b> / {TOTAL.toLocaleString()} rows
        </span>
      </div>
      <Table table={table} className="yable-theme-mono" />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        <code>enableVirtualization</code> renders only the ~20 rows in view (plus overscan). Sorting
        and the global filter run across all {TOTAL.toLocaleString()} rows — scroll and type freely.
      </p>
    </DemoFrame>
  )
}
