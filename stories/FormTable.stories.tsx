import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  useTable, Table, CellInput, CellSelect, CellCheckbox,
  createColumnHelper, type ColumnDef,
} from '@zvndev/yable-react'

interface Task {
  id: number
  title: string
  status: string
  priority: string
  assignee: string
  done: boolean
}

const initialTasks: Task[] = [
  { id: 1, title: 'Set up CI pipeline', status: 'In Progress', priority: 'High', assignee: 'Alice', done: false },
  { id: 2, title: 'Design system tokens', status: 'Done', priority: 'Medium', assignee: 'Bob', done: true },
  { id: 3, title: 'Write API docs', status: 'Todo', priority: 'Low', assignee: 'Carol', done: false },
  { id: 4, title: 'Performance audit', status: 'In Progress', priority: 'High', assignee: 'David', done: false },
  { id: 5, title: 'User interviews', status: 'Todo', priority: 'Medium', assignee: 'Eve', done: false },
]

const statusOptions = [
  { label: 'Todo', value: 'Todo' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Done', value: 'Done' },
]

const priorityOptions = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
]

const columnHelper = createColumnHelper<Task>()

const columns: ColumnDef<Task, any>[] = [
  columnHelper.accessor('done', {
    header: '',
    editable: true,
    editConfig: { type: 'checkbox' },
    cell: (info: any) => <CellCheckbox context={info} />,
    meta: { alwaysEditable: true },
    size: 40,
  }),
  columnHelper.accessor('title', {
    header: 'Task',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} />,
    meta: { alwaysEditable: true },
    size: 250,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    editable: true,
    editConfig: { type: 'select', options: statusOptions },
    cell: (info: any) => <CellSelect context={info} options={statusOptions} />,
    meta: { alwaysEditable: true },
    size: 140,
  }),
  columnHelper.accessor('priority', {
    header: 'Priority',
    editable: true,
    editConfig: { type: 'select', options: priorityOptions },
    cell: (info: any) => <CellSelect context={info} options={priorityOptions} />,
    meta: { alwaysEditable: true },
    size: 120,
  }),
  columnHelper.accessor('assignee', {
    header: 'Assignee',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} />,
    meta: { alwaysEditable: true },
    size: 150,
  }),
]

function FormTable() {
  const [data] = useState(initialTasks)

  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
  })

  const hasPending = table.hasPendingChanges()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 14, color: hasPending ? '#f59e0b' : '#999' }}>
          {hasPending ? 'Unsaved changes' : 'No changes'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => table.discardAllPending()} disabled={!hasPending}>Discard</button>
          <button onClick={() => { table.commitAllPending(); alert('Saved!') }} disabled={!hasPending}>Save</button>
        </div>
      </div>
      <Table table={table} bordered />
    </div>
  )
}

const meta: Meta<typeof FormTable> = {
  title: 'Yable/Form Table',
  component: FormTable,
}

export default meta
type Story = StoryObj<typeof FormTable>

export const Default: Story = {}
