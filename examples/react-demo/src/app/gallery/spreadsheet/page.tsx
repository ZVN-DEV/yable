'use client'

import { useEffect, useMemo } from 'react'
import { useTable, Table, useClipboard, createColumnHelper } from '@zvndev/yable-react'
import { budgetRows, type BudgetRow } from '../_data'
import { DemoFrame } from '../_chrome'

type SheetRow = BudgetRow & { total: number }
const col = createColumnHelper<SheetRow>()
const usd = (v: unknown) => (typeof v === 'number' ? `$${Math.round(v).toLocaleString()}` : '')

export default function SpreadsheetDemo() {
  // `total` starts at 0 and is driven entirely by the formula engine.
  const data = useMemo<SheetRow[]>(() => budgetRows.map((r) => ({ ...r, total: 0 })), [])

  const columns = useMemo(
    () => [
      col.accessor('category', { header: 'Category', size: 160 }), // A
      col.accessor('q1', {
        header: 'Q1',
        size: 110,
        editable: true,
        editConfig: { type: 'number' },
        cell: (c) => usd(c.getValue()),
      }), // B
      col.accessor('q2', {
        header: 'Q2',
        size: 110,
        editable: true,
        editConfig: { type: 'number' },
        cell: (c) => usd(c.getValue()),
      }), // C
      col.accessor('q3', {
        header: 'Q3',
        size: 110,
        editable: true,
        editConfig: { type: 'number' },
        cell: (c) => usd(c.getValue()),
      }), // D
      col.accessor('q4', {
        header: 'Q4',
        size: 110,
        editable: true,
        editConfig: { type: 'number' },
        cell: (c) => usd(c.getValue()),
      }), // E
      col.accessor('total', {
        header: 'Year total',
        size: 140,
        cell: (c) => <strong>{usd(c.getValue())}</strong>,
        cellStyle: { background: 'rgba(118,216,183,0.10)' },
      }), // F
    ],
    [],
  )

  const table = useTable<SheetRow>({
    data,
    columns,
    getRowId: (r) => r.id,
    enableFillHandle: true,
  })

  // Copy / paste blocks of cells.
  useClipboard(table)

  // Wire a real =SUM formula into each row's total, then keep it live on edit.
  useEffect(() => {
    data.forEach((r, i) => table.setFormula(r.id, 'total', `=SUM(B${i + 1}:E${i + 1})`))
    table.evaluateFormulas()
    const recompute = () => table.evaluateFormulas()
    const unsub = table.events.on('cell:edit:commit', recompute)
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [table, data])

  return (
    <DemoFrame slug="spreadsheet">
      <Table table={table} className="yable-theme-compact" bordered />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        The <strong>Year total</strong> column is a live{' '}
        <code>
          =SUM(B{`{n}`}:E{`{n}`})
        </code>{' '}
        formula — edit any quarter and it recomputes through the parser → AST → evaluator. Drag the
        fill handle to copy a value down, or select a block and ⌘/Ctrl-C to copy. Arrow keys
        navigate.
      </p>
    </DemoFrame>
  )
}
