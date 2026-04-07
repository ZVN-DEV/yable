# Quickstart Guide

Get from zero to a fully interactive data table in 11 steps. Each step builds on the previous one and includes complete, copy-paste-ready code.

## Prerequisites

- Node.js 18+
- React 18+ (or 19)
- A React project (Vite, Next.js, Create React App, etc.)

---

## Step 1: Install Packages

```bash
npm install @yable/core @yable/react @yable/themes
```

`@yable/core` is the headless engine. `@yable/react` provides the React hook and components. `@yable/themes` provides CSS styling.

---

## Step 2: Define Your Data Type

Create a TypeScript interface for the rows your table will display:

```typescript
// types.ts
export interface Employee {
  id: number
  name: string
  department: string
  salary: number
  startDate: string
  active: boolean
}
```

---

## Step 3: Create Sample Data

```typescript
// data.ts
import type { Employee } from './types'

export const employees: Employee[] = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 120000, startDate: '2021-03-15', active: true },
  { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 85000, startDate: '2020-07-01', active: true },
  { id: 3, name: 'Charlie Brown', department: 'Engineering', salary: 110000, startDate: '2022-01-10', active: false },
  { id: 4, name: 'Diana Prince', department: 'Sales', salary: 95000, startDate: '2019-11-20', active: true },
  { id: 5, name: 'Eve Williams', department: 'Engineering', salary: 130000, startDate: '2018-05-03', active: true },
  { id: 6, name: 'Frank Miller', department: 'Marketing', salary: 78000, startDate: '2023-02-14', active: true },
  { id: 7, name: 'Grace Lee', department: 'Sales', salary: 92000, startDate: '2021-08-22', active: false },
  { id: 8, name: 'Henry Davis', department: 'Engineering', salary: 115000, startDate: '2020-12-01', active: true },
]
```

---

## Step 4: Define Columns Using columnHelper

The `createColumnHelper` function gives you a type-safe way to define columns. The `.accessor()` method infers the value type from the data interface.

```typescript
// columns.ts
import { createColumnHelper } from '@yable/react'
import type { Employee } from './types'

const columnHelper = createColumnHelper<Employee>()

export const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
  }),
  columnHelper.accessor('department', {
    header: 'Department',
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    cell: ({ getValue }) => {
      return `$${getValue().toLocaleString()}`
    },
  }),
  columnHelper.accessor('startDate', {
    header: 'Start Date',
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    cell: ({ getValue }) => (getValue() ? 'Yes' : 'No'),
  }),
]
```

---

## Step 5: Create the Table with useTable

The `useTable` hook creates a table instance and manages React state internally.

```tsx
// EmployeeTable.tsx
import { useTable, Table } from '@yable/react'
import '@yable/themes'
import { employees } from './data'
import { columns } from './columns'

export function EmployeeTable() {
  const table = useTable({
    data: employees,
    columns,
  })

  return <Table table={table} />
}
```

That's it -- you have a rendered table. But it doesn't do anything interactive yet. Let's add features.

---

## Step 6: Add Sorting

Sorting is enabled by default at the table level. You just need to enable it on the columns you want to be sortable:

```typescript
// columns.ts — updated
export const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    enableSorting: true,
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    enableSorting: true,
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    enableSorting: true,
    cell: ({ getValue }) => `$${getValue().toLocaleString()}`,
  }),
  columnHelper.accessor('startDate', {
    header: 'Start Date',
    enableSorting: true,
    sortingFn: 'datetime',
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    cell: ({ getValue }) => (getValue() ? 'Yes' : 'No'),
  }),
]
```

Click a column header to sort ascending, click again for descending, and a third time to remove the sort. Hold **Shift** and click another column for multi-column sorting.

### Controlled Sorting (Optional)

If you need to know the current sort state or set it programmatically:

```tsx
import { useState } from 'react'
import type { SortingState } from '@yable/react'

export function EmployeeTable() {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useTable({
    data: employees,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
  })

  return <Table table={table} />
}
```

---

## Step 7: Add Filtering

### Global Filter

Use the `GlobalFilter` component for a search-across-all-columns input:

```tsx
import { useTable, Table, GlobalFilter } from '@yable/react'

export function EmployeeTable() {
  const table = useTable({ data: employees, columns })

  return (
    <div>
      <GlobalFilter table={table} placeholder="Search employees..." debounce={300} />
      <Table table={table} />
    </div>
  )
}
```

### Per-Column Filters

Set column filter values programmatically:

```tsx
// Filter the department column to show only "Engineering"
table.setColumnFilters([{ id: 'department', value: 'Engineering' }])

// Clear all column filters
table.resetColumnFilters(true)
```

You can also use built-in filter functions on column definitions:

```typescript
columnHelper.accessor('salary', {
  header: 'Salary',
  filterFn: 'inNumberRange', // Built-in: filters by [min, max] tuple
})
```

Available built-in filter functions: `includesString`, `includesStringSensitive`, `equalsString`, `equalsStringSensitive`, `arrIncludes`, `arrIncludesAll`, `arrIncludesSome`, `equals`, `weakEquals`, `inNumberRange`, `inDateRange`.

---

## Step 8: Add Pagination

Add the `Pagination` component as a child of `Table`:

```tsx
import { useTable, Table, Pagination, GlobalFilter } from '@yable/react'

export function EmployeeTable() {
  const table = useTable({
    data: employees,
    columns,
    // Optional: set initial page size
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  })

  return (
    <div>
      <GlobalFilter table={table} placeholder="Search employees..." />
      <Table table={table} striped>
        <Pagination
          table={table}
          showPageSize
          pageSizes={[5, 10, 25, 50]}
          showInfo
        />
      </Table>
    </div>
  )
}
```

---

## Step 9: Add Cell Editing

Enable editing on the table and configure individual columns:

```typescript
// columns.ts — updated with editing
export const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    enableSorting: true,
    editable: true,
    editConfig: {
      type: 'text',
      validate: (value) => {
        if (!value || String(value).trim().length === 0) return 'Name is required'
        return null
      },
    },
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    enableSorting: true,
    editable: true,
    editConfig: {
      type: 'select',
      options: [
        { label: 'Engineering', value: 'Engineering' },
        { label: 'Marketing', value: 'Marketing' },
        { label: 'Sales', value: 'Sales' },
      ],
    },
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    enableSorting: true,
    editable: true,
    editConfig: {
      type: 'number',
      validate: (value) => {
        if (Number(value) < 0) return 'Salary must be positive'
        return null
      },
    },
    cell: ({ getValue }) => `$${getValue().toLocaleString()}`,
  }),
  columnHelper.accessor('startDate', {
    header: 'Start Date',
    enableSorting: true,
    sortingFn: 'datetime',
    editable: true,
    editConfig: { type: 'date' },
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    editable: true,
    editConfig: { type: 'toggle' },
  }),
]
```

Then handle edit commits in your component:

```tsx
export function EmployeeTable() {
  const [data, setData] = useState(employees)

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    onEditCommit: (changes) => {
      // changes is Record<string, Partial<Employee>>
      // key is the row ID, value is the changed fields
      setData((prev) =>
        prev.map((row, i) => {
          const rowChanges = changes[String(i)]
          return rowChanges ? { ...row, ...rowChanges } : row
        })
      )
    },
  })

  return (
    <Table table={table} striped>
      <Pagination table={table} />
    </Table>
  )
}
```

Double-click a cell to enter edit mode. Press **Enter** to commit, **Escape** to cancel.

---

## Step 10: Add a Theme

Import the theme CSS and set the `theme` prop:

```tsx
import '@yable/themes'

// Use the stripe theme
<Table table={table} theme="stripe" striped stickyHeader />

// Or the compact theme for dense data
<Table table={table} theme="compact" compact bordered />
```

### Dark Mode

Dark mode activates automatically when the user's system preference is dark. To force a mode:

```html
<!-- Force dark -->
<div data-yable-theme="dark">
  <Table table={table} />
</div>
```

### Custom Token Overrides

Apply a custom accent color to the table's container:

```css
.my-brand-table {
  --yable-accent: #7c3aed;
  --yable-accent-hover: #6d28d9;
  --yable-accent-light: rgba(124, 58, 237, 0.08);
}
```

```tsx
<div className="my-brand-table">
  <Table table={table} striped />
</div>
```

---

## Step 11: Add Async Cell Commits

Save edits to a backend with automatic optimistic updates, error states, and retry:

```tsx
import { CommitError } from '@yable/core'

export function EmployeeTable() {
  const [data, setData] = useState(initialData)

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    // autoCommit: true (default) fires onCommit after each edit
    onCommit: async (patches) => {
      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          patches.map((p) => ({
            id: p.rowId,
            field: p.columnId,
            value: p.value,
          }))
        ),
        signal: patches[0].signal, // cancel if user edits again
      })

      if (!res.ok) {
        // Per-cell error messages
        throw new CommitError({
          [patches[0].rowId]: {
            [patches[0].columnId]: `Save failed: ${res.statusText}`,
          },
        })
      }

      // On success, update local data so the table re-renders
      const saved = await res.json()
      setData((prev) =>
        prev.map((row) => {
          const update = saved.find((s: any) => s.id === row.id)
          return update ? { ...row, ...update } : row
        })
      )
    },
  })

  return (
    <Table table={table} striped>
      <Pagination table={table} />
    </Table>
  )
}
```

Cells automatically show pending spinners during saves, error badges on failure (with retry on click), and conflict indicators if the server value changed underneath. See the [Async Commits Guide](./async-commits.md) and [Feature Documentation](./FEATURES.md#async-cell-commits) for the full API.

---

## Complete Example

Here is the full working example with all features combined:

```tsx
import { useState } from 'react'
import { createColumnHelper, useTable, Table, Pagination, GlobalFilter } from '@yable/react'
import type { SortingState } from '@yable/react'
import '@yable/themes'

// Data type
interface Employee {
  id: number
  name: string
  department: string
  salary: number
  startDate: string
  active: boolean
}

// Column helper
const columnHelper = createColumnHelper<Employee>()

// Column definitions
const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    enableSorting: true,
    editable: true,
    editConfig: { type: 'text' },
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    enableSorting: true,
    editable: true,
    editConfig: {
      type: 'select',
      options: [
        { label: 'Engineering', value: 'Engineering' },
        { label: 'Marketing', value: 'Marketing' },
        { label: 'Sales', value: 'Sales' },
      ],
    },
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    enableSorting: true,
    editable: true,
    editConfig: { type: 'number' },
    cell: ({ getValue }) => `$${getValue().toLocaleString()}`,
  }),
  columnHelper.accessor('startDate', {
    header: 'Start Date',
    enableSorting: true,
    sortingFn: 'datetime',
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    editable: true,
    editConfig: { type: 'toggle' },
  }),
]

// Initial data
const initialData: Employee[] = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 120000, startDate: '2021-03-15', active: true },
  { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 85000, startDate: '2020-07-01', active: true },
  { id: 3, name: 'Charlie Brown', department: 'Engineering', salary: 110000, startDate: '2022-01-10', active: false },
  { id: 4, name: 'Diana Prince', department: 'Sales', salary: 95000, startDate: '2019-11-20', active: true },
  { id: 5, name: 'Eve Williams', department: 'Engineering', salary: 130000, startDate: '2018-05-03', active: true },
  { id: 6, name: 'Frank Miller', department: 'Marketing', salary: 78000, startDate: '2023-02-14', active: true },
  { id: 7, name: 'Grace Lee', department: 'Sales', salary: 92000, startDate: '2021-08-22', active: false },
  { id: 8, name: 'Henry Davis', department: 'Engineering', salary: 115000, startDate: '2020-12-01', active: true },
]

export function EmployeeTable() {
  const [data, setData] = useState(initialData)
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    enableCellEditing: true,
    onEditCommit: (changes) => {
      setData((prev) =>
        prev.map((row, i) => {
          const rowChanges = changes[String(i)]
          return rowChanges ? { ...row, ...rowChanges } : row
        })
      )
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  })

  return (
    <div>
      <GlobalFilter table={table} placeholder="Search employees..." />
      <Table table={table} striped stickyHeader>
        <Pagination table={table} showPageSize pageSizes={[5, 10, 25]} />
      </Table>
    </div>
  )
}
```

---

## Next Steps

- Read the [Feature Documentation](./FEATURES.md) for detailed guides on every feature (column pinning, row selection, grouping, tree data, formulas, pivot tables, etc.)
- Browse the [API Reference](./API.md) for the complete list of table options, methods, and types
- Check the [Contributing Guide](../CONTRIBUTING.md) if you want to help build Yable
