'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTable, Table, createColumnHelper, type CellContext } from '@zvndev/yable-react'
import { tickers, type Ticker } from '../_data'
import { DemoFrame } from '../_chrome'

const col = createColumnHelper<Ticker>()

// Self-contained flashing price: green/red wash for 500ms whenever it changes.
function PriceCell({ value }: { value: number }) {
  const prev = useRef(value)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  useEffect(() => {
    if (value > prev.current) setFlash('up')
    else if (value < prev.current) setFlash('down')
    prev.current = value
    const t = setTimeout(() => setFlash(null), 500)
    return () => clearTimeout(t)
  }, [value])
  return (
    <span
      style={{
        display: 'block',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        borderRadius: 4,
        padding: '2px 6px',
        transition: 'background 0.45s ease',
        background:
          flash === 'up'
            ? 'rgba(34,197,94,0.32)'
            : flash === 'down'
              ? 'rgba(239,68,68,0.32)'
              : 'transparent',
      }}
    >
      {value.toFixed(2)}
    </span>
  )
}

function deltaCell(suffix: string) {
  return (ctx: CellContext<Ticker, number>) => {
    const v = ctx.getValue()
    const up = v >= 0
    return (
      <span
        style={{
          color: up ? '#22c55e' : '#ef4444',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
        }}
      >
        {up ? '▲' : '▼'} {Math.abs(v).toFixed(2)}
        {suffix}
      </span>
    )
  }
}

export default function TradingDemo() {
  const [rows, setRows] = useState<Ticker[]>(() => tickers.map((t) => ({ ...t })))

  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) =>
        prev.map((t) => {
          const drift = (Math.random() - 0.5) * t.price * 0.012
          const price = Math.max(1, Math.round((t.price + drift) * 100) / 100)
          return { ...t, price }
        }),
      )
    }, 1100)
    return () => clearInterval(id)
  }, [])

  const columns = useMemo(
    () => [
      col.accessor('symbol', {
        header: 'Symbol',
        size: 90,
        cell: (ctx) => <strong>{ctx.getValue() as string}</strong>,
      }),
      col.accessor('name', { header: 'Name', size: 170 }),
      col.accessor('sector', {
        header: 'Sector',
        size: 150,
        cellType: 'badge',
        cellTypeProps: { variant: 'default', appearance: 'outline' },
      }),
      col.accessor('price', {
        header: 'Last',
        size: 110,
        cell: (ctx) => <PriceCell value={ctx.getValue() as number} />,
      }),
      col.accessor((r) => r.price - r.prevClose, {
        id: 'change',
        header: 'Change',
        size: 120,
        cell: deltaCell(''),
      }),
      col.accessor((r) => ((r.price - r.prevClose) / r.prevClose) * 100, {
        id: 'changePct',
        header: 'Change %',
        size: 120,
        cell: deltaCell('%'),
      }),
    ],
    [],
  )

  const table = useTable<Ticker>({
    data: rows,
    columns,
    getRowId: (t) => t.symbol,
    enableCellSelection: true,
    initialState: { columnPinning: { left: ['symbol'], right: [] } },
  })

  return (
    <DemoFrame slug="trading">
      <Table table={table} className="yable-theme-midnight" />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        Prices tick every ~1.1s; each <code>&lt;PriceCell&gt;</code> flashes green/red on change.
        The <strong>Symbol</strong> column is pinned left (<code>columnPinning</code>) and stays put
        as you scroll — drag across the number cells to select a range.
      </p>
    </DemoFrame>
  )
}
