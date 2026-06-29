'use client'

import { useMemo } from 'react'
import { useTable, Table, createColumnHelper, type OnCommitFn } from '@zvndev/yable-react'
import { leads, STAGES, OWNERS, type Lead } from '../_data'
import { DemoFrame } from '../_chrome'

const col = createColumnHelper<Lead>()
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Simulated optimistic server: ~80% succeed after latency; a value under $1,000
// is always rejected so the error/retry state is easy to trigger on demand.
const onCommit: OnCommitFn<Lead> = async (patches) => {
  await delay(750 + Math.random() * 500)
  for (const p of patches) {
    if (p.columnId === 'value' && Number(p.value) < 1000) {
      throw new Error('Deal value below $1,000 was rejected')
    }
  }
  if (Math.random() < 0.2) throw new Error('Network hiccup — retry')
}

export default function CrmDemo() {
  const columns = useMemo(
    () => [
      col.accessor('company', {
        header: 'Company',
        size: 180,
        editable: true,
        editConfig: { type: 'text' },
      }),
      col.accessor('contact', {
        header: 'Contact',
        size: 130,
        editable: true,
        editConfig: { type: 'text' },
      }),
      col.accessor('stage', {
        header: 'Stage',
        size: 140,
        editable: true,
        editConfig: { type: 'select', options: STAGES.map((v) => ({ label: v, value: v })) },
        cellType: 'status',
        cellTypeProps: {
          colorMap: {
            Won: 'success',
            Lost: 'danger',
            Negotiation: 'warning',
            Proposal: 'info',
            Qualified: 'info',
            New: 'default',
          },
        },
      }),
      col.accessor('value', {
        header: 'Value',
        size: 130,
        editable: true,
        editConfig: { type: 'number' },
        cellType: 'currency',
        cellTypeProps: { decimals: 0 },
      }),
      col.accessor('owner', {
        header: 'Owner',
        size: 110,
        editable: true,
        editConfig: { type: 'select', options: OWNERS.map((v) => ({ label: v, value: v })) },
      }),
      col.accessor('probability', {
        header: 'Probability',
        size: 150,
        editable: true,
        editConfig: { type: 'number' },
        cellType: 'progress',
        cellTypeProps: { max: 100, showLabel: true },
      }),
      col.accessor('nextStep', {
        header: 'Next step',
        size: 160,
        editable: true,
        editConfig: { type: 'text' },
      }),
    ],
    [],
  )

  const table = useTable<Lead>({
    data: leads,
    columns,
    getRowId: (l) => l.id,
    onCommit,
  })

  return (
    <DemoFrame slug="crm">
      <Table table={table} className="yable-theme-default" />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        Click any cell to edit — selects for Stage/Owner, numbers for Value/Probability. Edits
        commit <strong>optimistically</strong> through <code>onCommit</code>; watch the pending →
        saved badge. Set a Value under <code>$1,000</code> to force a rejection and the
        retry/dismiss UI.
      </p>
    </DemoFrame>
  )
}
