# @zvndev/yable-react

React bindings for the Yable data table engine.

`@zvndev/yable-react` provides the `useTable` hook, a component tree for rendering tables, form controls for in-cell editing, and convenience components for pagination and filtering. It re-exports `@zvndev/yable-core` utilities so you only need one import for most use cases.

## Installation

```bash
npm install @zvndev/yable-core @zvndev/yable-react
```

**Peer dependencies:** React 18+ (also works with React 19).

## Quick Start

```tsx
import { createColumnHelper, useTable, Table, Pagination } from '@zvndev/yable-react'
import '@zvndev/yable-themes'

interface Task {
  title: string
  status: 'todo' | 'in-progress' | 'done'
  priority: number
}

const columnHelper = createColumnHelper<Task>()

const columns = [
  columnHelper.accessor('title', { header: 'Title' }),
  columnHelper.accessor('status', { header: 'Status' }),
  columnHelper.accessor('priority', { header: 'Priority', enableSorting: true }),
]

const data: Task[] = [
  { title: 'Build table', status: 'done', priority: 1 },
  { title: 'Write docs', status: 'in-progress', priority: 2 },
  { title: 'Ship it', status: 'todo', priority: 3 },
]

function TaskTable() {
  const table = useTable({ data, columns })

  return (
    <Table table={table} striped>
      <Pagination table={table} />
    </Table>
  )
}
```

## Hook

### `useTable<TData>(options: TableOptions<TData>): Table<TData>`

The primary hook. Accepts the same options as `@zvndev/yable-core`'s `createTable()` but manages React state internally. Supports both uncontrolled (default) and controlled state patterns.

```tsx
// Uncontrolled -- useTable manages all state
const table = useTable({ data, columns })

// Controlled -- you manage specific state slices
const [sorting, setSorting] = useState<SortingState>([])
const table = useTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
})
```

## Components

### Layout Components

| Component | Description |
|---|---|
| `Table` | Root container -- wraps everything in a `<div>` with a `<table>` inside. Accepts `table`, `striped`, `bordered`, `compact`, `stickyHeader`, `theme`, `loading`, `emptyMessage`, `footer`, and `children` props. |
| `TableHeader` | Renders `<thead>` with header groups and sort indicators. |
| `TableBody` | Renders `<tbody>` with rows and cells. |
| `TableCell` | Renders a single `<td>` with editing support. |
| `TableFooter` | Renders `<tfoot>` with footer content. |

### Interactive Components

| Component | Description |
|---|---|
| `Pagination` | Page navigation with first/last/prev/next buttons, page numbers, and page size selector. Props: `table`, `showPageSize`, `pageSizes`, `showInfo`, `showFirstLast`. |
| `GlobalFilter` | Debounced search input for the global filter. Props: `table`, `placeholder`, `debounce`, `className`. |
| `SortIndicator` | Sort direction arrow icon. Props: `direction`, `index` (for multi-sort badge). |

### Form Components (In-Cell Editing)

| Component | Description |
|---|---|
| `CellInput` | Text/number input for cell editing. Props: `context`, `type`, `placeholder`, `inline`, `autoFocus`. |
| `CellSelect` | Dropdown select for cell editing. |
| `CellCheckbox` | Checkbox for boolean cell values. |
| `CellToggle` | Toggle switch for boolean cell values. |
| `CellDatePicker` | Date input for cell editing. |

### Context

| Export | Description |
|---|---|
| `TableProvider` | React context provider for the table instance. |
| `useTableContext()` | Hook to access the table instance from any child component. |

## Re-exports from @zvndev/yable-core

For convenience, `@zvndev/yable-react` re-exports commonly used utilities so you don't need to import from `@zvndev/yable-core` directly:

- `createColumnHelper`
- `sortingFns`
- `filterFns`
- `aggregationFns`
- `functionalUpdate`
- All core types (`TableOptions`, `SortingState`, `ColumnDef`, etc.)

## Table Props

The `<Table>` component accepts these props:

```typescript
interface TableProps<TData> {
  table: Table<TData>       // Required -- the table instance from useTable
  stickyHeader?: boolean     // Pin header to top on scroll
  striped?: boolean          // Alternate row backgrounds
  bordered?: boolean         // Add cell borders
  compact?: boolean          // Reduce padding
  theme?: string             // Theme variant name
  clickableRows?: boolean    // Add pointer cursor + hover to rows
  footer?: boolean           // Show table footer
  loading?: boolean          // Show loading overlay
  emptyMessage?: string      // Text when no rows (default: "No data")
  renderEmpty?: () => ReactNode   // Custom empty state
  renderLoading?: () => ReactNode // Custom loading state
  children?: ReactNode       // Extra content (e.g. Pagination)
  className?: string         // Additional CSS class
}
```

## License

MIT
