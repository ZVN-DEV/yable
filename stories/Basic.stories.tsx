import type { Meta, StoryObj } from '@storybook/react'
import { useTable, Table, Pagination, GlobalFilter, createColumnHelper, type ColumnDef } from '@yable/react'

interface Person {
  id: number
  firstName: string
  lastName: string
  email: string
  age: number
  department: string
  salary: number
  active: boolean
}

const data: Person[] = [
  { id: 1, firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', age: 32, department: 'Engineering', salary: 125000, active: true },
  { id: 2, firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', age: 28, department: 'Design', salary: 95000, active: true },
  { id: 3, firstName: 'Carol', lastName: 'Williams', email: 'carol@example.com', age: 45, department: 'Engineering', salary: 210000, active: true },
  { id: 4, firstName: 'David', lastName: 'Brown', email: 'david@example.com', age: 35, department: 'Product', salary: 140000, active: true },
  { id: 5, firstName: 'Eve', lastName: 'Davis', email: 'eve@example.com', age: 26, department: 'Engineering', salary: 85000, active: true },
  { id: 6, firstName: 'Frank', lastName: 'Miller', email: 'frank@example.com', age: 41, department: 'Design', salary: 130000, active: false },
  { id: 7, firstName: 'Grace', lastName: 'Wilson', email: 'grace@example.com', age: 30, department: 'Engineering', salary: 120000, active: true },
  { id: 8, firstName: 'Henry', lastName: 'Moore', email: 'henry@example.com', age: 38, department: 'Engineering', salary: 175000, active: true },
]

const columnHelper = createColumnHelper<Person>()

const columns: ColumnDef<Person, any>[] = [
  columnHelper.accessor('firstName', { header: 'First Name' }),
  columnHelper.accessor('lastName', { header: 'Last Name' }),
  columnHelper.accessor('email', { header: 'Email', size: 220 }),
  columnHelper.accessor('age', { header: 'Age', size: 70 }),
  columnHelper.accessor('department', { header: 'Department' }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    cell: (info: any) => `$${(info.getValue() as number).toLocaleString()}`,
    size: 120,
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    cell: (info: any) => info.getValue() ? 'Yes' : 'No',
    size: 80,
  }),
]

function BasicTable({ striped = false, bordered = false, compact = false, stickyHeader = false }) {
  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
  })

  return (
    <div>
      <GlobalFilter table={table} placeholder="Search..." />
      <Table table={table} striped={striped} bordered={bordered} compact={compact} stickyHeader={stickyHeader}>
        <Pagination table={table} />
      </Table>
    </div>
  )
}

const meta: Meta<typeof BasicTable> = {
  title: 'Yable/Basic',
  component: BasicTable,
  argTypes: {
    striped: { control: 'boolean' },
    bordered: { control: 'boolean' },
    compact: { control: 'boolean' },
    stickyHeader: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof BasicTable>

export const Default: Story = {}
export const Striped: Story = { args: { striped: true } }
export const Bordered: Story = { args: { bordered: true } }
export const Compact: Story = { args: { compact: true } }
export const AllOptions: Story = { args: { striped: true, bordered: true, stickyHeader: true } }
