'use client'

import { useState, useMemo } from 'react'
import { useTable, Table, createColumnHelper } from '@yable/react'
import type { CellPatch } from '@yable/core'

interface Item {
  id: string
  name: string
  avatar: string
}

const initialData: Item[] = [
  { id: '1', name: 'Alice', avatar: 'a.png' },
  { id: '2', name: 'Bob', avatar: 'b.png' },
]

const helper = createColumnHelper<Item>()

export default function PerColumnStory() {
  const [data, setData] = useState(initialData)
  const [log, setLog] = useState<string[]>([])

  const tableOnCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      setLog((l) => [...l, `table.onCommit called with ${patches.length} patch(es)`])
      await new Promise((r) => setTimeout(r, 400))
      setData((rows) =>
        rows.map((row) => {
          const mine = patches.filter((p) => p.rowId === row.id)
          if (mine.length === 0) return row
          const next = { ...row }
          for (const p of mine) (next as any)[p.columnId] = p.value
          return next
        })
      )
    },
    []
  )

  const avatarColumnCommit = useMemo(
    () => async (patch: CellPatch<Item, string>) => {
      setLog((l) => [...l, `avatar.commit called for ${patch.rowId}`])
      await new Promise((r) => setTimeout(r, 1000))
      setData((rows) =>
        rows.map((row) =>
          row.id === patch.rowId ? { ...row, avatar: patch.value } : row
        )
      )
    },
    []
  )

  const columns = useMemo(
    () => [
      helper.accessor('name', { header: 'Name', editable: true }),
      helper.accessor('avatar', {
        header: 'Avatar (per-column commit)',
        editable: true,
        commit: avatarColumnCommit,
      }) as any,
    ],
    [avatarColumnCommit]
  )

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    onCommit: tableOnCommit,
    getRowId: (row) => row.id,
  })

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Per-column commit override</h1>
      <p>
        Editing &quot;Name&quot; routes through the table-level <code>onCommit</code>.
        Editing &quot;Avatar&quot; routes through the column-level{' '}
        <code>commit</code>. Edit one of each in quick succession to see they fire
        in parallel.
      </p>
      <Table table={table} />
      <pre style={{ marginTop: 16, fontSize: 12 }}>
        {log.join('\n') || '(no calls yet)'}
      </pre>
    </main>
  )
}
