'use client'

// Drag Lab — exercises the interactions that are hardest to get right:
// column reorder (drag a header), the sidebar columns panel (reorderable list),
// and row drag-to-reorder. Useful as a manual QA surface for drag states.

import { useState } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'
import s from './drag-lab.module.css'

interface Person {
  id: number
  name: string
  team: string
  role: string
  location: string
  commits: number
}

const TEAMS = ['Platform', 'Growth', 'Design', 'Data', 'Infra']
const ROLES = ['Engineer', 'Senior', 'Staff', 'Lead', 'Manager']
const CITIES = ['NYC', 'Berlin', 'Tokyo', 'Austin', 'Lisbon', 'Toronto']
const NAMES = [
  'Alice Chen',
  'Bob Martinez',
  'Carol Wu',
  'David Okafor',
  'Eve Johansson',
  'Frank Patel',
  'Grace Kim',
  'Henry Dubois',
  'Ivy Tanaka',
  'Jack Morrison',
  'Kate Alvarez',
  'Liam Novak',
]

const initialData: Person[] = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  team: TEAMS[i % TEAMS.length],
  role: ROLES[i % ROLES.length],
  location: CITIES[i % CITIES.length],
  commits: 40 + ((i * 37) % 320),
}))

const col = createColumnHelper<Person>()
const columns = [
  col.accessor('name', { header: 'Name', size: 180, enableSorting: true }),
  col.accessor('team', { header: 'Team', size: 130, enableSorting: true }),
  col.accessor('role', { header: 'Role', size: 130, enableSorting: true }),
  col.accessor('location', { header: 'Location', size: 130, enableSorting: true }),
  col.accessor('commits', { header: 'Commits', size: 110, enableSorting: true }),
]

export default function DragLabPage() {
  const [data, setData] = useState(initialData)

  const table = useTable<Person>({
    data,
    columns,
    getRowId: (row) => String(row.id),
    enableColumnReorder: true,
    enableRowDragging: true,
    onRowReorder: ({ fromIndex, toIndex }) => {
      setData((prev) => {
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        if (moved) next.splice(toIndex, 0, moved)
        return next
      })
    },
  })

  return (
    <main className={s.page}>
      <header className={s.header}>
        <span className={s.eyebrow}>Drag lab</span>
        <h1 className={s.title}>Column reorder · column panel · row drag</h1>
        <p className={s.subtitle}>
          Drag a column header to reorder columns (a drop indicator marks the insert point). Open
          the sidebar to reorder columns as a list. Drag the handle on a row to move it. Sorting,
          resizing, and selection all stay live.
        </p>
      </header>

      <div className={s.tableWrap}>
        <Table
          table={table}
          striped
          bordered
          stickyHeader
          sidebar
          sidebarPanels={['columns', 'filters']}
          defaultSidebarPanel="columns"
          ariaLabel="Drag lab table"
        />
      </div>
    </main>
  )
}
