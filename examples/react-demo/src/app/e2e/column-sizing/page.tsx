'use client'

// E2E fixture: column sizing edge cases.
//
// 1. Label-less (component) header must NOT be clipped by the header-label
//    ellipsis. A `selectColumn()` renders a checkbox `<label>` with no text; the
//    0.6.1 ellipsis clip cropped it to 0px. e2e/interactions.spec.ts asserts the
//    header checkbox/hitbox stays fully visible (≥ ~16px) even at size 40.
// 2. `resizeMaxSize` lets a user drag a `maxSize`-capped column past its cap.
//    Set app-wide via `defaultColumnDef`. The spec drags the header wider than
//    `maxSize` and asserts the rendered header width exceeds `maxSize`.

import { useTable, Table, createColumnHelper, selectColumn } from '@zvndev/yable-react'

interface Item {
  id: number
  name: string
}

const ROWS: Item[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
}))

const col = createColumnHelper<Item>()

// --- Label-less header (selection checkbox) --------------------------------

function SelectHeaderGrid() {
  const table = useTable<Item>({
    data: ROWS,
    columns: [
      selectColumn<Item>({ size: 40 }),
      col.accessor('name', { header: 'Name', size: 160 }),
    ],
    getRowId: (row) => String(row.id),
    enableRowSelection: true,
    initialState: { pagination: { pageIndex: 0, pageSize: 100 } },
  })
  return <Table table={table} bordered />
}

// --- resizeMaxSize: drag past maxSize --------------------------------------

const RESIZE_MAX_SIZE = 180

function ResizePastMaxGrid() {
  const table = useTable<Item>({
    data: ROWS,
    columns: [
      // maxSize caps auto-sizing, but resizeMaxSize (Infinity, app-wide) lets a
      // human drag past it.
      col.accessor('name', { header: 'Name', size: 120, minSize: 100, maxSize: RESIZE_MAX_SIZE }),
      col.accessor('id', { header: 'ID', size: 120 }),
    ],
    getRowId: (row) => String(row.id),
    defaultColumnDef: { resizeMaxSize: Number.POSITIVE_INFINITY },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    initialState: { pagination: { pageIndex: 0, pageSize: 100 } },
  })
  return <Table table={table} bordered />
}

export default function ColumnSizingFixturePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Column sizing fixture</h1>
      <section data-testid="grid-select-header" style={{ width: 400, marginBottom: 48 }}>
        <h2>Label-less header (selection checkbox)</h2>
        <SelectHeaderGrid />
      </section>
      <section data-testid="grid-resize-max" style={{ width: 600 }}>
        <h2>resizeMaxSize: drag past maxSize</h2>
        <ResizePastMaxGrid />
      </section>
    </main>
  )
}
