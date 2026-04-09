# Feature Documentation

Detailed guide for every Yable feature. Each section explains what the feature does, how to enable it, a code example, and relevant notes.

---

## Table of Contents

- [Sorting](#sorting)
- [Filtering](#filtering)
- [Pagination](#pagination)
- [Cell Editing](#cell-editing)
- [Column Pinning](#column-pinning)
- [Column Resizing](#column-resizing)
- [Column Visibility](#column-visibility)
- [Column Ordering](#column-ordering)
- [Column Grouping](#column-grouping)
- [Aggregation](#aggregation)
- [Row Selection](#row-selection)
- [Row Expanding / Master-Detail](#row-expanding--master-detail)
- [Row Pinning](#row-pinning)
- [Tree Data](#tree-data)
- [Pivot Tables](#pivot-tables)
- [Undo / Redo](#undo--redo)
- [Clipboard](#clipboard)
- [Fill Handle](#fill-handle)
- [Formulas](#formulas)
- [Async Cell Commits](#async-cell-commits)
- [Export](#export)
- [Event System](#event-system)
- [i18n](#i18n)

---

## Sorting

Sort rows by one or more columns. Click a header to cycle through ascending, descending, and unsorted. Hold Shift to add multi-column sorts.

### How to Enable

Sorting is enabled by default at the table level (`enableSorting: true`). Enable it per column:

```typescript
columnHelper.accessor('name', {
  header: 'Name',
  enableSorting: true,
})
```

### Table Options

| Option                 | Type                       | Default    | Description                                          |
| ---------------------- | -------------------------- | ---------- | ---------------------------------------------------- |
| `enableSorting`        | `boolean`                  | `true`     | Enable/disable sorting globally                      |
| `enableMultiSort`      | `boolean`                  | `true`     | Allow sorting by multiple columns                    |
| `enableSortingRemoval` | `boolean`                  | `true`     | Allow removing sort (third click)                    |
| `maxMultiSortColCount` | `number`                   | `Infinity` | Max simultaneous sort columns                        |
| `manualSorting`        | `boolean`                  | `false`    | If true, sorting is handled externally (server-side) |
| `sortDescFirst`        | `boolean`                  | `false`    | Start with descending on first click                 |
| `isMultiSortEvent`     | `(e) => boolean`           | Shift key  | Which modifier key triggers multi-sort               |
| `onSortingChange`      | `OnChangeFn<SortingState>` | --         | Callback when sorting state changes                  |

### Column Options

| Option          | Type                                    | Default  | Description                           |
| --------------- | --------------------------------------- | -------- | ------------------------------------- |
| `enableSorting` | `boolean`                               | `true`   | Enable sorting for this column        |
| `sortingFn`     | `SortingFnOption`                       | `'auto'` | Sort function name or custom function |
| `sortDescFirst` | `boolean`                               | `false`  | Start descending for this column      |
| `invertSorting` | `boolean`                               | `false`  | Invert sort direction                 |
| `sortUndefined` | `false \| -1 \| 1 \| 'first' \| 'last'` | --       | Where to place `undefined` values     |

### Built-in Sorting Functions

| Name                        | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `alphanumeric`              | Natural sort -- `"item2"` before `"item10"` (case-insensitive) |
| `alphanumericCaseSensitive` | Natural sort (case-sensitive)                                  |
| `text`                      | Locale-aware string comparison (case-insensitive)              |
| `textCaseSensitive`         | Locale-aware string comparison (case-sensitive)                |
| `datetime`                  | Sorts Date objects and date strings by timestamp               |
| `basic`                     | Simple `>` / `<` comparison for numbers and strings            |

### Custom Sort Function

```typescript
columnHelper.accessor('priority', {
  header: 'Priority',
  sortingFn: (rowA, rowB, columnId) => {
    const order = { high: 3, medium: 2, low: 1 }
    const a = order[rowA.getValue<string>(columnId)] ?? 0
    const b = order[rowB.getValue<string>(columnId)] ?? 0
    return a - b
  },
})
```

### Programmatic Control

```typescript
// Set sorting
table.setSorting([{ id: 'name', desc: false }])

// Add a sort column
table.setSorting((prev) => [...prev, { id: 'age', desc: true }])

// Reset to no sorting
table.resetSorting(true)

// Toggle sort on a specific column
table.getColumn('name')?.toggleSorting()

// Check if a column is sorted
const direction = table.getColumn('name')?.getIsSorted() // 'asc' | 'desc' | false
```

---

## Filtering

Filter rows with per-column filters and/or a global search across all columns.

### How to Enable

Filtering is enabled by default. Use `setColumnFilters` or `setGlobalFilter` to apply filters.

### Table Options

| Option                  | Type                             | Default | Description                               |
| ----------------------- | -------------------------------- | ------- | ----------------------------------------- |
| `enableFilters`         | `boolean`                        | `true`  | Enable/disable all filtering              |
| `enableColumnFilters`   | `boolean`                        | `true`  | Enable per-column filters                 |
| `enableGlobalFilter`    | `boolean`                        | `true`  | Enable global search                      |
| `manualFiltering`       | `boolean`                        | `false` | Handle filtering externally (server-side) |
| `globalFilterFn`        | `FilterFnOption`                 | --      | Custom global filter function             |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` | --      | Callback when column filters change       |
| `onGlobalFilterChange`  | `OnChangeFn<string>`             | --      | Callback when global filter changes       |

### Column Options

| Option               | Type             | Default | Description                             |
| -------------------- | ---------------- | ------- | --------------------------------------- |
| `enableColumnFilter` | `boolean`        | `true`  | Enable filtering for this column        |
| `enableGlobalFilter` | `boolean`        | `true`  | Include this column in global search    |
| `filterFn`           | `FilterFnOption` | --      | Filter function name or custom function |

### Built-in Filter Functions

| Name                      | Description                         |
| ------------------------- | ----------------------------------- |
| `includesString`          | Case-insensitive substring match    |
| `includesStringSensitive` | Case-sensitive substring match      |
| `equalsString`            | Case-insensitive exact string match |
| `equalsStringSensitive`   | Case-sensitive exact string match   |
| `arrIncludes`             | Array contains value                |
| `arrIncludesAll`          | Array contains all values           |
| `arrIncludesSome`         | Array contains at least one value   |
| `equals`                  | Strict equality (`===`)             |
| `weakEquals`              | Loose equality (`==`)               |
| `inNumberRange`           | Number within `[min, max]` range    |
| `inDateRange`             | Date within `[start, end]` range    |

### Examples

```typescript
// Column filter -- show only "Engineering" department
table.setColumnFilters([{ id: 'department', value: 'Engineering' }])

// Multiple column filters
table.setColumnFilters([
  { id: 'department', value: 'Engineering' },
  { id: 'salary', value: [100000, 150000] }, // with inNumberRange filter
])

// Global filter -- search across all columns
table.setGlobalFilter('alice')

// Clear all filters
table.resetColumnFilters(true)
table.resetGlobalFilter(true)
```

### Custom Filter Function

```typescript
columnHelper.accessor('tags', {
  header: 'Tags',
  filterFn: (row, columnId, filterValue) => {
    const tags = row.getValue<string[]>(columnId)
    return tags.some((tag) => tag.toLowerCase().includes(String(filterValue).toLowerCase()))
  },
})
```

### React: GlobalFilter Component

```tsx
import { GlobalFilter } from '@zvndev/yable-react'

;<GlobalFilter
  table={table}
  placeholder="Search..."
  debounce={300} // ms delay before applying filter
/>
```

---

## Pagination

Slice the row model into pages with configurable page sizes.

### How to Enable

Pagination is always active by default (page size 10). Configure via `initialState` or controlled state.

### Table Options

| Option               | Type                          | Default | Description                                |
| -------------------- | ----------------------------- | ------- | ------------------------------------------ |
| `manualPagination`   | `boolean`                     | `false` | Handle pagination externally (server-side) |
| `pageCount`          | `number`                      | --      | Total page count (for server-side)         |
| `rowCount`           | `number`                      | --      | Total row count (for server-side)          |
| `autoResetPageIndex` | `boolean`                     | `true`  | Reset to page 0 when data changes          |
| `onPaginationChange` | `OnChangeFn<PaginationState>` | --      | Callback when pagination state changes     |

### Programmatic Control

```typescript
table.nextPage()
table.previousPage()
table.firstPage()
table.lastPage()
table.setPageIndex(3)
table.setPageSize(25)
table.getCanNextPage() // boolean
table.getCanPreviousPage() // boolean
table.getPageCount() // total pages
table.getRowCount() // total rows
```

### React: Pagination Component

```tsx
import { Pagination } from '@zvndev/yable-react'

;<Table table={table}>
  <Pagination
    table={table}
    showPageSize // Show page size dropdown
    pageSizes={[10, 25, 50, 100]}
    showInfo // Show "1-10 of 50" text
    showFirstLast // Show first/last page buttons
  />
</Table>
```

---

## Cell Editing

Edit cell values inline with validation, formatting, and multiple input types.

### How to Enable

1. Set `enableCellEditing: true` on the table options
2. Set `editable: true` on columns that should be editable
3. Provide an `editConfig` with the editor type
4. Handle commits via `onEditCommit`

### Edit Config

```typescript
interface CellEditConfig {
  type: 'text' | 'number' | 'select' | 'toggle' | 'date' | 'checkbox' | 'custom'
  options?: { label: string; value: unknown }[] // For 'select' type
  getOptions?: (row: Row) => { label: string; value: unknown }[] // Dynamic options
  validate?: (value, row) => string | null // Return error message or null
  parse?: (inputValue: string) => TValue // Parse input string to typed value
  format?: (value: TValue) => string // Format value for display
  placeholder?: string
  render?: (props: CellEditRenderProps) => unknown // Custom editor render
}
```

### Example

```typescript
const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    editable: true,
    editConfig: {
      type: 'text',
      placeholder: 'Enter name...',
      validate: (value) => {
        if (!value) return 'Required'
        if (String(value).length < 2) return 'Too short'
        return null
      },
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    editable: true,
    editConfig: {
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
      ],
    },
  }),
  columnHelper.accessor('approved', {
    header: 'Approved',
    editable: true,
    editConfig: { type: 'toggle' },
  }),
]

const table = useTable({
  data,
  columns,
  enableCellEditing: true,
  onEditCommit: (changes) => {
    // changes: Record<rowId, Partial<TData>>
    console.log('Committed:', changes)
  },
})
```

### Table Methods

```typescript
table.startEditing(rowId, columnId) // Enter edit mode on a cell
table.commitEdit() // Commit the active edit
table.cancelEdit() // Cancel the active edit
table.setPendingValue(rowId, columnId, value) // Set a pending value
table.getPendingValue(rowId, columnId) // Read a pending value
table.getAllPendingChanges() // Get all uncommitted changes
table.hasPendingChanges() // Check if any changes are pending
table.commitAllPending() // Commit all pending changes at once
table.discardAllPending() // Discard all pending changes
table.getValidationErrors() // Get validation errors
table.isValid() // Check if all pending values are valid
```

### Always-Editable Cells

To make a cell always show its editor (like a spreadsheet), set `alwaysEditable` in the column meta:

```typescript
columnHelper.accessor('quantity', {
  header: 'Qty',
  editable: true,
  editConfig: { type: 'number' },
  meta: { alwaysEditable: true },
})
```

---

## Column Pinning

Freeze columns to the left or right edge of the table so they remain visible during horizontal scrolling.

### How to Enable

```typescript
const table = useTable({
  data,
  columns,
  enableColumnPinning: true,
  initialState: {
    columnPinning: {
      left: ['name'],
      right: ['actions'],
    },
  },
})
```

### Column Option

```typescript
columnHelper.accessor('name', {
  header: 'Name',
  enablePinning: true,
})
```

### Programmatic Control

```typescript
// Pin a column to the left
table.getColumn('name')?.pin('left')

// Pin to the right
table.getColumn('actions')?.pin('right')

// Unpin
table.getColumn('name')?.pin(false)

// Check pin status
table.getColumn('name')?.getIsPinned() // 'left' | 'right' | false

// Set all pinning at once
table.setColumnPinning({ left: ['name', 'id'], right: ['actions'] })

// Check if any columns are pinned
table.getIsSomeColumnsPinned('left') // boolean
```

---

## Column Resizing

Drag column borders to resize columns.

### How to Enable

```typescript
const table = useTable({
  data,
  columns,
  enableColumnResizing: true,
  columnResizeMode: 'onChange', // or 'onEnd'
  columnResizeDirection: 'ltr', // or 'rtl'
})
```

### Column Option

```typescript
columnHelper.accessor('name', {
  header: 'Name',
  size: 200, // Default width in px
  minSize: 100, // Minimum width
  maxSize: 400, // Maximum width
  enableResizing: true,
})
```

### Notes

- `columnResizeMode: 'onChange'` updates widths as the user drags
- `columnResizeMode: 'onEnd'` only updates when the user releases the mouse
- The `table.getTotalSize()` method returns the total width of all visible columns

---

## Column Visibility

Show or hide columns dynamically.

### How to Enable

```typescript
const table = useTable({
  data,
  columns,
  enableHiding: true,
  initialState: {
    columnVisibility: {
      email: false, // Hide the email column by default
    },
  },
})
```

### Programmatic Control

```typescript
// Hide a column
table.getColumn('email')?.toggleVisibility(false)

// Show a column
table.getColumn('email')?.toggleVisibility(true)

// Toggle visibility
table.getColumn('email')?.toggleVisibility()

// Show/hide all
table.toggleAllColumnsVisible(true)
table.toggleAllColumnsVisible(false)

// Check visibility
table.getColumn('email')?.getIsVisible() // boolean
table.getIsAllColumnsVisible() // boolean
```

---

## Column Ordering

Reorder columns programmatically.

### How to Enable

```typescript
const table = useTable({
  data,
  columns,
  initialState: {
    columnOrder: ['name', 'department', 'salary'],
  },
})
```

### Programmatic Control

```typescript
// Set column order
table.setColumnOrder(['name', 'department', 'salary', 'startDate'])

// Reorder via updater function
table.setColumnOrder((prev) => {
  const next = [...prev]
  // Swap first two columns
  ;[next[0], next[1]] = [next[1]!, next[0]!]
  return next
})

// Reset to original order
table.resetColumnOrder(true)
```

---

## Column Grouping

Group rows by column values. When grouping is active, rows with the same value in the grouped column are collapsed under a group header row.

### How to Enable

```typescript
const table = useTable({
  data,
  columns,
  enableGrouping: true,
  initialState: {
    grouping: ['department'], // Group by department
  },
})
```

### Column Option

```typescript
columnHelper.accessor('department', {
  header: 'Department',
  enableGrouping: true,
  getGroupingValue: (row) => row.department, // Custom grouping value
})
```

### Programmatic Control

```typescript
// Set grouping
table.setGrouping(['department'])

// Multi-level grouping
table.setGrouping(['department', 'status'])

// Toggle grouping on a column
table.getColumn('department')?.toggleGrouping()

// Clear grouping
table.resetGrouping(true)
```

---

## Aggregation

Calculate summary values for grouped rows. Aggregation functions run on each group's leaf rows.

### Built-in Aggregation Functions

| Name          | Description               |
| ------------- | ------------------------- |
| `sum`         | Sum of numeric values     |
| `min`         | Minimum numeric value     |
| `max`         | Maximum numeric value     |
| `extent`      | `[min, max]` tuple        |
| `mean`        | Average of numeric values |
| `median`      | Median of numeric values  |
| `unique`      | Array of unique values    |
| `uniqueCount` | Count of unique values    |
| `count`       | Number of rows            |

### How to Use

```typescript
columnHelper.accessor('salary', {
  header: 'Salary',
  aggregationFn: 'sum',
  aggregatedCell: ({ getValue }) => `Total: $${getValue().toLocaleString()}`,
})
```

### Custom Aggregation

```typescript
columnHelper.accessor('salary', {
  header: 'Salary',
  aggregationFn: (columnId, leafRows, childRows) => {
    const values = leafRows.map((row) => row.getValue<number>(columnId))
    return values.reduce((sum, val) => sum + val, 0) / values.length
  },
  aggregatedCell: ({ getValue }) => `Avg: $${getValue().toLocaleString()}`,
})
```

---

## Row Selection

Select rows with single-click or checkboxes. Supports single selection, multi-selection, and sub-row selection.

### How to Enable

```typescript
const table = useTable({
  data,
  columns,
  enableRowSelection: true, // or (row) => boolean for conditional
  enableMultiRowSelection: true, // Allow selecting multiple rows
  enableSubRowSelection: true, // Select sub-rows when parent is selected
  onRowSelectionChange: (updater) => {
    /* handle changes */
  },
})
```

### Programmatic Control

```typescript
// Select a row
table.getRow('0').toggleSelected(true)

// Toggle
table.getRow('0').toggleSelected()

// Select all rows on current page
table.toggleAllPageRowsSelected(true)

// Select all rows (all pages)
table.toggleAllRowsSelected(true)

// Check selection state
table.getRow('0').getIsSelected() // boolean
table.getIsAllRowsSelected() // boolean
table.getIsSomeRowsSelected() // boolean
table.getIsAllPageRowsSelected() // boolean
table.getSelectedRowModel() // RowModel of selected rows

// Clear selection
table.resetRowSelection(true)
```

### Selection Column Pattern

Add a checkbox column for row selection:

```typescript
columnHelper.display({
  id: 'selection',
  header: ({ table }) => (
    <input
      type="checkbox"
      checked={table.getIsAllPageRowsSelected()}
      onChange={table.toggleAllPageRowsSelected}
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={row.getToggleSelectedHandler()}
    />
  ),
})
```

---

## Row Expanding / Master-Detail

Expand rows to show detail content below them. Useful for master-detail patterns.

### How to Enable

```typescript
const table = useTable({
  data,
  columns,
  enableExpanding: true,
  renderDetailPanel: (row) => (
    <div>
      <h3>Details for {row.original.name}</h3>
      <p>Email: {row.original.email}</p>
    </div>
  ),
})
```

### Programmatic Control

```typescript
// Expand a row
table.getRow('0').toggleExpanded(true)

// Expand all rows
table.toggleAllRowsExpanded(true)

// Collapse all
table.toggleAllRowsExpanded(false)

// Check expansion state
table.getRow('0').getIsExpanded() // boolean
table.getIsAllRowsExpanded() // boolean
```

---

## Row Pinning

Pin rows to the top or bottom of the table so they remain visible when scrolling.

### How to Enable

```typescript
const table = useTable({
  data,
  columns,
  enableRowPinning: true,
})
```

### Programmatic Control

```typescript
// Pin a row to the top
table.getRow('0').pin('top')

// Pin to the bottom
table.getRow('0').pin('bottom')

// Unpin
table.getRow('0').pin(false)

// Get pinned rows
table.getTopRows() // Row[]
table.getBottomRows() // Row[]
table.getCenterRows() // Row[] (unpinned rows)
```

---

## Tree Data

Display hierarchical/nested data with expand/collapse controls. Rows can have sub-rows, forming a tree structure.

### How to Enable

Provide a `getSubRows` function that returns child rows:

```typescript
interface FileNode {
  name: string
  size: number
  children?: FileNode[]
}

const data: FileNode[] = [
  {
    name: 'src',
    size: 0,
    children: [
      { name: 'index.ts', size: 1200 },
      { name: 'utils.ts', size: 850 },
      {
        name: 'components',
        size: 0,
        children: [
          { name: 'Table.tsx', size: 2400 },
          { name: 'Cell.tsx', size: 1100 },
        ],
      },
    ],
  },
  { name: 'package.json', size: 500 },
]

const table = useTable({
  data,
  columns,
  getSubRows: (row) => row.children,
  enableExpanding: true,
})
```

### Row Properties

```typescript
row.depth // 0 for top-level, 1 for children, etc.
row.subRows // Child rows
row.parentId // Parent row ID (if nested)
row.getCanExpand() // true if row has sub-rows
```

---

## Pivot Tables

Transform flat data into cross-tabulated views. This is a premium feature in most competitors -- Yable includes it for free under MIT.

### How to Enable

Pivot tables are built on top of grouping and aggregation. Configure row groups, column groups, and value aggregations:

```typescript
const table = useTable({
  data,
  columns,
  enableGrouping: true,
  initialState: {
    grouping: ['region', 'category'], // Row grouping
  },
})
```

### Notes

- Pivot tables build on the grouping + aggregation features
- A full `PivotEngine` with row fields, column fields, value fields, subtotals, and grand totals is exported from `@zvndev/yable-core` (`PivotEngine`, `getPivotRowModel`, `generatePivotColumnDefs`, `getInitialPivotState`, `PivotConfig`)
- You can also fall back to plain grouping + aggregation for lighter-weight pivot-style views

---

## Undo / Redo

Track edit history and allow users to undo/redo changes.

### How It Works

Yable ships a real `UndoStack` that records `cell-edit` actions and supports push/undo/redo with a configurable stack size. It is exported from `@zvndev/yable-core` alongside `createUndoRedoIntegration` for wiring it into a table instance.

```typescript
import { UndoStack } from '@zvndev/yable-core'

const stack = new UndoStack(50) // maxSize = 50 actions

stack.push({
  type: 'cell-edit',
  rowId: 'row-1',
  columnId: 'name',
  oldValue: 'Alice',
  newValue: 'Alice Johnson',
  timestamp: Date.now(),
})

const undone = stack.undo() // UndoAction | undefined — moves to redo stack
const redone = stack.redo() // UndoAction | undefined — moves back to undo stack
```

### Pending-value "undo"

For transient, uncommitted edits, the editing system also lets you discard or commit pending values without touching the undo stack:

```typescript
table.setPendingValue('row-1', 'name', 'New Name')
table.hasPendingChanges() // true
table.discardAllPending() // drop uncommitted edits
table.commitAllPending() // persist via onEditCommit
```

---

## Clipboard

Copy, cut, and paste table data with configurable delimiters. Defaults to tab-separated values for Excel compatibility.

### Core primitives

The core package exports `serializeCells`, `parseClipboardText`, and related helpers from `packages/core/src/features/clipboard.ts`. Use them directly, or drive clipboard interactions from the React hook `useClipboard` in `@zvndev/yable-react`.

```typescript
import { serializeCells } from '@zvndev/yable-core'

// Serialize selected rows/columns to clipboard text (TSV by default)
const text = serializeCells(selectedRows, selectedColumns, {
  delimiter: '\t',
  rowDelimiter: '\n',
  includeHeaders: false,
})
await navigator.clipboard.writeText(text)
```

### Bulk export (CSV/JSON)

For bulk copy operations outside of a selection, `exportData()` is the simpler path:

```typescript
const csv = table.exportData({ format: 'csv' })
navigator.clipboard.writeText(csv)

const allCsv = table.exportData({ format: 'csv', allRows: true })
navigator.clipboard.writeText(allCsv)

const partial = table.exportData({
  format: 'csv',
  columns: ['name', 'email'],
})
```

---

## Fill Handle

Drag the fill handle at the bottom-right corner of a selected cell to auto-fill adjacent cells, like in Excel. Pattern detection supports constants, arithmetic sequences, date sequences, and repeating values.

### Core primitives

The fill handle logic lives in `packages/core/src/features/fillHandle.ts`. The React hook `useFillHandle` in `@zvndev/yable-react` wires it into a live table.

```typescript
import { detectPattern } from '@zvndev/yable-core'

// Detect a pattern from source values, then project it over the destination range
const pattern = detectPattern([1, 2, 3])
// -> { type: 'sequence', start: 1, step: 1 }
```

### Notes

- Supported patterns: `constant`, `sequence` (numeric), `date-sequence`, and `repeat`
- Fully covered by `packages/core/src/features/__tests__/fillHandle.test.ts`

---

## Formulas

A spreadsheet-grade formula engine with 17 built-in functions (extensible), an expression parser, evaluator, and dependency tracker.

### Capabilities

- **17 built-in functions** across math, statistics, text, and logical categories (extensible with custom functions)
- **Expression parser** that handles cell references, ranges, and nested function calls
- **Dependency tracking** with automatic recalculation when referenced cells change
- **Circular reference detection** to prevent infinite loops

### Notes

- The formula engine is included in `@zvndev/yable-core` and works with any adapter
- Built-in functions: `SUM`, `AVG`, `COUNT`, `COUNTA`, `MIN`, `MAX`, `IF`, `CONCAT`, `ROUND`, `ABS`, `FLOOR`, `CEILING`, `POWER`, `SQRT`, `LEN`, `UPPER`, `LOWER` (plus aliases `AVERAGE`, `CONCATENATE`, `CEIL`, `POW`)
- Register custom functions via the formula engine API
- This feature is FREE under MIT -- AG Grid requires an Enterprise license for formula support

---

## Async Cell Commits

Save cell edits to a backend with built-in optimistic updates, error handling, retry, and conflict detection. No other React grid ships this feature.

### How to Use

```typescript
import { createColumnHelper } from '@zvndev/yable-core'
import { CommitError } from '@zvndev/yable-core'

const table = useTable({
  data,
  columns,
  enableCellEditing: true,
  autoCommit: true, // fire onCommit after each edit (default)
  onCommit: async (patches) => {
    // patches is CellPatch[] — one per edited cell
    const res = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(
        patches.map((p) => ({
          rowId: p.rowId,
          column: p.columnId,
          value: p.value,
        })),
      ),
      signal: patches[0].signal, // wire abort signal
    })

    if (!res.ok) {
      // Throw CommitError for per-cell error messages
      throw new CommitError({
        [patches[0].rowId]: {
          [patches[0].columnId]: 'Server rejected the update',
        },
      })
    }
  },
})
```

### Cell Status Lifecycle

Each cell has a status: `idle` | `pending` | `error` | `conflict`.

| Status     | Meaning                        | Cell renders                           |
| ---------- | ------------------------------ | -------------------------------------- |
| `idle`     | No in-flight commit            | Saved value                            |
| `pending`  | Commit in flight               | Pending value + spinner                |
| `error`    | Commit failed                  | Pending value + error badge with retry |
| `conflict` | Saved value changed underneath | Pending value + conflict indicator     |

### Table Options

| Option               | Type                  | Default    | Description                                                                     |
| -------------------- | --------------------- | ---------- | ------------------------------------------------------------------------------- |
| `onCommit`           | `OnCommitFn<TData>`   | --         | Async handler for saving cell edits. Resolve = success, throw = failure.        |
| `autoCommit`         | `boolean`             | `true`     | Fire `onCommit` after each edit; if `false`, batch edits until `table.commit()` |
| `rowCommitRetryMode` | `'failed' \| 'batch'` | `'failed'` | On retry: resend only failed cells or entire batch                              |

### Table API

| Method                              | Return                | Description                                         |
| ----------------------------------- | --------------------- | --------------------------------------------------- |
| `getCellStatus(rowId, colId)`       | `CellStatus`          | Get commit status of a cell                         |
| `getCellRenderValue(rowId, colId)`  | `unknown`             | Get display value (pending or saved)                |
| `getCellErrorMessage(rowId, colId)` | `string \| undefined` | Get error message for failed cell                   |
| `getCellConflictWith(rowId, colId)` | `unknown`             | Get conflicting server value                        |
| `commit()`                          | `Promise<void>`       | Commit all pending edits (when `autoCommit: false`) |
| `retryCommit(rowId, colId)`         | `Promise<void>`       | Retry a failed commit                               |
| `dismissCommit(rowId, colId)`       | `void`                | Dismiss an error/conflict and revert                |
| `dismissAllCommits()`               | `void`                | Dismiss all errors/conflicts                        |

### Per-Column Commit Handler

Override the table-level `onCommit` for specific columns:

```typescript
columnHelper.accessor('price', {
  header: 'Price',
  editable: true,
  commit: async (patch) => {
    await updatePrice(patch.rowId, patch.value)
  },
})
```

### What Yable Handles Automatically

- **Stale settlement** -- older in-flight commits are silently dropped if a newer commit lands first
- **Auto-clear** -- when refetched data matches the pending value, the pending state clears automatically
- **Orphaned GC** -- if a row disappears while a commit is in flight, the record is cleaned up
- **Conflict detection** -- if the saved value changes between dispatch and settlement, the cell enters `conflict` status
- **Abort signals** -- each patch carries an `AbortSignal` that fires when a newer edit supersedes it

### Notes

- See the [Async Commits Consumer Guide](./async-commits.md) for a full walkthrough
- The `@zvndev/yable-react` adapter renders cell status badges automatically via `<TableCell>`
- Conflict resolution is left to the consumer -- dismiss to revert, or apply the pending value again

---

## Export

Export table data to CSV or JSON format.

### How to Use

```typescript
// Export as JSON
const json = table.exportData({ format: 'json' })

// Export as CSV
const csv = table.exportData({ format: 'csv' })

// Export all rows (not just current page)
const all = table.exportData({ format: 'csv', allRows: true })

// Export specific columns
const partial = table.exportData({
  format: 'csv',
  columns: ['name', 'email', 'department'],
})
```

### ExportOptions

| Option           | Type              | Default  | Description                                           |
| ---------------- | ----------------- | -------- | ----------------------------------------------------- |
| `format`         | `'csv' \| 'json'` | `'json'` | Output format                                         |
| `allRows`        | `boolean`         | `false`  | Include all rows (ignore pagination)                  |
| `columns`        | `string[]`        | --       | Specific column IDs to include (default: all visible) |
| `includeHeaders` | `boolean`         | --       | Include column headers in output                      |
| `delimiter`      | `string`          | `','`    | CSV delimiter                                         |
| `fileName`       | `string`          | --       | Suggested file name                                   |

---

## Event System

Yable includes a typed event emitter for responding to table interactions.

### Available Events

| Event                | Payload                | Description             |
| -------------------- | ---------------------- | ----------------------- |
| `cell:click`         | `CellClickEvent`       | Cell was clicked        |
| `cell:dblclick`      | `CellClickEvent`       | Cell was double-clicked |
| `cell:contextmenu`   | `CellClickEvent`       | Cell right-click        |
| `row:click`          | `RowClickEvent`        | Row was clicked         |
| `row:dblclick`       | `RowClickEvent`        | Row was double-clicked  |
| `row:contextmenu`    | `RowClickEvent`        | Row right-click         |
| `header:click`       | `HeaderClickEvent`     | Header cell was clicked |
| `header:contextmenu` | `HeaderClickEvent`     | Header right-click      |
| `cell:edit:start`    | `CellEditEvent`        | Cell entered edit mode  |
| `cell:edit:commit`   | `CellEditEvent`        | Cell edit was committed |
| `cell:edit:cancel`   | `CellEditEvent`        | Cell edit was cancelled |
| `selection:change`   | `SelectionChangeEvent` | Row selection changed   |
| `sort:change`        | `SortChangeEvent`      | Sorting changed         |
| `filter:change`      | `FilterChangeEvent`    | Filters changed         |
| `page:change`        | `PageChangeEvent`      | Pagination changed      |
| `state:change`       | `StateChangeEvent`     | Any state changed       |

### How to Use

```typescript
// Subscribe to events
const unsubscribe = table.events.on('cell:click', (event) => {
  console.log('Clicked cell:', event.column.id, event.row.original)
})

// Unsubscribe
unsubscribe()

// Or use off()
table.events.off('cell:click', handler)

// Emit custom events
table.events.emit('cell:click', {
  cell: someCell,
  row: someRow,
  column: someColumn,
})

// Remove all listeners
table.events.removeAllListeners()
```

### Table Callback Options

You can also handle events via table options:

```typescript
const table = useTable({
  data,
  columns,
  onCellClick: (event) => console.log('Cell clicked:', event),
  onRowClick: (event) => console.log('Row clicked:', event),
  onHeaderClick: (event) => console.log('Header clicked:', event),
})
```

---

## i18n

Internationalization support for table UI strings. The core package exports a `YableLocale` interface and helpers for creating and swapping locales.

### How to Use

```typescript
import {
  en,
  createLocale,
  setDefaultLocale,
  getDefaultLocale,
  resetLocale,
} from '@zvndev/yable-core'

// Build a partial override on top of English
const frCa = createLocale(en, {
  paginationPage: 'Page',
  paginationOf: 'de',
  searchPlaceholder: 'Rechercher…',
})

// Make it the new default for any new tables
setDefaultLocale(frCa)

// Read the currently active locale
const current = getDefaultLocale()

// Reset back to built-in English
resetLocale()
```

### Notes

- Default locale is English (`en`) — see `packages/core/src/i18n/en.ts` for the full key list
- Built-in React components (pagination, global filter, etc.) read strings from the active locale
- Custom text can still be passed via component props (`emptyMessage`, `placeholder`, etc.) to override on a per-instance basis
