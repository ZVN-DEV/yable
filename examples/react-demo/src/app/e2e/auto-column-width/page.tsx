'use client'

// E2E fixture: smart column width (Feature A).
//
// Both grids render wide content inside a container narrower than the columns'
// natural total. The spec in e2e/interactions.spec.ts asserts:
//   - fit mode:    NO horizontal scroll (scrollWidth ≈ clientWidth) and the
//                  long-content column WRAPPED (cell height > single line).
//   - scroll mode: horizontal scroll present (scrollWidth > clientWidth).
//   - the opt-out column (explicit size + enableAutoSize:false) keeps its width.

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

export default function AutoColumnWidthFixturePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Smart column width fixture</h1>
      <section data-testid="auto-fit" style={{ width: 520, marginBottom: 48 }}>
        <h2>overflow: fit</h2>
        <AutoGrid overflow="fit" />
      </section>
      <section data-testid="auto-scroll" style={{ width: 520 }}>
        <h2>overflow: scroll</h2>
        <AutoGrid overflow="scroll" />
      </section>
    </main>
  )
}
