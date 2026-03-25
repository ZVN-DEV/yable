'use client'

import { useState } from 'react'
import {
  useTable,
  Table,
  Pagination,
  GlobalFilter,
  CellInput,
  CellSelect,
  CellCheckbox,
  createColumnHelper,
  type ColumnDef,
  type TableInstance,
  type RowData,
} from '@yable/react'
import { people, departments, type Person } from '@/data'

const columnHelper = createColumnHelper<Person>()

const columns: ColumnDef<Person, any>[] = [
  columnHelper.display({
    id: 'select',
    header: ({ table }: { table: TableInstance<Person> }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={() => table.toggleAllRowsSelected()}
      />
    ),
    cell: ({ row }: { row: any }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={() => row.toggleSelected()}
      />
    ),
    size: 40,
  }),
  columnHelper.accessor('firstName', {
    header: 'First Name',
    cell: (info: any) => info.getValue(),
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
    cell: (info: any) => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info: any) => info.getValue(),
    size: 220,
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: (info: any) => info.getValue(),
    size: 70,
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    cell: (info: any) => info.getValue(),
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: (info: any) => info.getValue(),
    size: 200,
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    cell: (info: any) => `$${(info.getValue() as number).toLocaleString()}`,
    size: 120,
  }),
  columnHelper.accessor('startDate', {
    header: 'Start Date',
    cell: (info: any) => info.getValue(),
    size: 120,
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    cell: (info: any) => (
      <span style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: info.getValue() ? '#22c55e' : '#ef4444',
        marginRight: 6,
      }} />
    ),
    size: 80,
  }),
]

// Editable form table columns
const editableColumns: ColumnDef<Person, any>[] = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} />,
    meta: { alwaysEditable: true },
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} />,
    meta: { alwaysEditable: true },
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} type="email" />,
    meta: { alwaysEditable: true },
    size: 220,
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    editable: true,
    editConfig: {
      type: 'select',
      options: departments.map(d => ({ label: d, value: d })),
    },
    cell: (info: any) => (
      <CellSelect
        context={info}
        options={departments.map(d => ({ label: d, value: d }))}
      />
    ),
    meta: { alwaysEditable: true },
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    editable: true,
    editConfig: { type: 'number' },
    cell: (info: any) => <CellInput context={info} type="number" />,
    meta: { alwaysEditable: true },
    size: 130,
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    editable: true,
    editConfig: { type: 'checkbox' },
    cell: (info: any) => <CellCheckbox context={info} />,
    meta: { alwaysEditable: true },
    size: 80,
  }),
]

type DemoTab = 'basic' | 'form' | 'themes'

export default function Home() {
  const [tab, setTab] = useState<DemoTab>('basic')
  const [data] = useState(people)
  const [theme, setTheme] = useState<'default' | 'stripe' | 'compact'>('default')

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          Yable<span style={{ color: '#2563eb' }}>Tables</span>
        </h1>
        <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
          Modern table component library — React demo
        </p>
      </header>

      {/* Tab navigation */}
      <nav style={{
        display: 'flex',
        gap: 2,
        marginBottom: 24,
        borderBottom: '1px solid #e5e7eb',
      }}>
        {([
          ['basic', 'Data Table'],
          ['form', 'Form Table'],
          ['themes', 'Theme Switcher'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: tab === key ? '#2563eb' : '#666',
              borderBottom: tab === key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Demos */}
      {tab === 'basic' && <BasicDemo data={data} />}
      {tab === 'form' && <FormDemo data={data} />}
      {tab === 'themes' && <ThemeDemo data={data} theme={theme} setTheme={setTheme} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Basic Data Table
// ---------------------------------------------------------------------------
function BasicDemo({ data }: { data: Person[] }) {
  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Employees</h2>
        <GlobalFilter table={table} placeholder="Search employees..." />
      </div>
      <Table table={table} stickyHeader striped>
        <Pagination table={table} />
      </Table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editable Form Table
// ---------------------------------------------------------------------------
function FormDemo({ data: initialData }: { data: Person[] }) {
  const [data, setData] = useState(initialData.slice(0, 8))

  const table = useTable({
    data,
    columns: editableColumns,
    getRowId: (row) => String(row.id),
  })

  const pendingChanges = table.getAllPendingChanges()
  const hasPending = table.hasPendingChanges()

  const handleSave = () => {
    if (!hasPending) return
    // Apply pending changes to data
    const next = data.map((row) => {
      const changes = pendingChanges[String(row.id)]
      return changes ? { ...row, ...changes } : row
    })
    setData(next)
    table.discardAllPending()
    alert('Changes saved!')
  }

  const handleDiscard = () => {
    table.discardAllPending()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          Edit Employees
          {hasPending && (
            <span style={{ fontSize: 12, color: '#f59e0b', marginLeft: 8, fontWeight: 400 }}>
              Unsaved changes
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDiscard}
            disabled={!hasPending}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              background: 'white',
              cursor: hasPending ? 'pointer' : 'not-allowed',
              opacity: hasPending ? 1 : 0.5,
            }}
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={!hasPending}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              border: 'none',
              borderRadius: 6,
              background: hasPending ? '#2563eb' : '#93c5fd',
              color: 'white',
              cursor: hasPending ? 'pointer' : 'not-allowed',
              fontWeight: 500,
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
      <Table table={table} bordered />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Theme Switcher
// ---------------------------------------------------------------------------
function ThemeDemo({
  data,
  theme,
  setTheme,
}: {
  data: Person[]
  theme: 'default' | 'stripe' | 'compact'
  setTheme: (t: 'default' | 'stripe' | 'compact') => void
}) {
  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Theme: {theme}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['default', 'stripe', 'compact'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                border: theme === t ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: 6,
                background: theme === t ? '#eff6ff' : 'white',
                cursor: 'pointer',
                fontWeight: theme === t ? 600 : 400,
                color: theme === t ? '#2563eb' : '#333',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <Table table={table} theme={theme} stickyHeader striped>
        <Pagination table={table} />
      </Table>
    </div>
  )
}
