'use client'

/**
 * Yable + Tailwind v4
 *
 * Proves you can build a fully Tailwind-styled Yable table:
 *
 *   1. Outer chrome (header, controls, stats) — pure Tailwind utilities
 *   2. Cell content — Tailwind classes inside the column.cell render fn
 *   3. Token-aware utilities (`bg-yable-bg`, `border-yable-border`,
 *      `text-yable-text-secondary`) automatically follow the active theme
 *      because they resolve to the live CSS variables from
 *      `@zvndev/yable-themes/tailwind.css`.
 */

import { useMemo, useState } from 'react'
import {
  useTable,
  Table,
  GlobalFilter,
  Pagination,
  createColumnHelper,
} from '@zvndev/yable-react'

interface Asset {
  id: number
  ticker: string
  name: string
  price: number
  change24h: number
  marketCap: number
  category: 'crypto' | 'stock' | 'commodity' | 'forex'
  trend: 'up' | 'down' | 'flat'
}

const ROWS: Asset[] = [
  { id: 1, ticker: 'BTC', name: 'Bitcoin', price: 89_412.55, change24h: 2.4, marketCap: 1_762_000_000_000, category: 'crypto', trend: 'up' },
  { id: 2, ticker: 'ETH', name: 'Ethereum', price: 4_812.10, change24h: -1.1, marketCap: 578_000_000_000, category: 'crypto', trend: 'down' },
  { id: 3, ticker: 'NVDA', name: 'NVIDIA Corp', price: 1_182.34, change24h: 0.8, marketCap: 2_910_000_000_000, category: 'stock', trend: 'up' },
  { id: 4, ticker: 'AAPL', name: 'Apple Inc', price: 232.75, change24h: -0.3, marketCap: 3_540_000_000_000, category: 'stock', trend: 'down' },
  { id: 5, ticker: 'XAU', name: 'Gold Spot', price: 2_788.20, change24h: 0.05, marketCap: 0, category: 'commodity', trend: 'flat' },
  { id: 6, ticker: 'EUR', name: 'Euro / USD', price: 1.087, change24h: -0.12, marketCap: 0, category: 'forex', trend: 'down' },
  { id: 7, ticker: 'SOL', name: 'Solana', price: 218.40, change24h: 5.2, marketCap: 105_000_000_000, category: 'crypto', trend: 'up' },
  { id: 8, ticker: 'TSLA', name: 'Tesla Inc', price: 401.22, change24h: 1.7, marketCap: 1_280_000_000_000, category: 'stock', trend: 'up' },
  { id: 9, ticker: 'WTI', name: 'Crude Oil WTI', price: 73.55, change24h: -2.3, marketCap: 0, category: 'commodity', trend: 'down' },
  { id: 10, ticker: 'JPY', name: 'Japanese Yen', price: 0.0067, change24h: 0.01, marketCap: 0, category: 'forex', trend: 'flat' },
  { id: 11, ticker: 'AVAX', name: 'Avalanche', price: 42.18, change24h: 3.4, marketCap: 17_000_000_000, category: 'crypto', trend: 'up' },
  { id: 12, ticker: 'MSFT', name: 'Microsoft', price: 442.61, change24h: 0.4, marketCap: 3_290_000_000_000, category: 'stock', trend: 'up' },
]

const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const cap = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })

const CATEGORY_BADGES: Record<Asset['category'], string> = {
  crypto: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  stock: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  commodity: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  forex: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
}

const TREND_GLYPH: Record<Asset['trend'], { glyph: string; cls: string }> = {
  up: { glyph: '▲', cls: 'text-emerald-400' },
  down: { glyph: '▼', cls: 'text-rose-400' },
  flat: { glyph: '◆', cls: 'text-zinc-500' },
}

const columnHelper = createColumnHelper<Asset>()

const columns = [
  columnHelper.accessor('ticker', {
    header: 'Ticker',
    size: 90,
    cell: (info) => (
      <div className="flex items-center gap-2 font-semibold tracking-wide">
        <span className={TREND_GLYPH[info.row.original.trend].cls}>
          {TREND_GLYPH[info.row.original.trend].glyph}
        </span>
        <span className="text-yable-text">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    size: 180,
    cell: (info) => (
      <span className="text-yable-text-secondary">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    size: 120,
    cell: (info) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ring-1 ring-inset ${
          CATEGORY_BADGES[info.getValue()]
        }`}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('price', {
    header: 'Price',
    size: 130,
    cell: (info) => (
      <span className="block text-right font-mono tabular-nums text-yable-text">
        ${fmt.format(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor('change24h', {
    header: '24h',
    size: 100,
    cell: (info) => {
      const v = info.getValue()
      const isPos = v > 0
      const isNeg = v < 0
      return (
        <span
          className={`block text-right font-mono tabular-nums ${
            isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-zinc-400'
          }`}
        >
          {isPos ? '+' : ''}
          {v.toFixed(2)}%
        </span>
      )
    },
  }),
  columnHelper.accessor('marketCap', {
    header: 'Market Cap',
    size: 130,
    cell: (info) => {
      const v = info.getValue()
      return (
        <span className="block text-right font-mono tabular-nums text-yable-text-secondary">
          {v > 0 ? `$${cap.format(v)}` : '—'}
        </span>
      )
    },
  }),
]

export default function TailwindDemoPage() {
  const [theme, setTheme] = useState<'midnight' | 'default' | 'ocean' | 'forest'>('midnight')

  const data = useMemo(() => ROWS, [])
  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
  })

  const total = data.reduce((sum, r) => sum + r.price, 0)
  const movers = data.filter((r) => Math.abs(r.change24h) > 1).length

  return (
    <div className="min-h-screen bg-zinc-950 px-8 py-12 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        {/* ── Header ────────────────────────────────────────────── */}
        <header className="mb-10 flex items-end justify-between border-b border-white/10 pb-6">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Yable × Tailwind v4
            </p>
            <h1 className="bg-gradient-to-br from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
              Markets Overview
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Pure Tailwind utility classes — no module CSS, no styled-components.
            </p>
          </div>
          <a
            href="/playground"
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 transition hover:border-white/30 hover:text-zinc-100"
          >
            Playground
          </a>
        </header>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Assets" value={String(data.length)} />
          <Stat label="Movers (>1%)" value={String(movers)} accent />
          <Stat label="Categories" value="4" />
          <Stat label="Sum (price)" value={`$${cap.format(total)}`} />
        </div>

        {/* ── Theme switcher + search ──────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {(['midnight', 'default', 'ocean', 'forest'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`rounded-md px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
                  theme === t
                    ? 'bg-yable-accent text-yable-accent-text'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="min-w-[260px]">
            <GlobalFilter table={table} placeholder="Search assets..." />
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-yable-border bg-yable-bg shadow-lg shadow-black/40">
          <Table
            table={table}
            theme={theme}
            striped
            bordered
            stickyHeader
          >
            <Pagination table={table} />
          </Table>
        </div>

        {/* ── Footnote ──────────────────────────────────────────── */}
        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-wider text-zinc-600">
          Every yable-* utility resolves to a CSS variable. Switch the theme — Tailwind classes follow.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div
        className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
          accent ? 'text-cyan-300' : 'text-zinc-100'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
