'use client'

import { useState, useMemo } from 'react'
import {
  useTable,
  Table,
  createColumnHelper,
} from '@zvndev/yable-react'
import type { CellPatch } from '@zvndev/yable-core'

interface Item {
  id: string
  name: string
  email: string
}

const initialData: Item[] = [
  { id: '1', name: 'Alice Anderson', email: 'alice@example.com' },
  { id: '2', name: 'Bob Brown', email: 'bob@example.com' },
  { id: '3', name: 'Carol Carter', email: 'carol@example.com' },
]

const helper = createColumnHelper<Item>()
const columns = [
  helper.accessor('name', { header: 'Name', editable: true }),
  helper.accessor('email', { header: 'Email', editable: true }),
]

export default function SlowNetworkStory() {
  const [data, setData] = useState(initialData)

  const onCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      await new Promise((r) => setTimeout(r, 2000))
      setData((rows) =>
        rows.map((row) => {
          const myPatches = patches.filter((p) => p.rowId === row.id)
          if (myPatches.length === 0) return row
          const next = { ...row }
          for (const p of myPatches) {
            ;(next as any)[p.columnId] = p.value
          }
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
    onCommit,
    getRowId: (row) => row.id,
  })

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Slow network — 2s delay</h1>
      <p>
        Edit a cell and watch the pending opacity for 2 seconds before it commits.
      </p>
      <Table table={table} />
    </main>
  )
}
