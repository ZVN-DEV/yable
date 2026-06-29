'use client'

import { useMemo } from 'react'
import { useTable, Table, GlobalFilter, Pagination, createColumnHelper } from '@zvndev/yable-react'
import { people, type Person } from '@/data'
import { DemoFrame } from '../_chrome'

const col = createColumnHelper<Person>()

export default function ContactsDemo() {
  const columns = useMemo(
    () => [
      col.accessor((p) => `${p.firstName} ${p.lastName}`, {
        id: 'name',
        header: 'Name',
        size: 180,
      }),
      col.accessor('email', {
        header: 'Email',
        size: 220,
        cellType: 'link',
        cellTypeProps: { href: (v: unknown) => `mailto:${String(v)}` },
      }),
      col.accessor('role', { header: 'Role', size: 180 }),
      col.accessor('department', {
        header: 'Department',
        size: 140,
        cellType: 'badge',
        cellTypeProps: { variant: 'info', appearance: 'soft' },
      }),
      col.accessor('age', { header: 'Age', size: 80, cellType: 'numeric' }),
      col.accessor('startDate', {
        header: 'Started',
        size: 130,
        cellType: 'date',
        cellTypeProps: { format: 'medium' },
      }),
      col.accessor('active', {
        header: 'Status',
        size: 120,
        cellType: 'boolean',
        cellTypeProps: { trueLabel: 'Active', falseLabel: 'Inactive', mode: 'badge' },
      }),
    ],
    [],
  )

  const table = useTable<Person>({
    data: people,
    columns,
    getRowId: (p) => String(p.id),
    initialState: { pagination: { pageIndex: 0, pageSize: 8 } },
  })

  return (
    <DemoFrame slug="contacts">
      <div style={{ marginBottom: 14, maxWidth: 320 }}>
        <GlobalFilter table={table} placeholder="Search contacts…" />
      </div>
      <Table table={table} className="yable-theme-stripe" striped />
      <div style={{ marginTop: 14 }}>
        <Pagination table={table} />
      </div>
    </DemoFrame>
  )
}
