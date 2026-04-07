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
  role: string
}

const initialData: Item[] = [
  { id: '1', name: 'Alice Anderson', email: 'alice@example.com', role: 'Engineer' },
  { id: '2', name: 'Bob Brown', email: 'bob@example.com', role: 'Designer' },
  { id: '3', name: 'Carol Carter', email: 'carol@example.com', role: 'PM' },
  { id: '4', name: 'David Davis', email: 'david@example.com', role: 'Engineer' },
]

const helper = createColumnHelper<Item>()
const columns = [
  helper.accessor('name', { header: 'Name', editable: true }),
  helper.accessor('email', { header: 'Email', editable: true }),
  helper.accessor('role', { header: 'Role', editable: true }),
]

export default function FlakyNetworkStory() {
  const [data, setData] = useState(initialData)

  // 50% failure rate
  const onCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      await new Promise((r) => setTimeout(r, 600))
      if (Math.random() < 0.5) {
        throw new Error('Network error (simulated)')
      }
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
      <h1>Flaky network — 50% failure rate</h1>
      <p>
        Click a cell, type a new value, press Enter. Half the time it will succeed
        (cell clears), half the time it will go red. Click ↻ to retry, × to dismiss.
      </p>
      <Table table={table} />
    </main>
  )
}
