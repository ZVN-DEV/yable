import type { Meta, StoryObj } from '@storybook/react'
import { useTable, Table, Pagination, createColumnHelper, type ColumnDef } from '@yable/react'

interface Person {
  id: number
  name: string
  email: string
  department: string
  salary: number
}

const data: Person[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering', salary: 125000 },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Design', salary: 95000 },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', department: 'Engineering', salary: 210000 },
  { id: 4, name: 'David Brown', email: 'david@example.com', department: 'Product', salary: 140000 },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', department: 'Engineering', salary: 85000 },
  { id: 6, name: 'Frank Miller', email: 'frank@example.com', department: 'Design', salary: 130000 },
]

const columnHelper = createColumnHelper<Person>()

const columns: ColumnDef<Person, any>[] = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('email', { header: 'Email', size: 220 }),
  columnHelper.accessor('department', { header: 'Department' }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    cell: (info: any) => `$${(info.getValue() as number).toLocaleString()}`,
    size: 120,
  }),
]

function ThemedTable({ theme = 'default' as 'default' | 'stripe' | 'compact' }) {
  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
  })

  return (
    <Table table={table} theme={theme} striped stickyHeader>
      <Pagination table={table} />
    </Table>
  )
}

const meta: Meta<typeof ThemedTable> = {
  title: 'Yable/Theming',
  component: ThemedTable,
  argTypes: {
    theme: {
      control: 'radio',
      options: ['default', 'stripe', 'compact'],
    },
  },
}

export default meta
type Story = StoryObj<typeof ThemedTable>

export const Default: Story = { args: { theme: 'default' } }
export const Stripe: Story = { args: { theme: 'stripe' } }
export const Compact: Story = { args: { theme: 'compact' } }
