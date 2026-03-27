# @yable/core

Headless, framework-agnostic data table engine. Zero dependencies.

`@yable/core` is the foundation of the Yable table library. It handles all table logic -- sorting, filtering, pagination, editing, grouping, aggregation, pivot tables, tree data, formulas, clipboard, fill handle, undo/redo, and more -- without touching the DOM. Framework adapters like `@yable/react` and `@yable/vanilla` consume the core to produce UI.

## Installation

```bash
npm install @yable/core
```

## Core Concepts

### Table

The central object. Created via `createTable(options)`, it holds all state and exposes methods for sorting, filtering, pagination, editing, selection, and more.

### Column

Defined using `createColumnHelper<T>()` and its `.accessor()`, `.display()`, and `.group()` methods. Columns describe how data maps to cells, how to sort/filter, and how to render headers and footers.

### Row

Represents a single data record. Rows provide access to cell values, selection state, expansion state, and pinning. Rows can have sub-rows for tree data.

### Cell

The intersection of a row and a column. Cells provide typed value access, editing state, and render context.

## Key Exports

### Factory Functions

| Export | Description |
|---|---|
| `createTable(options)` | Create a table instance from data + column definitions |
| `createColumnHelper<T>()` | Type-safe column definition builder |
| `createColumn(table, def, depth)` | Create a column instance (internal) |
| `createRow(table, id, original, index, depth)` | Create a row instance (internal) |
| `createHeader(table, column, options)` | Create a header instance (internal) |

### Built-in Functions

| Export | Description |
|---|---|
| `sortingFns` | 6 sorting comparators: `alphanumeric`, `alphanumericCaseSensitive`, `text`, `textCaseSensitive`, `datetime`, `basic` |
| `filterFns` | 11 filter predicates: `includesString`, `equalsString`, `arrIncludes`, `arrIncludesAll`, `arrIncludesSome`, `equals`, `weakEquals`, `inNumberRange`, `inDateRange`, and case-sensitive variants |
| `aggregationFns` | 9 aggregation functions: `sum`, `min`, `max`, `extent`, `mean`, `median`, `unique`, `uniqueCount`, `count` |

### Utilities

| Export | Description |
|---|---|
| `functionalUpdate(updater, old)` | Apply an `Updater<T>` (value or function) to a previous value |
| `memo(deps, fn, opts)` | Memoization helper with dependency tracking |
| `makeStateUpdater(key, table)` | Create a state slice updater function |

### Event System

| Export | Description |
|---|---|
| `EventEmitterImpl` | Typed event emitter with `on`, `off`, `emit`, `removeAllListeners` |

## Basic Usage

```typescript
import { createTable, createColumnHelper } from '@yable/core'

interface Person {
  name: string
  age: number
  email: string
}

// Define columns
const columnHelper = createColumnHelper<Person>()
const columns = [
  columnHelper.accessor('name', { header: 'Name', enableSorting: true }),
  columnHelper.accessor('age', { header: 'Age', enableSorting: true }),
  columnHelper.accessor('email', { header: 'Email' }),
]

// Create data
const data: Person[] = [
  { name: 'Alice', age: 32, email: 'alice@example.com' },
  { name: 'Bob', age: 27, email: 'bob@example.com' },
]

// Create table
const table = createTable({
  data,
  columns,
  state: {
    sorting: [{ id: 'name', desc: false }],
  },
  onStateChange: (updater) => {
    // Handle state changes (wire to your framework's state management)
    console.log('State changed')
  },
})

// Read the row model
const rows = table.getRowModel().rows
rows.forEach((row) => {
  const cells = row.getVisibleCells()
  cells.forEach((cell) => {
    console.log(cell.column.id, cell.getValue())
  })
})
```

## Row Model Pipeline

The core processes data through a pipeline of row models:

1. **Core Row Model** -- raw `data[]` converted to `Row[]`
2. **Filtered Row Model** -- column filters and global filter applied
3. **Sorted Row Model** -- sorting applied to filtered rows
4. **Paginated Row Model** -- page slice of sorted rows

Each stage is memoized. The final `table.getRowModel()` returns the paginated result.

## Feature Overview

| Feature | Table Option | Column Option |
|---|---|---|
| Sorting | `enableSorting`, `onSortingChange` | `enableSorting`, `sortingFn` |
| Filtering | `enableFilters`, `onColumnFiltersChange`, `onGlobalFilterChange` | `enableColumnFilter`, `filterFn` |
| Pagination | `manualPagination`, `onPaginationChange` | -- |
| Cell Editing | `enableCellEditing`, `onEditCommit` | `editable`, `editConfig` |
| Column Pinning | `enableColumnPinning` | `enablePinning` |
| Column Resizing | `enableColumnResizing`, `columnResizeMode` | `enableResizing` |
| Row Selection | `enableRowSelection`, `onRowSelectionChange` | -- |
| Row Expanding | `enableExpanding`, `getSubRows` | -- |
| Grouping | `enableGrouping`, `onGroupingChange` | `enableGrouping`, `aggregationFn` |
| Visibility | `enableHiding` | `enableHiding` |
| Export | `enableExport` | -- |

See the full [API Reference](../../docs/API.md) and [Feature Documentation](../../docs/FEATURES.md) for details.

## Types

All types are exported from the package entry point:

```typescript
import type {
  Table,
  TableOptions,
  TableState,
  ColumnDef,
  Column,
  Row,
  Cell,
  Header,
  HeaderGroup,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  EditingState,
  // ... and many more
} from '@yable/core'
```

## License

MIT
