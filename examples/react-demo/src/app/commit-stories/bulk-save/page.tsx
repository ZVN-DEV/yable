'use client'

import { useState, useMemo } from 'react'
import { useTable, Table, createColumnHelper } from '@yable/react'
import type { CellPatch } from '@yable/core'

interface Item {
  id: string
  name: string
  email: string
  role: string
}

const initialData: Item[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Engineer' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'Designer' },
  { id: '3', name: 'Carol', email: 'carol@example.com', role: 'PM' },
]

const helper = createColumnHelper<Item>()
const columns = [
  helper.accessor('name', { header: 'Name', editable: true }),
  helper.accessor('email', { header: 'Email', editable: true }),
  helper.accessor('role', { header: 'Role', editable: true }),
]

export default function BulkSaveStory() {
  const [data, setData] = useState(initialData)

  const onCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      await new Promise((r) => setTimeout(r, 600))
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

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    autoCommit: false,
    onCommit,
    getRowId: (row) => row.id,
  })

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Bulk save (autoCommit: false)</h1>
      <p>
        Edit several cells. Nothing commits until you click &quot;Save all&quot;.
        Pending values stay on screen as draft state.
      </p>
      <button
        type="button"
        onClick={() => void table.commit()}
        style={{ marginBottom: 12, padding: '6px 12px' }}
      >
        Save all
      </button>
      <Table table={table} />
    </main>
  )
}
