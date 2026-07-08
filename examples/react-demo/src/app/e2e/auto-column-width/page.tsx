'use client'

// E2E fixture: smart column width (Feature A).
//
// Both grids render wide content inside a container narrower than the columns'
// natural total. The spec in e2e/interactions.spec.ts asserts:
//   - fit mode:    NO horizontal scroll (scrollWidth ≈ clientWidth) and the
//                  long-content column WRAPPED (cell height > single line).
//   - scroll mode: horizontal scroll present (scrollWidth > clientWidth).
//   - the opt-out column (explicit size + enableAutoSize:false) keeps its width.

import { useState } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'

interface WideRow {
  id: number
  name: string
  description: string
  category: string
  status: string
}

const DESCRIPTIONS = [
  'A comprehensive summary of the initiative including background, scope, and the expected downstream impact on adjacent teams.',
  'Follow-up notes captured during the quarterly review covering blockers, dependencies, and the proposed remediation timeline.',
  'Detailed acceptance criteria enumerating every edge case the implementation must handle before it can ship to production.',
]

const ROWS: WideRow[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Project Falcon Initiative ${i + 1}`,
  description: DESCRIPTIONS[i % DESCRIPTIONS.length]!,
  category: ['Infrastructure', 'Product Experience', 'Data Platform'][i % 3]!,
  status: i % 2 === 0 ? 'Active' : 'Paused',
}))

const col = createColumnHelper<WideRow>()
const columns = [
  col.accessor('name', { header: 'Name' }),
  col.accessor('description', { header: 'Description' }),
  col.accessor('category', { header: 'Category' }),
  // Opt-out: explicit size + enableAutoSize:false — must keep 120px, never squish.
  col.accessor('status', { header: 'Status', size: 120, enableAutoSize: false }),
]

function AutoGrid({ overflow }: { overflow: 'fit' | 'scroll' }) {
  const table = useTable<WideRow>({
    data: ROWS,
    columns,
    getRowId: (row) => String(row.id),
  })
  return <Table table={table} autoColumnWidth={{ overflow }} bordered />
}

// Small-overflow compression under ROW VIRTUALIZATION: natural widths overflow
// the container by a modest amount, and `fitThreshold` compresses them to fit
// instead of scrolling — even though `overflow:'fit'` alone falls back to scroll
// under virtualization. Proves the pure-width compression path works virtualized.
interface SmallRow {
  a: string
  b: string
  c: string
  d: string
}
const SMALL_ROWS: SmallRow[] = Array.from({ length: 20 }, () => ({
  a: 'Marlborough',
  b: 'Casablanca',
  c: 'Willamette',
  d: 'Stellenbosch',
}))
const smallCol = createColumnHelper<SmallRow>()
const smallColumns = [
  smallCol.accessor('a', { header: 'Region A' }),
  smallCol.accessor('b', { header: 'Region B' }),
  smallCol.accessor('c', { header: 'Region C' }),
  smallCol.accessor('d', { header: 'Region D' }),
]

function FitSmallVirtualGrid() {
  const table = useTable<SmallRow>({
    data: SMALL_ROWS,
    columns: smallColumns,
    getRowId: (_row, i) => String(i),
    enableVirtualization: true,
    virtualViewportHeight: 240,
    rowHeight: 36,
  })
  return <Table table={table} autoColumnWidth={{ overflow: 'fit', fitThreshold: 0.5 }} bordered />
}

// --- Rendered-content measurement (autoSizeText) ---------------------------
// Both columns hold the same small numeric accessor value and render the SAME
// wide formatted string. The `formatted` column sets `autoSizeText` so it is
// measured by what the cell RENDERS; the `raw` column is measured by its raw
// accessor value (`1234`) and therefore undershoots. `overflow: 'scroll'` keeps
// both at natural width so the spec can compare them directly.

interface PriceRow {
  id: number
  amount: number
}

const PRICE_ROWS: PriceRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  amount: 1234,
}))

const formatPrice = (n: number): string => `$${n.toFixed(2)} (Infrastructure Platform)`

const priceCol = createColumnHelper<PriceRow>()
const priceColumns = [
  priceCol.accessor('amount', {
    id: 'raw',
    header: 'Raw',
    cell: ({ getValue }) => formatPrice(getValue()),
  }),
  priceCol.accessor('amount', {
    id: 'formatted',
    header: 'Formatted',
    cell: ({ getValue }) => formatPrice(getValue()),
    autoSizeText: (row) => formatPrice(row.original.amount),
  }),
]

function FormattedGrid() {
  const table = useTable<PriceRow>({
    data: PRICE_ROWS,
    columns: priceColumns,
    getRowId: (row) => String(row.id),
  })
  return <Table table={table} autoColumnWidth={{ overflow: 'scroll' }} bordered />
}

// --- Async re-measure (values merged in after mount) -----------------------
// Same rows render first with a placeholder amount ('-'); clicking "Load values"
// swaps in a NEW data array carrying the wide real values. Smart width watches
// the `data` reference identity, so the debounced auto re-measure widens the
// Amount column from its placeholder width. The container is wide enough that
// nothing squishes — the width change comes purely from the re-measure.

interface AsyncRow {
  id: number
  label: string
  amount: string
}

const ASYNC_LABELS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot']
const PLACEHOLDER_ROWS: AsyncRow[] = ASYNC_LABELS.map((label, i) => ({
  id: i + 1,
  label,
  amount: '-',
}))
const LOADED_ROWS: AsyncRow[] = ASYNC_LABELS.map((label, i) => ({
  id: i + 1,
  label,
  amount: `$${(i + 1).toString()},234,567,890.00`,
}))

const asyncCol = createColumnHelper<AsyncRow>()
const asyncColumns = [
  asyncCol.accessor('label', { header: 'Label' }),
  asyncCol.accessor('amount', { header: 'Amount' }),
]

function AsyncMergeGrid() {
  const [data, setData] = useState<AsyncRow[]>(PLACEHOLDER_ROWS)
  const table = useTable<AsyncRow>({
    data,
    columns: asyncColumns,
    getRowId: (row) => String(row.id),
  })
  return (
    <>
      <button type="button" data-testid="async-load" onClick={() => setData(LOADED_ROWS)}>
        Load values
      </button>
      <Table table={table} autoColumnWidth bordered />
    </>
  )
}

export default function AutoColumnWidthFixturePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Smart column width fixture</h1>
      <section data-testid="auto-async" style={{ width: 900, marginBottom: 48 }}>
        <h2>async re-measure</h2>
        <AsyncMergeGrid />
      </section>
      <section data-testid="auto-fit" style={{ width: 520, marginBottom: 48 }}>
        <h2>overflow: fit</h2>
        <AutoGrid overflow="fit" />
      </section>
      <section data-testid="auto-fit-small-virtual" style={{ width: 360, marginBottom: 48 }}>
        <h2>fitThreshold under virtualization</h2>
        <FitSmallVirtualGrid />
      </section>
      <section data-testid="auto-scroll" style={{ width: 520, marginBottom: 48 }}>
        <h2>overflow: scroll</h2>
        <AutoGrid overflow="scroll" />
      </section>
      <section data-testid="auto-formatted" style={{ width: 640 }}>
        <h2>autoSizeText (rendered-content measurement)</h2>
        <FormattedGrid />
      </section>
    </main>
  )
}
