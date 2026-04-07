# API Reference

Complete reference for all public exports from `@yable/core`.

---

## Table of Contents

- [createTable](#createtable)
- [createColumnHelper](#createcolumnhelper)
- [TableOptions](#tableoptions)
- [Table Instance](#table-instance)
- [Column Instance](#column-instance)
- [Row Instance](#row-instance)
- [Cell Instance](#cell-instance)
- [Header & HeaderGroup](#header--headergroup)
- [State Types](#state-types)
- [Built-in Sorting Functions](#built-in-sorting-functions)
- [Built-in Filter Functions](#built-in-filter-functions)
- [Built-in Aggregation Functions](#built-in-aggregation-functions)
- [Column Definition Types](#column-definition-types)
- [Async Commit Types](#async-commit-types)
- [Event Types](#event-types)
- [Utility Functions](#utility-functions)

---

## createTable

```typescript
function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData>
```

Creates and returns a table instance. This is the main entry point for `@yable/core`. The table instance provides all APIs for reading and manipulating table state.

**Example:**

```typescript
import { createTable, createColumnHelper } from '@yable/core'

const table = createTable({
  data: myData,
  columns: myColumns,
  onStateChange: (updater) => { /* handle state updates */ },
})
```

---

## createColumnHelper

```typescript
function createColumnHelper<TData extends RowData>(): ColumnHelper<TData>
```

Returns a type-safe column definition builder. The helper provides three methods:

### `.accessor(accessorKeyOrFn, options)`

Define a column that reads data from each row.

**Key accessor:**

```typescript
const col = columnHelper.accessor('name', {
  header: 'Name',
  enableSorting: true,
})
// Infers: accessorKey = 'name', value type = TData['name']
```

**Function accessor:**

```typescript
const col = columnHelper.accessor(
  (row) => `${row.firstName} ${row.lastName}`,
  {
    id: 'fullName',
    header: 'Full Name',
  }
)
```

### `.display(options)`

Define a non-data column (actions, checkboxes, etc.). Requires an `id`.

```typescript
const col = columnHelper.display({
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => `<button>Edit ${row.original.name}</button>`,
})
```

### `.group(options)`

Define a column group header that contains child columns.

```typescript
const col = columnHelper.group({
  id: 'contact',
  header: 'Contact Info',
  columns: [
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('phone', { header: 'Phone' }),
  ],
})
```

---

## TableOptions

The configuration object passed to `createTable()` or `useTable()`.

### Required

| Option | Type | Description |
|---|---|---|
| `data` | `TData[]` | The data array to display |
| `columns` | `ColumnDef<TData, any>[]` | Column definitions |

### State Management

| Option | Type | Description |
|---|---|---|
| `state` | `Partial<TableState>` | Controlled state (merged with internal state) |
| `onStateChange` | `OnChangeFn<TableState>` | Called when any state changes |
| `initialState` | `Partial<TableState>` | Initial state values |

### Row Identity

| Option | Type | Default | Description |
|---|---|---|---|
| `getRowId` | `(row, index, parent?) => string` | `String(index)` | Custom row ID generator |

### Sorting Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableSorting` | `boolean` | `true` | Enable sorting globally |
| `enableMultiSort` | `boolean` | `true` | Allow multi-column sorting |
| `enableSortingRemoval` | `boolean` | `true` | Allow removing sort on third click |
| `maxMultiSortColCount` | `number` | `Infinity` | Max simultaneous sort columns |
| `manualSorting` | `boolean` | `false` | Disable client-side sorting (for server-side) |
| `sortingFns` | `Record<string, SortingFn>` | -- | Additional named sorting functions |
| `onSortingChange` | `OnChangeFn<SortingState>` | -- | Sorting state change callback |
| `isMultiSortEvent` | `(e) => boolean` | Shift key | Multi-sort modifier key test |

### Filtering Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableFilters` | `boolean` | `true` | Enable all filtering |
| `enableColumnFilters` | `boolean` | `true` | Enable per-column filters |
| `enableGlobalFilter` | `boolean` | `true` | Enable global search |
| `manualFiltering` | `boolean` | `false` | Disable client-side filtering |
| `filterFns` | `Record<string, FilterFn>` | -- | Additional named filter functions |
| `globalFilterFn` | `FilterFnOption` | -- | Custom global filter function |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` | -- | Column filters change callback |
| `onGlobalFilterChange` | `OnChangeFn<string>` | -- | Global filter change callback |
| `getColumnCanGlobalFilter` | `(column) => boolean` | -- | Per-column global filter opt-out |

### Pagination Options

| Option | Type | Default | Description |
|---|---|---|---|
| `manualPagination` | `boolean` | `false` | Disable client-side pagination |
| `pageCount` | `number` | -- | Total page count (server-side) |
| `rowCount` | `number` | -- | Total row count (server-side) |
| `autoResetPageIndex` | `boolean` | `true` | Reset to page 0 on data change |
| `onPaginationChange` | `OnChangeFn<PaginationState>` | -- | Pagination change callback |

### Selection Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableRowSelection` | `boolean \| (row) => boolean` | `true` | Enable row selection |
| `enableMultiRowSelection` | `boolean \| (row) => boolean` | `true` | Allow selecting multiple rows |
| `enableSubRowSelection` | `boolean \| (row) => boolean` | `true` | Auto-select sub-rows |
| `onRowSelectionChange` | `OnChangeFn<RowSelectionState>` | -- | Selection change callback |

### Visibility Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableHiding` | `boolean` | `true` | Enable column visibility toggling |
| `onColumnVisibilityChange` | `OnChangeFn<VisibilityState>` | -- | Visibility change callback |

### Column Ordering

| Option | Type | Description |
|---|---|---|
| `onColumnOrderChange` | `OnChangeFn<ColumnOrderState>` | Column order change callback |

### Column Pinning

| Option | Type | Default | Description |
|---|---|---|---|
| `enableColumnPinning` | `boolean` | -- | Enable column pinning |
| `onColumnPinningChange` | `OnChangeFn<ColumnPinningState>` | -- | Pinning change callback |

### Column Sizing

| Option | Type | Default | Description |
|---|---|---|---|
| `enableColumnResizing` | `boolean` | `true` | Enable column drag-to-resize |
| `columnResizeMode` | `'onChange' \| 'onEnd'` | `'onChange'` | When to update widths |
| `columnResizeDirection` | `'ltr' \| 'rtl'` | `'ltr'` | Resize direction |
| `onColumnSizingChange` | `OnChangeFn<ColumnSizingState>` | -- | Sizing change callback |
| `onColumnSizingInfoChange` | `OnChangeFn<ColumnSizingInfoState>` | -- | Resize info change callback |

### Expanding Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableExpanding` | `boolean` | `true` | Enable row expanding |
| `getSubRows` | `(row, index) => TData[] \| undefined` | -- | Return child rows for tree data |
| `getRowCanExpand` | `(row) => boolean` | -- | Custom expand-ability check |
| `manualExpanding` | `boolean` | `false` | Disable client-side expansion |
| `paginateExpandedRows` | `boolean` | -- | Include expanded rows in pagination |
| `renderDetailPanel` | `(row) => unknown` | -- | Detail panel renderer |
| `onExpandedChange` | `OnChangeFn<ExpandedState>` | -- | Expanded state change callback |

### Row Pinning Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableRowPinning` | `boolean \| (row) => boolean` | `false` | Enable row pinning |
| `keepPinnedRows` | `boolean` | -- | Keep pinned rows when filtering |
| `onRowPinningChange` | `OnChangeFn<RowPinningState>` | -- | Row pinning change callback |

### Grouping Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableGrouping` | `boolean` | `false` | Enable row grouping |
| `manualGrouping` | `boolean` | `false` | Disable client-side grouping |
| `onGroupingChange` | `OnChangeFn<GroupingState>` | -- | Grouping change callback |

### Cell Editing Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableCellEditing` | `boolean` | -- | Enable cell editing globally |
| `onEditingChange` | `OnChangeFn<EditingState>` | -- | Editing state change callback |
| `onEditCommit` | `(changes: Record<string, Partial<TData>>) => void` | -- | Called when edits are committed |

### Event Handlers

| Option | Type | Description |
|---|---|---|
| `onCellClick` | `(event: CellClickEvent) => void` | Cell click handler |
| `onCellDoubleClick` | `(event: CellClickEvent) => void` | Cell double-click handler |
| `onCellContextMenu` | `(event: CellClickEvent) => void` | Cell right-click handler |
| `onRowClick` | `(event: RowClickEvent) => void` | Row click handler |
| `onRowDoubleClick` | `(event: RowClickEvent) => void` | Row double-click handler |
| `onRowContextMenu` | `(event: RowClickEvent) => void` | Row right-click handler |
| `onHeaderClick` | `(event: HeaderClickEvent) => void` | Header click handler |
| `onHeaderContextMenu` | `(event: HeaderClickEvent) => void` | Header right-click handler |

### Export Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enableExport` | `boolean` | -- | Enable export functionality |

### Styling

| Option | Type | Description |
|---|---|---|
| `rowClassName` | `string \| (row) => string \| undefined` | CSS class for rows |
| `rowStyle` | `CSSProperties \| (row) => CSSProperties` | Inline style for rows |

---

## Table Instance

The object returned by `createTable()` or `useTable()`. All methods are grouped by feature.

### State

| Method | Return | Description |
|---|---|---|
| `getState()` | `TableState` | Get the complete current state |
| `setState(updater)` | `void` | Update the entire state |
| `setOptions(updater)` | `void` | Update table options |
| `reset()` | `void` | Reset all state to initial values |

### Column API

| Method | Return | Description |
|---|---|---|
| `getAllColumns()` | `Column[]` | All columns (including group parents) |
| `getAllFlatColumns()` | `Column[]` | All leaf columns (flat) |
| `getAllLeafColumns()` | `Column[]` | All leaf columns |
| `getColumn(id)` | `Column \| undefined` | Get a column by ID |
| `getVisibleFlatColumns()` | `Column[]` | Visible leaf columns (respecting order/visibility) |
| `getVisibleLeafColumns()` | `Column[]` | Same as `getVisibleFlatColumns()` |
| `getLeftVisibleLeafColumns()` | `Column[]` | Left-pinned visible columns |
| `getRightVisibleLeafColumns()` | `Column[]` | Right-pinned visible columns |
| `getCenterVisibleLeafColumns()` | `Column[]` | Unpinned visible columns |

### Header API

| Method | Return | Description |
|---|---|---|
| `getHeaderGroups()` | `HeaderGroup[]` | All header groups |
| `getLeftHeaderGroups()` | `HeaderGroup[]` | Left-pinned header groups |
| `getRightHeaderGroups()` | `HeaderGroup[]` | Right-pinned header groups |
| `getCenterHeaderGroups()` | `HeaderGroup[]` | Unpinned header groups |
| `getFooterGroups()` | `HeaderGroup[]` | Footer groups (reversed header groups) |
| `getLeftFooterGroups()` | `HeaderGroup[]` | Left-pinned footer groups |
| `getRightFooterGroups()` | `HeaderGroup[]` | Right-pinned footer groups |
| `getCenterFooterGroups()` | `HeaderGroup[]` | Unpinned footer groups |

### Row Model API

| Method | Return | Description |
|---|---|---|
| `getCoreRowModel()` | `RowModel` | Raw data as rows (no filtering/sorting) |
| `getRowModel()` | `RowModel` | Final row model (filtered, sorted, paginated) |
| `getRow(id, searchAll?)` | `Row` | Get a specific row by ID |
| `getFilteredRowModel()` | `RowModel` | Rows after filtering |
| `getPreFilteredRowModel()` | `RowModel` | Rows before filtering (= core model) |
| `getSortedRowModel()` | `RowModel` | Rows after sorting |
| `getPreSortedRowModel()` | `RowModel` | Rows before sorting (= filtered model) |
| `getPaginationRowModel()` | `RowModel` | Rows after pagination |
| `getPrePaginationRowModel()` | `RowModel` | Rows before pagination (= sorted model) |
| `getGroupedRowModel()` | `RowModel` | Rows after grouping |
| `getPreGroupedRowModel()` | `RowModel` | Rows before grouping |
| `getExpandedRowModel()` | `RowModel` | Rows after expansion |
| `getPreExpandedRowModel()` | `RowModel` | Rows before expansion |

### Sorting API

| Method | Return | Description |
|---|---|---|
| `setSorting(updater)` | `void` | Set the sorting state |
| `resetSorting(defaultState?)` | `void` | Reset sorting |

### Filtering API

| Method | Return | Description |
|---|---|---|
| `setColumnFilters(updater)` | `void` | Set column filter state |
| `resetColumnFilters(defaultState?)` | `void` | Reset column filters |
| `setGlobalFilter(updater)` | `void` | Set global filter value |
| `resetGlobalFilter(defaultState?)` | `void` | Reset global filter |

### Pagination API

| Method | Return | Description |
|---|---|---|
| `getPageCount()` | `number` | Total number of pages |
| `getRowCount()` | `number` | Total number of rows |
| `getCanPreviousPage()` | `boolean` | Can navigate to previous page |
| `getCanNextPage()` | `boolean` | Can navigate to next page |
| `previousPage()` | `void` | Go to previous page |
| `nextPage()` | `void` | Go to next page |
| `firstPage()` | `void` | Go to first page |
| `lastPage()` | `void` | Go to last page |
| `setPagination(updater)` | `void` | Set pagination state |
| `setPageIndex(updater)` | `void` | Set page index |
| `setPageSize(size)` | `void` | Set page size |
| `resetPageIndex(defaultState?)` | `void` | Reset page index |
| `resetPageSize(defaultState?)` | `void` | Reset page size |
| `resetPagination(defaultState?)` | `void` | Reset all pagination |

### Selection API

| Method | Return | Description |
|---|---|---|
| `getSelectedRowModel()` | `RowModel` | Model of selected rows |
| `getFilteredSelectedRowModel()` | `RowModel` | Selected rows (filtered) |
| `getGroupedSelectedRowModel()` | `RowModel` | Selected rows (grouped) |
| `getIsAllRowsSelected()` | `boolean` | All rows selected? |
| `getIsSomeRowsSelected()` | `boolean` | Some (but not all) rows selected? |
| `getIsAllPageRowsSelected()` | `boolean` | All current page rows selected? |
| `getIsSomePageRowsSelected()` | `boolean` | Some current page rows selected? |
| `toggleAllRowsSelected(value?)` | `void` | Select/deselect all rows |
| `toggleAllPageRowsSelected(value?)` | `void` | Select/deselect current page rows |
| `setRowSelection(updater)` | `void` | Set row selection state |
| `resetRowSelection(defaultState?)` | `void` | Reset row selection |

### Visibility API

| Method | Return | Description |
|---|---|---|
| `setColumnVisibility(updater)` | `void` | Set column visibility state |
| `resetColumnVisibility(defaultState?)` | `void` | Reset column visibility |
| `toggleAllColumnsVisible(value?)` | `void` | Show/hide all columns |
| `getIsAllColumnsVisible()` | `boolean` | All columns visible? |
| `getIsSomeColumnsVisible()` | `boolean` | Some columns visible? |

### Column Order API

| Method | Return | Description |
|---|---|---|
| `setColumnOrder(updater)` | `void` | Set column order |
| `resetColumnOrder(defaultState?)` | `void` | Reset column order |

### Column Pinning API

| Method | Return | Description |
|---|---|---|
| `setColumnPinning(updater)` | `void` | Set column pinning state |
| `resetColumnPinning(defaultState?)` | `void` | Reset column pinning |
| `getIsSomeColumnsPinned(position?)` | `boolean` | Any columns pinned? |

### Column Sizing API

| Method | Return | Description |
|---|---|---|
| `setColumnSizing(updater)` | `void` | Set column sizing state |
| `setColumnSizingInfo(updater)` | `void` | Set sizing info (resize-in-progress data) |
| `resetColumnSizing(defaultState?)` | `void` | Reset column sizing |
| `getTotalSize()` | `number` | Total width of all visible columns |
| `getLeftTotalSize()` | `number` | Total width of left-pinned columns |
| `getRightTotalSize()` | `number` | Total width of right-pinned columns |
| `getCenterTotalSize()` | `number` | Total width of unpinned columns |

### Expanding API

| Method | Return | Description |
|---|---|---|
| `setExpanded(updater)` | `void` | Set expanded state |
| `toggleAllRowsExpanded(expanded?)` | `void` | Expand/collapse all |
| `resetExpanded(defaultState?)` | `void` | Reset expanded state |
| `getCanSomeRowsExpand()` | `boolean` | Any rows can expand? |
| `getIsAllRowsExpanded()` | `boolean` | All expandable rows expanded? |
| `getIsSomeRowsExpanded()` | `boolean` | Some rows expanded? |
| `getExpandedDepth()` | `number` | Maximum expansion depth |

### Row Pinning API

| Method | Return | Description |
|---|---|---|
| `setRowPinning(updater)` | `void` | Set row pinning state |
| `resetRowPinning(defaultState?)` | `void` | Reset row pinning |
| `getTopRows()` | `Row[]` | Top-pinned rows |
| `getBottomRows()` | `Row[]` | Bottom-pinned rows |
| `getCenterRows()` | `Row[]` | Unpinned rows |

### Grouping API

| Method | Return | Description |
|---|---|---|
| `setGrouping(updater)` | `void` | Set grouping state |
| `resetGrouping(defaultState?)` | `void` | Reset grouping |

### Editing API

| Method | Return | Description |
|---|---|---|
| `startEditing(rowId, columnId)` | `void` | Enter edit mode on a cell |
| `commitEdit()` | `void` | Commit the active edit |
| `cancelEdit()` | `void` | Cancel the active edit |
| `setPendingValue(rowId, columnId, value)` | `void` | Set a pending edit value |
| `getPendingValue(rowId, columnId)` | `unknown \| undefined` | Get a pending edit value |
| `getPendingRow(rowId)` | `Partial<TData> \| undefined` | Get all pending values for a row |
| `getAllPendingChanges()` | `Record<string, Partial<TData>>` | Get all pending changes |
| `hasPendingChanges()` | `boolean` | Any uncommitted changes? |
| `commitAllPending()` | `void` | Commit all pending changes (triggers `onEditCommit`) |
| `discardAllPending()` | `void` | Discard all pending changes |
| `getValidationErrors()` | `Record<string, Record<string, string>>` | Get validation errors |
| `isValid()` | `boolean` | All pending values valid? |
| `setEditing(updater)` | `void` | Set editing state directly |
| `resetEditing(defaultState?)` | `void` | Reset editing state |

### Async Commit API

| Method | Return | Description |
|---|---|---|
| `getCellRenderValue(rowId, columnId)` | `unknown` | Returns pending value if commit is in-flight, otherwise saved value |
| `getCellStatus(rowId, columnId)` | `CellStatus` | Returns `'idle' \| 'pending' \| 'error' \| 'conflict'` |
| `getCellErrorMessage(rowId, columnId)` | `string \| undefined` | Error message from failed commit |
| `getCellConflictWith(rowId, columnId)` | `unknown` | The server value that conflicts with the pending value |
| `commit()` | `Promise<void>` | Dispatch all pending edits (used when `autoCommit: false`) |
| `retryCommit(rowId, columnId)` | `Promise<void>` | Retry a failed commit |
| `dismissCommit(rowId, columnId)` | `void` | Dismiss an error/conflict and revert to saved value |
| `dismissAllCommits()` | `void` | Dismiss all errors and conflicts |

### Export API

| Method | Return | Description |
|---|---|---|
| `exportData(options?)` | `string` | Export table data as CSV or JSON string |

### Event Emitter

| Property | Type | Description |
|---|---|---|
| `events` | `EventEmitter<YableEventMap>` | Typed event emitter |
| `events.on(event, handler)` | `() => void` | Subscribe (returns unsubscribe function) |
| `events.off(event, handler)` | `void` | Unsubscribe |
| `events.emit(event, payload)` | `void` | Emit an event |
| `events.removeAllListeners(event?)` | `void` | Remove all listeners |

---

## Column Instance

Returned by `table.getColumn(id)` or accessed from `table.getAllColumns()`.

### Properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique column identifier |
| `depth` | `number` | Nesting depth (0 for top-level) |
| `columnDef` | `ColumnDef` | The original column definition |
| `columns` | `Column[]` | Child columns (for group columns) |
| `parent` | `Column \| undefined` | Parent column (if nested) |
| `accessorFn` | `(row, index) => TValue` | Value accessor function |

### Traversal

| Method | Return | Description |
|---|---|---|
| `getFlatColumns()` | `Column[]` | This column + all nested flat columns |
| `getLeafColumns()` | `Column[]` | Leaf columns in this column's tree |

### Sizing

| Method | Return | Description |
|---|---|---|
| `getSize()` | `number` | Current width in px |
| `getStart(position?)` | `number` | Start offset in px |
| `getAfter(position?)` | `number` | Remaining space after this column |
| `getCanResize()` | `boolean` | Can this column be resized? |
| `getIsResizing()` | `boolean` | Is this column currently being resized? |
| `resetSize()` | `void` | Reset to default size |

### Sorting

| Method | Return | Description |
|---|---|---|
| `getCanSort()` | `boolean` | Can this column be sorted? |
| `getCanMultiSort()` | `boolean` | Can participate in multi-sort? |
| `getSortingFn()` | `SortingFn` | Get the active sorting function |
| `getNextSortingOrder()` | `SortDirection \| false` | What the next click would do |
| `getIsSorted()` | `false \| SortDirection` | Current sort direction |
| `getSortIndex()` | `number` | Sort priority index (multi-sort) |
| `clearSorting()` | `void` | Remove sort from this column |
| `toggleSorting(desc?, isMulti?)` | `void` | Toggle or set sort direction |
| `getToggleSortingHandler()` | `(event) => void` | Event handler for sort toggle |

### Filtering

| Method | Return | Description |
|---|---|---|
| `getCanFilter()` | `boolean` | Can this column be filtered? |
| `getCanGlobalFilter()` | `boolean` | Included in global filter? |
| `getIsFiltered()` | `boolean` | Is a filter active on this column? |
| `getFilterValue()` | `unknown` | Current filter value |
| `getFilterIndex()` | `number` | Index in the column filters array |
| `setFilterValue(value)` | `void` | Set filter value for this column |
| `getFilterFn()` | `FilterFn \| undefined` | Get the active filter function |

### Visibility

| Method | Return | Description |
|---|---|---|
| `getCanHide()` | `boolean` | Can this column be hidden? |
| `getIsVisible()` | `boolean` | Is this column visible? |
| `toggleVisibility(value?)` | `void` | Show/hide this column |
| `getToggleVisibilityHandler()` | `(event) => void` | Event handler for visibility toggle |

### Pinning

| Method | Return | Description |
|---|---|---|
| `getCanPin()` | `boolean` | Can this column be pinned? |
| `getIsPinned()` | `ColumnPinningPosition \| false` | `'left'`, `'right'`, or `false` |
| `pin(position)` | `void` | Pin to `'left'`, `'right'`, or `false` (unpin) |
| `getPinnedIndex()` | `number` | Index among pinned columns |

### Faceting

| Method | Return | Description |
|---|---|---|
| `getFacetedRowModel()` | `RowModel` | Faceted row model for this column |
| `getFacetedUniqueValues()` | `Map<unknown, number>` | Unique values and counts |
| `getFacetedMinMaxValues()` | `[number, number] \| undefined` | Min/max for numeric columns |

### Grouping

| Method | Return | Description |
|---|---|---|
| `getCanGroup()` | `boolean` | Can this column be grouped? |
| `getIsGrouped()` | `boolean` | Is this column currently grouped? |
| `getGroupedIndex()` | `number` | Index in grouping array |
| `toggleGrouping()` | `void` | Toggle grouping on this column |
| `getAggregationFn()` | `AggregationFn \| undefined` | Get the aggregation function |

---

## Row Instance

Accessed via `table.getRowModel().rows` or `table.getRow(id)`.

### Properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique row identifier |
| `index` | `number` | Row index in the current array |
| `original` | `TData` | The original data object |
| `depth` | `number` | Nesting depth (0 for top-level) |
| `parentId` | `string \| undefined` | Parent row ID (tree data) |
| `subRows` | `Row[]` | Child rows (tree data) |
| `groupingColumnId` | `string \| undefined` | Column ID this row groups by |
| `groupingValue` | `unknown` | Group key value |

### Value Access

| Method | Return | Description |
|---|---|---|
| `getValue<TValue>(columnId)` | `TValue` | Get the typed value for a column |
| `renderValue<TValue>(columnId)` | `TValue` | Get render-ready value |

### Cell Access

| Method | Return | Description |
|---|---|---|
| `getAllCells()` | `Cell[]` | All cells in this row |
| `getVisibleCells()` | `Cell[]` | Visible cells only |
| `getLeftVisibleCells()` | `Cell[]` | Left-pinned visible cells |
| `getRightVisibleCells()` | `Cell[]` | Right-pinned visible cells |
| `getCenterVisibleCells()` | `Cell[]` | Unpinned visible cells |

### Selection

| Method | Return | Description |
|---|---|---|
| `getIsSelected()` | `boolean` | Is this row selected? |
| `getIsSomeSelected()` | `boolean` | Some sub-rows selected? |
| `getIsAllSubRowsSelected()` | `boolean` | All sub-rows selected? |
| `getCanSelect()` | `boolean` | Can this row be selected? |
| `getCanMultiSelect()` | `boolean` | Can participate in multi-select? |
| `getCanSelectSubRows()` | `boolean` | Can sub-rows be auto-selected? |
| `toggleSelected(value?, opts?)` | `void` | Select/deselect this row |
| `getToggleSelectedHandler()` | `(event) => void` | Event handler for selection toggle |

### Expanding

| Method | Return | Description |
|---|---|---|
| `getIsExpanded()` | `boolean` | Is this row expanded? |
| `getCanExpand()` | `boolean` | Can this row be expanded? |
| `getIsGrouped()` | `boolean` | Is this a group row? |
| `toggleExpanded(expanded?)` | `void` | Toggle expansion |
| `getToggleExpandedHandler()` | `(event) => void` | Event handler for expand toggle |

### Pinning

| Method | Return | Description |
|---|---|---|
| `getIsPinned()` | `RowPinningPosition \| false` | `'top'`, `'bottom'`, or `false` |
| `getCanPin()` | `boolean` | Can this row be pinned? |
| `pin(position, includeLeaf?, includeParent?)` | `void` | Pin to `'top'`, `'bottom'`, or unpin |

### Grouping

| Method | Return | Description |
|---|---|---|
| `getGroupingValue(columnId)` | `unknown` | Get the grouping value for a column |
| `getLeafRows()` | `Row[]` | Get all leaf rows under this group |

---

## Cell Instance

Accessed via `row.getVisibleCells()` or `row.getAllCells()`.

### Properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique cell identifier (`{rowId}_{columnId}`) |
| `row` | `Row` | Parent row |
| `column` | `Column` | Parent column |

### Methods

| Method | Return | Description |
|---|---|---|
| `getValue()` | `TValue` | Get the typed cell value |
| `renderValue()` | `TValue` | Get render-ready value |
| `getContext()` | `CellContext` | Get full render context (table, row, column, cell) |
| `getIsEditing()` | `boolean` | Is this cell in edit mode? |
| `getIsAlwaysEditable()` | `boolean` | Is this cell always editable? |

### CellContext

The object returned by `cell.getContext()`:

```typescript
interface CellContext<TData, TValue> {
  table: Table<TData>
  column: Column<TData, TValue>
  row: Row<TData>
  cell: Cell<TData, TValue>
  getValue: () => TValue
  renderValue: () => TValue
}
```

---

## Header & HeaderGroup

### HeaderGroup

```typescript
interface HeaderGroup<TData> {
  id: string
  depth: number
  headers: Header<TData>[]
}
```

### Header

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Header identifier |
| `index` | `number` | Position within the header group |
| `depth` | `number` | Header group depth |
| `column` | `Column` | Associated column |
| `headerGroup` | `HeaderGroup` | Parent header group |
| `subHeaders` | `Header[]` | Sub-headers (for group columns) |
| `colSpan` | `number` | Column span |
| `rowSpan` | `number` | Row span |
| `isPlaceholder` | `boolean` | True if this is a placeholder header |

| Method | Return | Description |
|---|---|---|
| `getLeafHeaders()` | `Header[]` | All leaf headers under this header |
| `getSize()` | `number` | Width in px |
| `getStart(position?)` | `number` | Start offset in px |
| `getContext()` | `HeaderContext` | Full render context |
| `getResizeHandler()` | `(event) => void \| undefined` | Resize drag handler |

---

## State Types

### TableState

```typescript
interface TableState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  pagination: PaginationState
  rowSelection: RowSelectionState
  columnVisibility: VisibilityState
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
  columnSizingInfo: ColumnSizingInfoState
  expanded: ExpandedState
  rowPinning: RowPinningState
  grouping: GroupingState
  editing: EditingState
}
```

### Individual State Types

```typescript
// Sorting
type SortingState = ColumnSort[]
interface ColumnSort { id: string; desc: boolean }
type SortDirection = 'asc' | 'desc'

// Filtering
type ColumnFiltersState = ColumnFilter[]
interface ColumnFilter { id: string; value: unknown }

// Pagination
interface PaginationState { pageIndex: number; pageSize: number }

// Selection
type RowSelectionState = Record<string, boolean>

// Visibility
type VisibilityState = Record<string, boolean>

// Column Order
type ColumnOrderState = string[]

// Column Pinning
interface ColumnPinningState { left?: string[]; right?: string[] }

// Column Sizing
type ColumnSizingState = Record<string, number>
interface ColumnSizingInfoState {
  startOffset: number | null
  startSize: number | null
  deltaOffset: number | null
  deltaPercentage: number | null
  isResizingColumn: string | false
  columnSizingStart: [string, number][]
}

// Expanded
type ExpandedState = Record<string, boolean> | true

// Row Pinning
interface RowPinningState { top?: string[]; bottom?: string[] }

// Grouping
type GroupingState = string[]

// Editing
interface EditingState {
  activeCell?: { rowId: string; columnId: string }
  pendingValues: Record<string, Record<string, unknown>>
}
```

### Updater Pattern

All state setters accept an `Updater<T>`, which is either a direct value or an updater function:

```typescript
type Updater<T> = T | ((prev: T) => T)

// Direct value
table.setSorting([{ id: 'name', desc: false }])

// Updater function
table.setSorting((prev) => [...prev, { id: 'age', desc: true }])
```

---

## Built-in Sorting Functions

Import: `import { sortingFns } from '@yable/core'`

| Name | Signature | Description |
|---|---|---|
| `sortingFns.alphanumeric` | `(rowA, rowB, columnId) => number` | Natural sort (case-insensitive). `"item2"` sorts before `"item10"`. |
| `sortingFns.alphanumericCaseSensitive` | `(rowA, rowB, columnId) => number` | Natural sort (case-sensitive) |
| `sortingFns.text` | `(rowA, rowB, columnId) => number` | Locale-aware string comparison (case-insensitive) |
| `sortingFns.textCaseSensitive` | `(rowA, rowB, columnId) => number` | Locale-aware string comparison (case-sensitive) |
| `sortingFns.datetime` | `(rowA, rowB, columnId) => number` | Sorts Date objects and parseable date strings |
| `sortingFns.basic` | `(rowA, rowB, columnId) => number` | Simple `>` / `<` comparison |

---

## Built-in Filter Functions

Import: `import { filterFns } from '@yable/core'`

| Name | Filter Value Type | Description |
|---|---|---|
| `filterFns.includesString` | `string` | Case-insensitive substring match |
| `filterFns.includesStringSensitive` | `string` | Case-sensitive substring match |
| `filterFns.equalsString` | `string` | Case-insensitive exact match |
| `filterFns.equalsStringSensitive` | `string` | Case-sensitive exact match |
| `filterFns.arrIncludes` | `unknown` | Array contains the filter value |
| `filterFns.arrIncludesAll` | `unknown[]` | Array contains all filter values |
| `filterFns.arrIncludesSome` | `unknown[]` | Array contains at least one filter value |
| `filterFns.equals` | `unknown` | Strict equality (`===`) |
| `filterFns.weakEquals` | `unknown` | Loose equality (`==`) |
| `filterFns.inNumberRange` | `[number?, number?]` | Number within min/max range |
| `filterFns.inDateRange` | `[Date?, Date?]` | Date within start/end range |

---

## Built-in Aggregation Functions

Import: `import { aggregationFns } from '@yable/core'`

| Name | Return Type | Description |
|---|---|---|
| `aggregationFns.sum` | `number` | Sum of numeric leaf values |
| `aggregationFns.min` | `number` | Minimum numeric leaf value |
| `aggregationFns.max` | `number` | Maximum numeric leaf value |
| `aggregationFns.extent` | `[number, number]` | `[min, max]` tuple |
| `aggregationFns.mean` | `number` | Average of numeric leaf values |
| `aggregationFns.median` | `number` | Median of numeric leaf values |
| `aggregationFns.unique` | `unknown[]` | Array of unique leaf values |
| `aggregationFns.uniqueCount` | `number` | Count of unique leaf values |
| `aggregationFns.count` | `number` | Number of leaf rows |

---

## Column Definition Types

### ColumnDefBase

Shared by all column types:

```typescript
type ColumnDefBase<TData, TValue> = {
  id?: string
  header?: string | ((ctx: HeaderContext<TData, TValue>) => unknown)
  footer?: string | ((ctx: HeaderContext<TData, TValue>) => unknown)
  cell?: string | ((ctx: CellContext<TData, TValue>) => unknown)
  meta?: ColumnMeta
}
```

### ColumnDefExtensions

Optional configuration shared by accessor and display columns:

```typescript
interface ColumnDefExtensions<TData, TValue> {
  // Sizing
  size?: number
  minSize?: number
  maxSize?: number

  // Sorting
  enableSorting?: boolean
  sortingFn?: SortingFnOption
  sortDescFirst?: boolean
  sortUndefined?: false | -1 | 1 | 'first' | 'last'
  invertSorting?: boolean

  // Filtering
  enableColumnFilter?: boolean
  enableGlobalFilter?: boolean
  filterFn?: FilterFnOption

  // Visibility
  enableHiding?: boolean

  // Pinning
  enablePinning?: boolean

  // Resizing
  enableResizing?: boolean

  // Grouping
  enableGrouping?: boolean
  getGroupingValue?: (row: TData) => unknown

  // Aggregation
  aggregationFn?: AggregationFnOption
  aggregatedCell?: string | ((ctx: CellContext) => unknown)

  // Cell editing
  editable?: boolean | ((row: Row) => boolean)
  editConfig?: CellEditConfig

  // Styling
  cellClassName?: string | ((ctx: CellContext) => string | undefined)
  headerClassName?: string
  footerClassName?: string
}
```

### CellEditConfig

```typescript
interface CellEditConfig<TData, TValue> {
  type: 'text' | 'number' | 'select' | 'toggle' | 'date' | 'checkbox' | 'custom'
  options?: { label: string; value: unknown }[]
  getOptions?: (row: Row) => { label: string; value: unknown }[]
  validate?: (value: TValue, row: Row) => string | null
  parse?: (inputValue: string) => TValue
  format?: (value: TValue) => string
  placeholder?: string
  render?: (props: CellEditRenderProps) => unknown
}
```

---

## Async Commit Types

Import from `@yable/core`:

### CellPatch

```typescript
interface CellPatch<TData, TValue = unknown> {
  rowId: string
  columnId: string
  /** The value the user typed. */
  value: TValue
  /** The most recent saved value at the moment we dispatched. */
  previousValue: TValue
  /** The full row snapshot at dispatch time. */
  row: TData
  /** Aborts when the user starts a new commit on the same cell. */
  signal: AbortSignal
}
```

### CellStatus

```typescript
type CellStatus = 'idle' | 'pending' | 'error' | 'conflict'
```

### OnCommitFn

```typescript
type OnCommitFn<TData> = (
  patches: CellPatch<TData>[]
) => Promise<CommitResult> | CommitResult
```

### CommitResult

```typescript
type CommitResult = void | {
  resolved?: Record<string, Record<string, unknown>>
}
```

### CommitError

```typescript
class CommitError extends Error {
  cells: CommitErrorCells
  constructor(cells: CommitErrorCells, message?: string)
}

// rowId -> columnId -> human-readable error message
type CommitErrorCells = Record<string, Record<string, string>>
```

Throw from `onCommit` to mark specific cells as failed. Throw a generic `Error` to fail all cells in the batch.

### CommitRecord

```typescript
interface CommitRecord {
  status: 'pending' | 'error' | 'conflict'
  pendingValue: unknown
  previousValue: unknown
  opId: number
  errorMessage?: string     // only when status === 'error'
  conflictWith?: unknown    // only when status === 'conflict'
  abortController: AbortController
}
```

### Table Options (Async Commits)

| Option | Type | Default | Description |
|---|---|---|---|
| `onCommit` | `OnCommitFn<TData>` | -- | Async handler for saving cell edits. Resolve = success, throw = failure. |
| `autoCommit` | `boolean` | `true` | Fire `onCommit` after each cell edit. If `false`, batch edits until `table.commit()`. |
| `rowCommitRetryMode` | `'failed' \| 'batch'` | `'failed'` | `'failed'`: retry only failed cells. `'batch'`: retry entire original batch. |

### Per-Column Commit

Columns can define their own commit handler that takes precedence over `onCommit`:

```typescript
columnHelper.accessor('price', {
  commit: async (patch: CellPatch) => {
    await updatePrice(patch.rowId, patch.value)
  },
})
```

---

## Event Types

```typescript
interface CellClickEvent<TData> {
  cell: Cell<TData>
  row: Row<TData>
  column: Column<TData>
  originalEvent?: unknown
}

interface RowClickEvent<TData> {
  row: Row<TData>
  cells: Cell<TData>[]
  originalEvent?: unknown
}

interface HeaderClickEvent<TData> {
  column: Column<TData>
  header: Header<TData>
  originalEvent?: unknown
}

interface CellEditEvent<TData> {
  cell: Cell<TData>
  row: Row<TData>
  column: Column<TData>
  value: unknown
  previousValue?: unknown
}

interface SelectionChangeEvent<TData> {
  selection: RowSelectionState
  selectedRows: Row<TData>[]
}

interface SortChangeEvent {
  sorting: SortingState
}

interface FilterChangeEvent {
  columnFilters: ColumnFiltersState
  globalFilter: string
}

interface PageChangeEvent {
  pagination: PaginationState
}

interface StateChangeEvent {
  state: TableState
  previousState: TableState
}
```

---

## Utility Functions

Import from `@yable/core`:

| Function | Signature | Description |
|---|---|---|
| `functionalUpdate` | `(updater: Updater<T>, old: T) => T` | Apply an updater (value or function) to a previous value |
| `memo` | `(deps, fn, opts) => () => T` | Create a memoized getter with dependency tracking |
| `makeStateUpdater` | `(key, table) => (updater) => void` | Create a state slice updater |
| `getDeepValue` | `(obj, path) => unknown` | Access nested object value by dot-separated path |
| `shallowEqual` | `(a, b) => boolean` | Shallow comparison of two values |
| `noop` | `() => void` | No-op function |
| `identity` | `(x) => x` | Identity function |
| `isFunction` | `(val) => boolean` | Type guard for functions |
| `range` | `(start, end) => number[]` | Generate an array of numbers |
| `flattenBy` | `(arr, fn) => T[]` | Recursively flatten an array by a child accessor |
| `uniqueBy` | `(arr, fn) => T[]` | Deduplicate an array by a key accessor |
| `clamp` | `(value, min, max) => number` | Clamp a number within a range |
