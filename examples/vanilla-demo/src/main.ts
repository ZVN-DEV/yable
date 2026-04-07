import { createTableDOM, createColumnHelper, type ColumnDef } from '@zvndev/yable-vanilla'
import '@zvndev/yable-themes/default.css'

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
  { id: 9, firstName: 'Ivy', lastName: 'Taylor', email: 'ivy@example.com', age: 29, department: 'Design', salary: 100000, active: true },
  { id: 10, firstName: 'Jack', lastName: 'Anderson', email: 'jack@example.com', age: 33, department: 'Engineering', salary: 145000, active: true },
  { id: 11, firstName: 'Kate', lastName: 'Thomas', email: 'kate@example.com', age: 27, department: 'Design', salary: 75000, active: true },
  { id: 12, firstName: 'Liam', lastName: 'Jackson', email: 'liam@example.com', age: 42, department: 'Product', salary: 200000, active: true },
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
    cell: (info) => `$${(info.getValue() as number).toLocaleString()}`,
    size: 120,
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    cell: (info) => info.getValue() ? 'Yes' : 'No',
    size: 80,
  }),
]

const container = document.getElementById('table-container')!
const eventLog = document.getElementById('event-log')!

const tableDOM = createTableDOM<Person>({
  element: container,
  data,
  columns,
  getRowId: (row) => String(row.id),
  stickyHeader: true,
  striped: true,
  pagination: { showPageSize: true, pageSizes: [5, 10, 20] },
  initialState: {
    pagination: { pageIndex: 0, pageSize: 5 },
  },
})

function log(message: string) {
  const p = document.createElement('p')
  p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
  eventLog.appendChild(p)
  eventLog.scrollTop = eventLog.scrollHeight
}

tableDOM.on('cell:click', (e) => {
  log(`Cell clicked — row: ${e.rowId}, column: ${e.columnId}`)
})

tableDOM.on('row:click', (e) => {
  log(`Row clicked — row: ${e.rowId}`)
})

tableDOM.on('header:click', (e) => {
  log(`Header clicked — column: ${e.columnId}`)
})
