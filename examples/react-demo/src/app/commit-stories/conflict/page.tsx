'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'
import type { CellPatch } from '@zvndev/yable-core'

interface Item {
  id: string
  name: string
  price: number
}

const initialData: Item[] = [
  { id: '1', name: 'Widget', price: 9.99 },
  { id: '2', name: 'Gadget', price: 19.99 },
]

const helper = createColumnHelper<Item>()
const columns = [
  helper.accessor('name', { header: 'Name', editable: true }),
  helper.accessor('price', { header: 'Price', editable: true }),
]

export default function ConflictStory() {
  const [data, setData] = useState(initialData)

  // Background mutator: every 5 seconds the "server" bumps the price of row 1
  useEffect(() => {
    const id = setInterval(() => {
      setData((rows) =>
        rows.map((r) =>
          r.id === '1' ? { ...r, price: +(r.price + 1).toFixed(2) } : r
        )
      )
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const onCommit = useMemo(
    () => async (_patches: CellPatch<Item>[]) => {
      await new Promise((r) => setTimeout(r, 800))
      throw new Error('Simulated stale write — server rejected')
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
      <h1>External conflict</h1>
      <p>
        The price of &quot;Widget&quot; is bumped by 1 every 5 seconds (simulated
        server-side update). Edit the price, watch the cell go to error, then watch
        it transition to <strong>conflict</strong> on the next refetch. Click ✓ to
        retry your value or ✗ to accept the server value.
      </p>
      <Table table={table} />
    </main>
  )
}
