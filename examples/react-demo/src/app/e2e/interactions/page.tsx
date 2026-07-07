'use client'

// E2E fixture: real-pointer interaction matrix.
//
// Regression context (2026-07): `.yable-virtual-spacer { pointer-events: none }`
// shipped to production and made every interactive element inside virtualized
// table bodies unclickable — and the suite missed it because tests dispatched
// synthetic events or asserted attributes instead of real hit-testing. This
// fixture renders the interactive content real consumers embed in cells
// (checkboxes, buttons, links, text inputs) in BOTH a virtualized and a
// non-virtualized grid, with live-resize and sorting enabled, so
// e2e/interactions.spec.ts can drive everything with genuine pointer input.

import { useState } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'

interface Item {
  id: number
  name: string
  qty: number
}

const ROWS: Item[] = Array.from({ length: 500 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  qty: (i * 3) % 50,
}))

const col = createColumnHelper<Item>()

function useInteractionState() {
  const [clicks, setClicks] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [edits, setEdits] = useState<Record<number, string>>({})
  return { clicks, setClicks, checked, setChecked, edits, setEdits }
}

function buildColumns(s: ReturnType<typeof useInteractionState>) {
  return [
    col.display({
      id: 'check',
      header: 'Check',
      size: 70,
      cell: ({ row }) => (
        <input
          type="checkbox"
          data-testid={`cb-${row.original.id}`}
          checked={!!s.checked[row.original.id]}
          onChange={(e) =>
            s.setChecked((prev) => ({ ...prev, [row.original.id]: e.target.checked }))
          }
        />
      ),
    }),
    col.accessor('name', { header: 'Name', size: 160 }),
    col.display({
      id: 'action',
      header: 'Action',
      size: 120,
      cell: ({ row }) => (
        <button
          type="button"
          data-testid={`btn-${row.original.id}`}
          onClick={() =>
            s.setClicks((prev) => ({
              ...prev,
              [row.original.id]: (prev[row.original.id] ?? 0) + 1,
            }))
          }
        >
          Clicked {s.clicks[row.original.id] ?? 0}
        </button>
      ),
    }),
    col.display({
      id: 'edit',
      header: 'Edit',
      size: 140,
      cell: ({ row }) => (
        <input
          type="text"
          data-testid={`input-${row.original.id}`}
          value={s.edits[row.original.id] ?? ''}
          placeholder="type here"
          onChange={(e) => s.setEdits((prev) => ({ ...prev, [row.original.id]: e.target.value }))}
          style={{ width: '100%' }}
        />
      ),
    }),
    col.display({
      id: 'link',
      header: 'Link',
      size: 110,
      cell: ({ row }) => (
        <a href={`#row-${row.original.id}`} data-testid={`link-${row.original.id}`}>
          open
        </a>
      ),
    }),
    col.accessor('qty', { header: 'Qty', size: 90 }),
  ]
}

function VirtualizedInteractive() {
  const s = useInteractionState()
  const table = useTable<Item>({
    data: ROWS,
    columns: buildColumns(s),
    getRowId: (row) => String(row.id),
    enableVirtualization: true,
    virtualViewportHeight: 320,
    rowHeight: 40,
    overscan: 3,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    initialState: { pagination: { pageIndex: 0, pageSize: 100_000 } },
  })
  return <Table table={table} bordered striped />
}

function PlainInteractive() {
  const s = useInteractionState()
  const table = useTable<Item>({
    data: ROWS.slice(0, 12),
    columns: buildColumns(s),
    getRowId: (row) => String(row.id),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    initialState: { pagination: { pageIndex: 0, pageSize: 100_000 } },
  })
  return <Table table={table} bordered />
}

export default function InteractionsFixturePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Interactions fixture</h1>
      <section data-testid="grid-virtual" style={{ width: 1000, marginBottom: 48 }}>
        <h2>Virtualized</h2>
        <VirtualizedInteractive />
      </section>
      <section data-testid="grid-plain" style={{ width: 1000 }}>
        <h2>Non-virtualized</h2>
        <PlainInteractive />
      </section>
    </main>
  )
}
