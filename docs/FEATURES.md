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

| Option | Type | Default | Description |
|---|---|---|---|
| `enableSorting` | `boolean` | `true` | Enable/disable sorting globally |
| `enableMultiSort` | `boolean` | `true` | Allow sorting by multiple columns |
| `enableSortingRemoval` | `boolean` | `true` | Allow removing sort (third click) |
| `maxMultiSortColCount` | `number` | `Infinity` | Max simultaneous sort columns |
| `manualSorting` | `boolean` | `false` | If true, sorting is handled externally (server-side) |
| `sortDescFirst` | `boolean` | `false` | Start with descending on first click |
| `isMultiSortEvent` | `(e) => boolean` | Shift key | Which modifier key triggers multi-sort |
| `onSortingChange` | `OnChangeFn<SortingState>` | -- | Callback when sorting state changes |

### Column Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableSorting` | `boolean` | `true` | Enable sorting for this column |
| `sortingFn` | `SortingFnOption` | `'auto'` | Sort function name or custom function |
| `sortDescFirst` | `boolean` | `false` | Start descending for this column |
| `invertSorting` | `boolean` | `false` | Invert sort direction |
| `sortUndefined` | `false \| -1 \| 1 \| 'first' \| 'last'` | -- | Where to place `undefined` values |

### Built-in Sorting Functions

| Name | Description |
|---|---|
| `alphanumeric` | Natural sort -- `"item2"` before `"item10"` (case-insensitive) |
| `alphanumericCaseSensitive` | Natural sort (case-sensitive) |
| `text` | Locale-aware string comparison (case-insensitive) |
| `textCaseSensitive` | Locale-aware string comparison (case-sensitive) |
| `datetime` | Sorts Date objects and date strings by timestamp |
| `basic` | Simple `>` / `<` comparison for numbers and strings |

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

| Option | Type | Default | Description |
|---|---|---|---|
| `enableFilters` | `boolean` | `true` | Enable/disable all filtering |
| `enableColumnFilters` | `boolean` | `true` | Enable per-column filters |
| `enableGlobalFilter` | `boolean` | `true` | Enable global search |
| `manualFiltering` | `boolean` | `false` | Handle filtering externally (server-side) |
| `globalFilterFn` | `FilterFnOption` | -- | Custom global filter function |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` | -- | Callback when column filters change |
| `onGlobalFilterChange` | `OnChangeFn<string>` | -- | Callback when global filter changes |

### Column Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableColumnFilter` | `boolean` | `true` | Enable filtering for this column |
| `enableGlobalFilter` | `boolean` | `true` | Include this column in global search |
| `filterFn` | `FilterFnOption` | -- | Filter function name or custom function |

### Built-in Filter Functions

| Name | Description |
|---|---|
| `includesString` | Case-insensitive substring match |
| `includesStringSensitive` | Case-sensitive substring match |
| `equalsString` | Case-insensitive exact string match |
| `equalsStringSensitive` | Case-sensitive exact string match |
| `arrIncludes` | Array contains value |
| `arrIncludesAll` | Array contains all values |
| `arrIncludesSome` | Array contains at least one value |
| `equals` | Strict equality (`===`) |
| `weakEquals` | Loose equality (`==`) |
| `inNumberRange` | Number within `[min, max]` range |
| `inDateRange` | Date within `[start, end]` range |

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
import { GlobalFilter } from '@yable/react'

<GlobalFilter
  table={table}
  placeholder="Search..."
  debounce={300}  // ms delay before applying filter
/>
```

---

## Pagination

Slice the row model into pages with configurable page sizes.

### How to Enable

Pagination is always active by default (page size 10). Configure via `initialState` or controlled state.

### Table Options

| Option | Type | Default | Description |
|---|---|---|---|
| `manualPagination` | `boolean` | `false` | Handle pagination externally (server-side) |
| `pageCount` | `number` | -- | Total page count (for server-side) |
| `rowCount` | `number` | -- | Total row count (for server-side) |
| `autoResetPageIndex` | `boolean` | `true` | Reset to page 0 when data changes |
| `onPaginationChange` | `OnChangeFn<PaginationState>` | -- | Callback when pagination state changes |

### Programmatic Control

```typescript
table.nextPage()
table.previousPage()
table.firstPage()
table.lastPage()
table.setPageIndex(3)
table.setPageSize(25)
table.getCanNextPage()      // boolean
table.getCanPreviousPage()  // boolean
table.getPageCount()        // total pages
table.getRowCount()         // total rows
```

### React: Pagination Component

```tsx
import { Pagination } from '@yable/react'

<Table table={table}>
  <Pagination
    table={table}
    showPageSize       // Show page size dropdown
    pageSizes={[10, 25, 50, 100]}
    showInfo           // Show "1-10 of 50" text
    showFirstLast      // Show first/last page buttons
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
  options?: { label: string; value: unknown }[]   // For 'select' type
  getOptions?: (row: Row) => { label: string; value: unknown }[]  // Dynamic options
  validate?: (value, row) => string | null         // Return error message or null
  parse?: (inputValue: string) => TValue           // Parse input string to typed value
  format?: (value: TValue) => string               // Format value for display
  placeholder?: string
  render?: (props: CellEditRenderProps) => unknown  // Custom editor render
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
table.startEditing(rowId, columnId)   // Enter edit mode on a cell
table.commitEdit()                     // Commit the active edit
table.cancelEdit()                     // Cancel the active edit
table.setPendingValue(rowId, columnId, value)  // Set a pending value
table.getPendingValue(rowId, columnId)         // Read a pending value
table.getAllPendingChanges()            // Get all uncommitted changes
table.hasPendingChanges()              // Check if any changes are pending
table.commitAllPending()               // Commit all pending changes at once
table.discardAllPending()              // Discard all pending changes
table.getValidationErrors()            // Get validation errors
table.isValid()                        // Check if all pending values are valid
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
table.getColumn('name')?.getIsPinned()  // 'left' | 'right' | false

// Set all pinning at once
table.setColumnPinning({ left: ['name', 'id'], right: ['actions'] })

// Check if any columns are pinned
table.getIsSomeColumnsPinned('left')  // boolean
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
  size: 200,       // Default width in px
  minSize: 100,    // Minimum width
  maxSize: 400,    // Maximum width
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
      email: false,  // Hide the email column by default
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
table.getColumn('email')?.getIsVisible()  // boolean
table.getIsAllColumnsVisible()             // boolean
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

| Name | Description |
|---|---|
| `sum` | Sum of numeric values |
| `min` | Minimum numeric value |
| `max` | Maximum numeric value |
| `extent` | `[min, max]` tuple |
| `mean` | Average of numeric values |
| `median` | Median of numeric values |
| `unique` | Array of unique values |
| `uniqueCount` | Count of unique values |
| `count` | Number of rows |

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
  enableRowSelection: true,       // or (row) => boolean for conditional
  enableMultiRowSelection: true,   // Allow selecting multiple rows
  enableSubRowSelection: true,     // Select sub-rows when parent is selected
  onRowSelectionChange: (updater) => { /* handle changes */ },
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
table.getRow('0').getIsSelected()         // boolean
table.getIsAllRowsSelected()               // boolean
table.getIsSomeRowsSelected()              // boolean
table.getIsAllPageRowsSelected()           // boolean
table.getSelectedRowModel()                // RowModel of selected rows

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
table.getRow('0').getIsExpanded()  // boolean
table.getIsAllRowsExpanded()       // boolean
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
table.getTopRows()     // Row[]
table.getBottomRows()  // Row[]
table.getCenterRows()  // Row[] (unpinned rows)
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
row.depth       // 0 for top-level, 1 for children, etc.
row.subRows     // Child rows
row.parentId    // Parent row ID (if nested)
row.getCanExpand()  // true if row has sub-rows
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
- Full pivot table configuration (row fields, column fields, value fields) is being developed
- For the current version, use grouping with aggregation functions to achieve pivot-like views

---

## Undo / Redo

Track edit history and allow users to undo/redo changes.

### How It Works

The editing system tracks pending values. Use `commitAllPending()` to persist changes and `discardAllPending()` to revert:

```typescript
// Make edits
table.setPendingValue('row-1', 'name', 'New Name')
table.setPendingValue('row-1', 'salary', 120000)

// Check for pending changes
table.hasPendingChanges()  // true

// Undo all pending (not yet committed)
table.discardAllPending()

// Or commit all at once
table.commitAllPending()  // triggers onEditCommit callback
```

### Notes

- Full undo/redo with an action stack is planned for a future release
- Currently, "undo" means discarding uncommitted pending values

---

## Clipboard

Copy table data to the clipboard.

### How It Works

Use the `exportData()` method to produce clipboard-ready content:

```typescript
// Copy visible data as CSV
const csv = table.exportData({ format: 'csv' })
navigator.clipboard.writeText(csv)

// Copy all data (ignoring pagination)
const allCsv = table.exportData({ format: 'csv', allRows: true })
navigator.clipboard.writeText(allCsv)

// Copy specific columns
const partial = table.exportData({
  format: 'csv',
  columns: ['name', 'email'],
})
```

### Notes

- Full clipboard integration (paste, cell-range copy) is planned
- Currently, export covers bulk copy operations

---

## Fill Handle

Drag the fill handle at the bottom-right corner of a selected cell to auto-fill adjacent cells with the same value, like in Excel.

### Notes

- Fill handle is in development and will be available in a future release
- The infrastructure (cell editing, pending values) is already in place

---

## Formulas

A spreadsheet-grade formula engine with 80+ functions, an expression parser, evaluator, and dependency tracker.

### Capabilities

- **80+ functions** across math, statistics, text, date, logical, lookup, and financial categories
- **Expression parser** that handles cell references, ranges, and nested function calls
- **Dependency tracking** with automatic recalculation when referenced cells change
- **Circular reference detection** to prevent infinite loops

### Notes

- The formula engine is included in `@yable/core` and works with any adapter
- Full documentation for the formula API is coming in a dedicated guide
- This feature is FREE under MIT -- AG Grid does not offer a formula engine at any price

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

| Option | Type | Default | Description |
|---|---|---|---|
| `format` | `'csv' \| 'json'` | `'json'` | Output format |
| `allRows` | `boolean` | `false` | Include all rows (ignore pagination) |
| `columns` | `string[]` | -- | Specific column IDs to include (default: all visible) |
| `includeHeaders` | `boolean` | -- | Include column headers in output |
| `delimiter` | `string` | `','` | CSV delimiter |
| `fileName` | `string` | -- | Suggested file name |

---

## Event System

Yable includes a typed event emitter for responding to table interactions.

### Available Events

| Event | Payload | Description |
|---|---|---|
| `cell:click` | `CellClickEvent` | Cell was clicked |
| `cell:dblclick` | `CellClickEvent` | Cell was double-clicked |
| `cell:contextmenu` | `CellClickEvent` | Cell right-click |
| `row:click` | `RowClickEvent` | Row was clicked |
| `row:dblclick` | `RowClickEvent` | Row was double-clicked |
| `row:contextmenu` | `RowClickEvent` | Row right-click |
| `header:click` | `HeaderClickEvent` | Header cell was clicked |
| `header:contextmenu` | `HeaderClickEvent` | Header right-click |
| `cell:edit:start` | `CellEditEvent` | Cell entered edit mode |
| `cell:edit:commit` | `CellEditEvent` | Cell edit was committed |
| `cell:edit:cancel` | `CellEditEvent` | Cell edit was cancelled |
| `selection:change` | `SelectionChangeEvent` | Row selection changed |
| `sort:change` | `SortChangeEvent` | Sorting changed |
| `filter:change` | `FilterChangeEvent` | Filters changed |
| `page:change` | `PageChangeEvent` | Pagination changed |
| `state:change` | `StateChangeEvent` | Any state changed |

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

Internationalization support for table UI strings.

### Notes

- i18n infrastructure is being developed
- Built-in components use English strings by default
- Custom text can be passed via props (`emptyMessage`, `placeholder`, etc.)
- Full locale support is planned for a future release
