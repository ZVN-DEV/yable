# Yable Feature Build Plan

> 40 features, 6 parallel agents, optimized for zero merge conflicts.
> Generated from competitive analysis against AG Grid.

---

## Architecture Overview

```
packages/
  core/src/
    types.ts              — All TypeScript interfaces & state types
    core/table.ts         — createTable() engine, state management, row model pipeline
    core/column.ts        — createColumn() with sorting/filtering/pinning/grouping
    core/row.ts           — createRow() with selection/expanding/pinning
    core/cell.ts          — createCell() with editing state
    core/headers.ts       — buildHeaderGroups(), createHeader() with resize
    events/EventEmitter.ts — Typed event emitter
    utils.ts              — memo, functionalUpdate, makeStateUpdater, helpers
    filterFns.ts          — Built-in filter functions
    sortingFns.ts         — Built-in sorting functions
    aggregationFns.ts     — Built-in aggregation functions
    columnHelper.ts       — createColumnHelper() typed builder
    index.ts              — Public API exports
  react/src/
    useTable.ts           — React hook wrapping createTable
    context.ts            — React context provider
    types.ts              — React-specific prop types
    components/
      Table.tsx           — Main <Table> component
      TableHeader.tsx     — <thead> with sort indicators, resize handles
      TableBody.tsx       — <tbody> with row rendering
      TableCell.tsx       — <td> with edit mode, pinning styles
      TableFooter.tsx     — <tfoot>
      SortIndicator.tsx   — Sort direction SVG icon
      Pagination.tsx      — Page nav component
      GlobalFilter.tsx    — Search input component
    form/
      CellInput.tsx       — Text/number input for cell editing
      CellSelect.tsx      — Dropdown select
      CellCheckbox.tsx    — Checkbox input
      CellToggle.tsx      — Toggle switch
      CellDatePicker.tsx  — Date picker input
    index.ts              — Public API exports
  vanilla/src/
    createTableDOM.ts     — Vanilla JS factory
    renderer.ts           — HTML string renderer
    events.ts             — DOM event delegation
    index.ts              — Public API exports
  themes/src/
    tokens.css            — CSS custom properties (design tokens)
    base.css              — Structural CSS (layout, forms, pagination)
    utilities.css         — Modifier classes (striped, bordered, compact)
    themes/
      default.css         — Clean/minimal theme
      stripe.css          — Stripe-inspired theme
      compact.css         — Dense data theme
    index.css             — Theme entry point
```

### Key Patterns
- **State**: All state lives in `TableState` (types.ts). State updaters use `makeStateUpdater()`.
- **Memo**: Computed values use `memo()` for dependency-tracked caching.
- **Events**: `EventEmitterImpl` with typed `YableEventMap`.
- **Row Model Pipeline**: Core -> Filtered -> Sorted -> Paginated (chained memos in table.ts).
- **CSS**: All styling via `--yable-*` CSS custom properties. Class prefix: `yable-`.

---

## Agent Assignments

| Agent | Domain | Primary Files (owns exclusively) | Shared Files (coordinate) |
|-------|--------|----------------------------------|---------------------------|
| **1** | Keyboard nav, cell selection | `core/src/features/keyboard.ts` (new), `core/src/features/cellSelection.ts` (new) | `types.ts`, `core/table.ts`, `react/TableCell.tsx`, `react/TableBody.tsx` |
| **2** | Clipboard, undo/redo, fill handle | `core/src/features/clipboard.ts` (new), `core/src/features/undoRedo.ts` (new), `core/src/features/fillHandle.ts` (new) | `types.ts`, `core/table.ts` |
| **3** | Column enhancements, column menu, floating filters | `core/src/features/columnSpanning.ts` (new), `react/components/ColumnMenu.tsx` (new), `react/components/FloatingFilter.tsx` (new) | `types.ts`, `core/column.ts`, `core/headers.ts`, `react/TableHeader.tsx` |
| **4** | Row enhancements, tree data, master/detail | `core/src/features/rowDragging.ts` (new), `core/src/features/rowSpanning.ts` (new), `core/src/features/treeData.ts` (new), `react/components/MasterDetail.tsx` (new) | `types.ts`, `core/row.ts`, `core/table.ts`, `react/TableBody.tsx` |
| **5** | Visual/UX, themes, design system | `react/components/LoadingOverlay.tsx` (new), `react/components/Tooltip.tsx` (new), `themes/src/themes/` (new themes) | `themes/base.css`, `themes/tokens.css`, `react/Table.tsx` |
| **6** | Server-side model, infinite scroll, column virtualization, export, charts | `core/src/features/serverSide.ts` (new), `core/src/features/columnVirtualization.ts` (new), `core/src/features/excelExport.ts` (new) | `types.ts`, `core/table.ts` |

### Conflict Prevention Rules
1. Each agent creates NEW files for their features under `core/src/features/` or `react/components/`.
2. Changes to shared files (`types.ts`, `table.ts`) must be ADDITIVE ONLY -- append new interfaces, append new state fields, append new table methods. Never modify existing signatures.
3. New state fields go into `TableState` in `types.ts` -- each agent owns their own state slice name (e.g., Agent 1 owns `cellSelection`, Agent 2 owns `undoStack`).
4. New table API methods: each agent adds their methods to the `Table` interface in `types.ts` under a clearly commented section.
5. New CSS: each agent uses a unique class prefix for their feature (e.g., `yable-kb-*`, `yable-clipboard-*`).

---

## Phase 1 -- Core Table Interactions (Highest Priority)

### TASK-01: Keyboard Navigation
- **Agent**: 1
- **Complexity**: XL
- **Description**: Arrow key cell navigation with full keyboard support. Arrow keys move between cells, F2 enters edit mode, Tab/Shift+Tab move between cells, Home/End jump to row start/end, Page Up/Down scroll by page, Ctrl+Arrow jumps to data boundaries, Ctrl+Home/End jump to table corners.
- **New Files**:
  - `packages/core/src/features/keyboard.ts` -- Core keyboard navigation state machine and cell coordinate tracking
  - `packages/react/src/hooks/useKeyboardNavigation.ts` -- React hook that attaches keyboard listeners to the table container
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `KeyboardNavigationState` to `TableState` (`focusedCell: {rowIndex: number, colIndex: number} | null`), add keyboard nav methods to `Table` interface
  - `packages/core/src/core/table.ts` -- Wire keyboard state updater, add `setFocusedCell()`, `moveFocus()`, `getFocusedCell()` to table instance
  - `packages/react/src/components/TableBody.tsx` -- Add `data-row-index` attribute to `<tr>`, pass focus state down
  - `packages/react/src/components/TableCell.tsx` -- Add `data-col-index`, `tabIndex`, focus ring styling, `data-focused` attribute
  - `packages/themes/src/base.css` -- Add `.yable-td[data-focused]` focus ring styles
- **Dependencies**: None (foundational)
- **State Slice**: `keyboardNav: KeyboardNavigationState`
- **Events to Add**: `'cell:focus'`, `'cell:blur'` to `YableEventMap`

### TASK-02: Cell Range Selection
- **Agent**: 1
- **Complexity**: XL
- **Description**: Click+drag to select rectangular cell ranges, Shift+click to extend selection between anchor and target, Shift+Arrow to extend selection one cell at a time, Ctrl+click to toggle individual cells, Ctrl+drag to add additional ranges (multi-range selection), visual highlight for selected range.
- **New Files**:
  - `packages/core/src/features/cellSelection.ts` -- Cell range selection state: anchor cell, current ranges (array of `{startRow, startCol, endRow, endCol}`), selection model (add/remove/toggle)
  - `packages/react/src/hooks/useCellSelection.ts` -- React hook for mouse drag tracking (mousedown -> mousemove -> mouseup), shift+click, ctrl+click
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `CellSelectionState` (`ranges: CellRange[]`, `activeRange: number | null`), add `CellRange` type, add selection methods to `Table` interface
  - `packages/react/src/components/TableCell.tsx` -- Add `data-selected` attribute, selection styling
  - `packages/themes/src/base.css` -- Add `.yable-td[data-cell-selected]` highlight, range border styles
- **Dependencies**: TASK-01 (uses focused cell as anchor)
- **State Slice**: `cellSelection: CellSelectionState`

### TASK-03: Clipboard Support
- **Agent**: 2
- **Complexity**: L
- **Description**: Copy (Ctrl+C), Cut (Ctrl+X), Paste (Ctrl+V) for selected cells/ranges. Configurable delimiters (tab-separated by default for Excel compatibility). Option to copy with column headers. Paste parses clipboard text into grid shape and applies to target cells. Cut marks source cells and clears on paste.
- **New Files**:
  - `packages/core/src/features/clipboard.ts` -- `serializeCells()` (cells -> TSV string), `parseClipboardText()` (TSV -> 2D array), `applyCellPaste()` (write parsed values to target cells via `setPendingValue`)
  - `packages/react/src/hooks/useClipboard.ts` -- React hook attaching copy/cut/paste keyboard listeners, uses `navigator.clipboard` API
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `ClipboardOptions` to `TableOptions` (`enableClipboard`, `clipboardDelimiter`, `onBeforeCopy`, `onBeforePaste`, `copyHeaders`), add clipboard methods to `Table` interface
  - `packages/core/src/core/table.ts` -- Add `copyToClipboard()`, `pasteFromClipboard()`, `cutCells()` methods
- **Dependencies**: TASK-02 (needs cell selection to know which cells to copy)
- **Events to Add**: `'clipboard:copy'`, `'clipboard:paste'`, `'clipboard:cut'`

### TASK-04: Undo/Redo
- **Agent**: 2
- **Complexity**: M
- **Description**: Ctrl+Z to undo, Ctrl+Y/Ctrl+Shift+Z to redo. Configurable stack size (default 50). Tracks cell value changes as undoable actions. Programmatic API: `table.undo()`, `table.redo()`, `table.canUndo()`, `table.canRedo()`, `table.getUndoStack()`.
- **New Files**:
  - `packages/core/src/features/undoRedo.ts` -- `UndoStack` class with push/undo/redo/clear, `UndoAction` type (`{type: 'cell-edit', rowId, columnId, oldValue, newValue}`), integration with `setPendingValue`
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `UndoRedoState` to `TableState` (`undoStack: UndoAction[]`, `redoStack: UndoAction[]`, `maxStackSize: number`), add undo/redo methods to `Table` interface
  - `packages/core/src/core/table.ts` -- Wrap `setPendingValue` to push onto undo stack, add `undo()`, `redo()`, `canUndo()`, `canRedo()`, `clearUndoHistory()`
- **Dependencies**: None (operates on editing system which exists)
- **State Slice**: `undoRedo: UndoRedoState`
- **Events to Add**: `'undo'`, `'redo'`

---

## Phase 2 -- Column & Row Enhancements

### TASK-05: Column Auto-Size
- **Agent**: 3
- **Complexity**: M
- **Description**: Fit column width to content (measures longest cell value + header), fit all columns to grid width (distribute available space proportionally). Double-click resize handle to auto-fit. API: `column.autoSize()`, `table.autoSizeAllColumns()`, `table.sizeColumnsToFit()`.
- **New Files**:
  - `packages/core/src/features/columnAutoSize.ts` -- `measureColumnWidth()` (needs DOM measurement helper), `sizeColumnsToFit()` (distributes remaining space)
  - `packages/react/src/hooks/useColumnAutoSize.ts` -- React hook that provides DOM measurement via hidden span technique
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `autoSize()` to `Column` interface, add `autoSizeAllColumns()`, `sizeColumnsToFit()` to `Table` interface
  - `packages/core/src/core/column.ts` -- Add `autoSize()` method stub (implementation in feature file)
  - `packages/react/src/components/TableHeader.tsx` -- Add double-click handler on resize handle for auto-size
- **Dependencies**: None

### TASK-06: Column Spanning
- **Agent**: 3
- **Complexity**: L
- **Description**: `colSpan` callback on column def that returns number of columns to span. Dynamically merges cells across columns based on row data. Skips rendering of spanned-over cells.
- **New Files**:
  - `packages/core/src/features/columnSpanning.ts` -- `resolveColSpans()` processes visible cells per row and computes which cells to render vs skip, returns `CellWithSpan[]`
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `colSpan?: (ctx: CellContext<TData, TValue>) => number` to `ColumnDefExtensions`, add `getColSpan()` to `Cell` interface
  - `packages/react/src/components/TableBody.tsx` -- Use `resolveColSpans()` to determine `colSpan` attribute and skip spanned cells
  - `packages/vanilla/src/renderer.ts` -- Apply colSpan in `renderCell()`
- **Dependencies**: None

### TASK-07: Row Spanning
- **Agent**: 4
- **Complexity**: L
- **Description**: Single cell spans multiple contiguous rows when adjacent rows have the same value. `rowSpan` callback on column def returns number of rows to span. First row in span renders the cell, subsequent rows skip rendering for that column.
- **New Files**:
  - `packages/core/src/features/rowSpanning.ts` -- `resolveRowSpans()` pre-processes the visible row model to compute which cells span and which are hidden. Returns a `RowSpanMap` (`Map<cellId, {span: number, hidden: boolean}>`)
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `rowSpan?: (ctx: CellContext<TData, TValue>) => number` to `ColumnDefExtensions`, add `getRowSpan()` to `Cell` interface
  - `packages/react/src/components/TableBody.tsx` -- Consume `RowSpanMap` to set `rowSpan` attribute and skip hidden cells
  - `packages/vanilla/src/renderer.ts` -- Apply rowSpan in `renderRow()`
- **Dependencies**: None

### TASK-08: Row Dragging
- **Agent**: 4
- **Complexity**: L
- **Description**: Drag handle column to reorder rows via drag-and-drop. Visual drop indicator (line between rows). Drag between groups (if grouping enabled). API: `table.moveRow(fromIndex, toIndex)`.
- **New Files**:
  - `packages/core/src/features/rowDragging.ts` -- `moveRow()` reorder logic, drag state management (`draggedRowId`, `dropTargetIndex`)
  - `packages/react/src/components/DragHandle.tsx` -- Drag handle icon component with drag event handlers
  - `packages/react/src/hooks/useRowDrag.ts` -- React hook using HTML5 Drag & Drop API or pointer events for row reordering
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `RowDragState` to `TableState`, add `enableRowDragging` to `TableOptions`, add `moveRow()` to `Table` interface
  - `packages/react/src/components/TableBody.tsx` -- Render `DragHandle` in first cell when `enableRowDragging`, apply drag-over styles
  - `packages/themes/src/base.css` -- Add `.yable-drag-handle`, `.yable-tr--dragging`, `.yable-drop-indicator` styles
- **Dependencies**: None
- **State Slice**: `rowDrag: RowDragState`
- **Events to Add**: `'row:drag:start'`, `'row:drag:end'`, `'row:reorder'`

### TASK-09: Full Row Editing
- **Agent**: 4
- **Complexity**: M
- **Description**: All editable cells in a row enter edit mode simultaneously. Tab moves between cells within the row. Enter commits the row, Escape cancels. API: `table.startRowEditing(rowId)`, `table.commitRowEdit(rowId)`, `table.cancelRowEdit(rowId)`.
- **New Files**:
  - `packages/core/src/features/fullRowEditing.ts` -- Row-level editing state management, coordinates with existing per-cell editing, handles Tab navigation within the row
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `editingRows: Set<string>` to `EditingState`, add `startRowEditing()`, `commitRowEdit()`, `cancelRowEdit()` to `Table` interface
  - `packages/core/src/core/table.ts` -- Implement row editing methods
  - `packages/react/src/components/TableBody.tsx` -- When row is in edit mode, render all editable cells in edit state
- **Dependencies**: Builds on existing editing system
- **Events to Add**: `'row:edit:start'`, `'row:edit:commit'`, `'row:edit:cancel'`

### TASK-10: Fill Handle
- **Agent**: 2
- **Complexity**: L
- **Description**: Small square at bottom-right corner of selected cell/range. Drag down/right to auto-fill adjacent cells. Detects patterns: sequential numbers (1,2,3 -> 4,5,6), dates (increment by same delta), repeating values. API: `table.fillRange(sourceRange, targetRange)`.
- **New Files**:
  - `packages/core/src/features/fillHandle.ts` -- `detectPattern()` (analyzes source values), `generateFillValues()` (extends pattern to target range), fill state management
  - `packages/react/src/components/FillHandle.tsx` -- Draggable corner square component, renders on active cell/range selection
  - `packages/react/src/hooks/useFillHandle.ts` -- React hook for drag tracking (mousedown on handle -> mousemove to extend -> mouseup to apply)
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `FillHandleState` (`isFilling: boolean`, `fillDirection`, `fillRange`), add `fillRange()` to `Table`
  - `packages/react/src/components/TableCell.tsx` -- Render `<FillHandle>` on focused/selected cell
  - `packages/themes/src/base.css` -- Add `.yable-fill-handle` positioning and drag styles
- **Dependencies**: TASK-02 (needs cell selection for multi-cell fill)
- **State Slice**: `fillHandle: FillHandleState`

---

## Phase 3 -- Visual Feedback & UX

### TASK-11: Loading Overlay
- **Agent**: 5
- **Complexity**: S
- **Description**: Customizable loading state component. Default: semi-transparent overlay with animated spinner. Covers entire table. Disables interaction during loading. Props: `loading`, `loadingComponent`, `loadingText`.
- **New Files**:
  - `packages/react/src/components/LoadingOverlay.tsx` -- Default loading overlay with spinner animation, customizable via render prop
- **Modified Files**:
  - `packages/react/src/components/Table.tsx` -- Render `<LoadingOverlay>` when `loading=true` instead of current basic approach
  - `packages/react/src/types.ts` -- Add `loadingComponent` prop to `TableProps`
  - `packages/themes/src/base.css` -- Add `.yable-loading-overlay`, `.yable-spinner` with CSS animation
  - `packages/vanilla/src/renderer.ts` -- Add loading overlay HTML to `renderTable()`
- **Dependencies**: None

### TASK-12: No-Rows Overlay
- **Agent**: 5
- **Complexity**: S
- **Description**: Customizable empty state component. Default: centered message with icon. Props: `emptyComponent`, `emptyIcon`, `emptyMessage`, `emptyDetail`. Rendered when filtered/unfiltered data is empty (different messages for each).
- **New Files**:
  - `packages/react/src/components/NoRowsOverlay.tsx` -- Default empty state with SVG icon, primary message, secondary detail text
- **Modified Files**:
  - `packages/react/src/components/Table.tsx` -- Use `<NoRowsOverlay>` instead of current bare `<div>`, distinguish between "no data" vs "no results" (filtered)
  - `packages/react/src/types.ts` -- Add `noRowsComponent`, `noFilterResultsComponent` to `TableProps`
  - `packages/themes/src/base.css` -- Enhance `.yable-empty` styles with icon sizing, animation
- **Dependencies**: None

### TASK-13: Cell Flashing
- **Agent**: 5
- **Complexity**: M
- **Description**: Highlight cells with flash/fade animation when their data changes. Configurable flash duration, up/down colors (green for increase, red for decrease). Enable per-column via `enableCellFlash`. Useful for real-time data (stock prices, monitoring).
- **New Files**:
  - `packages/core/src/features/cellFlash.ts` -- Track previous cell values, compute diff on data update, emit flash events with direction (up/down/change)
  - `packages/react/src/hooks/useCellFlash.ts` -- React hook that tracks previous values via `useRef`, applies flash CSS class temporarily, removes after animation
  - `packages/react/src/components/FlashCell.tsx` -- Wrapper component that applies flash animation class
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `enableCellFlash?: boolean` to `ColumnDefExtensions`, add `CellFlashOptions` to `TableOptions` (`flashDuration`, `flashUpColor`, `flashDownColor`)
  - `packages/themes/src/base.css` -- Add `.yable-td--flash-up`, `.yable-td--flash-down` with `@keyframes` fade animation
- **Dependencies**: None
- **Events to Add**: `'cell:flash'`

### TASK-14: Tooltips
- **Agent**: 5
- **Complexity**: M
- **Description**: Cell tooltips (show full content on hover for truncated cells), header tooltips (column description), custom tooltip components. Tooltip positioning: auto (flips to avoid viewport overflow). Configurable delay, placement.
- **New Files**:
  - `packages/react/src/components/Tooltip.tsx` -- Floating tooltip component using CSS positioning (no external deps), auto-flip logic, fade-in animation
  - `packages/react/src/hooks/useTooltip.ts` -- React hook managing tooltip visibility, delay, positioning math
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `tooltip?: string | ((ctx: CellContext) => string)` to `ColumnDefExtensions`, add `headerTooltip?: string` to `ColumnDefBase`
  - `packages/react/src/components/TableCell.tsx` -- Render `<Tooltip>` on hover when cell is truncated or has explicit tooltip
  - `packages/react/src/components/TableHeader.tsx` -- Render `<Tooltip>` for header tooltips
  - `packages/themes/src/base.css` -- Add `.yable-tooltip` styles (bg, shadow, arrow, z-index)
- **Dependencies**: None

### TASK-15: Row Animation
- **Agent**: 5
- **Complexity**: M
- **Description**: Animated transitions when rows are added, removed, or reordered (sort/filter/group). Uses CSS transitions with `transform: translateY()` for smooth movement. Configurable: `enableRowAnimation`, `animationDuration`. Rows fade out on removal, slide in on addition.
- **New Files**:
  - `packages/react/src/hooks/useRowAnimation.ts` -- React hook that tracks row positions between renders using `useRef`, computes translateY deltas, applies CSS transition classes via `requestAnimationFrame`
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `enableRowAnimation?: boolean`, `animationDuration?: number` to `TableOptions`
  - `packages/react/src/components/TableBody.tsx` -- Integrate `useRowAnimation` hook, apply animation styles to `<tr>` elements
  - `packages/themes/src/base.css` -- Add `.yable-tr--entering`, `.yable-tr--exiting`, `.yable-tr--moving` transition styles
- **Dependencies**: None

---

## Phase 4 -- Advanced Filtering

### TASK-16: Floating Filters
- **Agent**: 3
- **Complexity**: M
- **Description**: Inline filter inputs embedded directly in column headers (below header text). Each column can have its own filter input type: text search, number range, date range, select/multi-select. Shows active filter state. Clear button to reset individual filter.
- **New Files**:
  - `packages/react/src/components/FloatingFilter.tsx` -- Inline filter input component rendered below header text. Detects column data type and renders appropriate input (text, number range slider, date picker, select)
  - `packages/react/src/components/FloatingFilterText.tsx` -- Text search variant
  - `packages/react/src/components/FloatingFilterNumber.tsx` -- Min/max range inputs
  - `packages/react/src/components/FloatingFilterDate.tsx` -- Date range inputs
  - `packages/react/src/components/FloatingFilterSelect.tsx` -- Multi-select checkbox list using faceted values
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `enableFloatingFilter?: boolean` to `TableOptions`, add `floatingFilter?: 'text' | 'number' | 'date' | 'select' | false` to `ColumnDefExtensions`
  - `packages/react/src/components/TableHeader.tsx` -- Render `<FloatingFilter>` row below header row when enabled
  - `packages/themes/src/base.css` -- Add `.yable-floating-filter`, `.yable-floating-filter-row` styles
- **Dependencies**: None (uses existing column filter state)

### TASK-17: Set Filter
- **Agent**: 3
- **Complexity**: L
- **Description**: Excel-like filter popup with unique value checkboxes. Shows all unique values for a column with counts. Search within values. Select all / deselect all. Integrates with faceted row model for accurate counts. Mini search bar at top of popup.
- **New Files**:
  - `packages/react/src/components/SetFilter.tsx` -- Popover component with checkbox list, search input, select all/none buttons, value counts from `getFacetedUniqueValues()`
  - `packages/react/src/hooks/useSetFilter.ts` -- React hook managing popover visibility, search state, selected values
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `filterType?: 'text' | 'set' | 'number' | 'date'` to `ColumnDefExtensions`
  - `packages/react/src/components/TableHeader.tsx` -- Add filter icon button that opens `<SetFilter>` popover
  - `packages/themes/src/base.css` -- Add `.yable-set-filter`, `.yable-filter-popover` styles (popover, checkbox list, search)
- **Dependencies**: None (uses existing faceted values infrastructure)

### TASK-18: Advanced Filter Builder
- **Agent**: 3
- **Complexity**: XL
- **Description**: Cross-column filter builder with AND/OR logic. Visual UI with condition rows: "Column [dropdown] | Operator [dropdown] | Value [input]". Add condition button. Group conditions with AND/OR toggles. Nest groups for complex queries. Outputs a filter tree that feeds into the filter pipeline.
- **New Files**:
  - `packages/core/src/features/advancedFilter.ts` -- `FilterTree` type (recursive AND/OR groups of `FilterCondition`), `evaluateFilterTree()` function that applies the tree to rows, operator definitions (equals, notEquals, contains, startsWith, greaterThan, lessThan, between, inList, blank, notBlank)
  - `packages/react/src/components/AdvancedFilterBuilder.tsx` -- Full visual filter builder UI: condition rows, group containers, operator selects, value inputs
  - `packages/react/src/components/FilterConditionRow.tsx` -- Single condition row component
  - `packages/react/src/components/FilterGroupContainer.tsx` -- AND/OR group wrapper
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `FilterTree`, `FilterCondition`, `FilterOperator` types, add `advancedFilter?: FilterTree` to `TableState`, add `setAdvancedFilter()` to `Table`
  - `packages/core/src/core/table.ts` -- Integrate `evaluateFilterTree()` into filter pipeline (between column filters and global filter)
  - `packages/themes/src/base.css` -- Add `.yable-filter-builder`, `.yable-filter-condition`, `.yable-filter-group` styles
- **Dependencies**: None
- **State Slice**: `advancedFilter: FilterTree | null`

---

## Phase 5 -- Advanced Features

### TASK-19: Tree Data
- **Agent**: 4
- **Complexity**: XL
- **Description**: Hierarchical parent-child data display. `getDataPath` callback returns array path (e.g., `['USA', 'California', 'San Francisco']`). Auto-builds tree structure from flat data. Expand/collapse tree nodes. Indent based on depth. Aggregation rolls up to parent nodes. Works with sorting and filtering (filter matches keep parent chain visible).
- **New Files**:
  - `packages/core/src/features/treeData.ts` -- `buildTreeFromPaths()` converts flat data with paths into nested row model, `filterTreeData()` preserves ancestor chain when filtering, tree-aware sorting
  - `packages/react/src/components/TreeToggle.tsx` -- Indent + expand/collapse chevron component for tree rows
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `getDataPath?: (row: TData) => string[]` to `TableOptions`, add `treeData?: boolean` to `TableOptions`, add `depth` and `isLeaf` metadata to `Row`
  - `packages/core/src/core/table.ts` -- Add tree data row model step (between core and filter), build parent-child relationships
  - `packages/core/src/core/row.ts` -- Add tree-specific methods: `getParentRow()`, `getTreeDepth()`, `isLeaf()`
  - `packages/react/src/components/TableBody.tsx` -- Render `<TreeToggle>` with indentation for tree rows
  - `packages/themes/src/base.css` -- Add `.yable-tree-indent`, `.yable-tree-toggle` styles
- **Dependencies**: None

### TASK-20: Master/Detail
- **Agent**: 4
- **Complexity**: L
- **Description**: Expandable rows that reveal a nested full table instance. Click expand icon to show detail panel with its own table (different columns, own pagination). API: `renderDetailPanel` callback receives parent row, returns React element. Detail table can be any Yable table instance.
- **New Files**:
  - `packages/react/src/components/MasterDetail.tsx` -- Detail panel container that renders a nested `<Table>` component, handles its own state
  - `packages/react/src/components/ExpandIcon.tsx` -- Animated expand/collapse chevron icon
- **Modified Files**:
  - `packages/core/src/types.ts` -- Already has `renderDetailPanel` on `TableOptions` -- enhance typing
  - `packages/react/src/components/TableBody.tsx` -- Enhance expanded row rendering to use `<MasterDetail>` component when `renderDetailPanel` returns a table config
  - `packages/themes/src/base.css` -- Add `.yable-master-detail`, `.yable-detail-panel` styles with border/indent
- **Dependencies**: None (uses existing expand/collapse infrastructure)

### TASK-21: Excel Export
- **Agent**: 6
- **Complexity**: L
- **Description**: Native .xlsx export with styles and formatting. Uses a minimal xlsx writer (no heavy dependency). Exports visible columns with headers, applies column widths, basic number/date formatting. Optional: include filters state, cell styling (bold headers, alternating row colors).
- **New Files**:
  - `packages/core/src/features/excelExport.ts` -- Minimal XLSX writer: builds XML-based Open XML Spreadsheet format, creates shared strings table, writes cell values with type detection, applies basic styles. `exportToExcel(table, options)` returns `Blob`
  - `packages/react/src/hooks/useExcelExport.ts` -- React hook that calls `exportToExcel` and triggers browser download via `URL.createObjectURL`
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `ExcelExportOptions` type (`includeHeaders`, `sheetName`, `fileName`, `columnWidths`, `applyStyles`), add `exportToExcel()` to `Table` interface
  - `packages/core/src/core/table.ts` -- Add `exportToExcel()` method
  - `packages/core/src/index.ts` -- Export `exportToExcel` function
- **Dependencies**: None

### TASK-22: Server-Side Data Model
- **Agent**: 6
- **Complexity**: XL
- **Description**: Lazy loading with server-side sort/filter/group/paginate. Table sends data requests instead of processing locally. `onDataRequest` callback receives `{sorting, filters, pagination, grouping}` and returns `{rows, rowCount}`. Loading states per request. Cache management. Debounced requests on filter change.
- **New Files**:
  - `packages/core/src/features/serverSide.ts` -- `ServerSideDataSource` interface, request builder, response handler, cache (LRU by request params), request deduplication, loading state per block
  - `packages/react/src/hooks/useServerSideData.ts` -- React hook that intercepts state changes, fires `onDataRequest`, manages async loading state, debounces filter requests
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `ServerSideOptions` (`onDataRequest`, `cacheSize`, `debounceMs`), add `serverSide?: boolean` to `TableOptions`, add `DataRequest` and `DataResponse` types, add `setServerData()`, `isLoading()` to `Table`
  - `packages/core/src/core/table.ts` -- When `serverSide: true`, bypass local filter/sort/paginate pipeline and use server-provided data
- **Dependencies**: None
- **State Slice**: `serverSide: ServerSideState`

### TASK-23: Infinite Scroll
- **Agent**: 6
- **Complexity**: L
- **Description**: Block-based row loading as user scrolls. Loads rows in blocks (e.g., 100 at a time). Shows loading placeholder rows for unloaded blocks. Triggers load when scroll approaches unloaded region. Works with server-side model. API: `getRows(startIndex, endIndex)` callback.
- **New Files**:
  - `packages/core/src/features/infiniteScroll.ts` -- Block manager: tracks loaded/loading/unloaded blocks, triggers `getRows` callback, placeholder row generation, block cache with eviction
  - `packages/react/src/hooks/useInfiniteScroll.ts` -- React hook using `IntersectionObserver` on sentinel elements to trigger block loading
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `InfiniteScrollOptions` (`blockSize`, `getRows`, `maxBlocks`, `threshold`), add `infiniteScroll?: boolean` to `TableOptions`
  - `packages/react/src/components/TableBody.tsx` -- Render placeholder/loading rows for unloaded blocks, insert sentinel elements
  - `packages/themes/src/base.css` -- Add `.yable-tr--placeholder` skeleton loading row style
- **Dependencies**: TASK-22 (shares server-side data fetching patterns)
- **State Slice**: `infiniteScroll: InfiniteScrollState`

### TASK-24: Column Virtualization
- **Agent**: 6
- **Complexity**: L
- **Description**: Only render visible columns (the table already has row virtualization options). Calculate which columns are in viewport based on scroll position and column widths. Render spacer columns for off-screen space. Dynamic recalculation on horizontal scroll.
- **New Files**:
  - `packages/core/src/features/columnVirtualization.ts` -- `getVisibleColumnRange(scrollLeft, containerWidth, columns)` returns `{startIndex, endIndex, offsetLeft, offsetRight}`, column width accumulator
  - `packages/react/src/hooks/useColumnVirtualization.ts` -- React hook tracking horizontal scroll position, computing visible column range, providing spacer widths
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `enableColumnVirtualization?: boolean` to `TableOptions`, add `columnOverscan?: number`
  - `packages/react/src/components/TableHeader.tsx` -- Render only visible header cells with left/right spacer `<th>`
  - `packages/react/src/components/TableBody.tsx` -- Render only visible cells per row with left/right spacer `<td>`
  - `packages/react/src/components/TableCell.tsx` -- No changes (individual cells unchanged)
- **Dependencies**: None

---

## Phase 6 -- Charts & Visualization

### TASK-25: Sparklines
- **Agent**: 6
- **Complexity**: M
- **Description**: Mini line/bar/area charts rendered inline in cells. SVG-based, no external deps. Column def specifies `sparkline: {type: 'line' | 'bar' | 'area', data: (row) => number[], color, height}`. Responsive to cell width. Tooltip on hover shows value.
- **New Files**:
  - `packages/react/src/components/Sparkline.tsx` -- SVG sparkline renderer: `SparklineLine`, `SparklineBar`, `SparklineArea` sub-components. Computes SVG path from data points, scales to cell dimensions. Hover interaction for value tooltip
  - `packages/react/src/components/SparklineBar.tsx` -- Bar chart variant
  - `packages/react/src/components/SparklineArea.tsx` -- Area chart variant (filled path)
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `sparkline?: SparklineConfig` to `ColumnDefExtensions`, define `SparklineConfig` type
  - `packages/themes/src/base.css` -- Add `.yable-sparkline` container styles, SVG sizing
- **Dependencies**: None

### TASK-26: Integrated Charts
- **Agent**: 6
- **Complexity**: XL
- **Description**: Create charts from selected data ranges. User selects cells, right-click -> "Chart this data". Opens chart panel with bar/line/pie/scatter options. Chart renders below or beside the table. Uses SVG rendering (no external deps). Chart updates when source data changes.
- **New Files**:
  - `packages/react/src/components/ChartPanel.tsx` -- Chart container panel (below table), chart type selector, axis label inputs
  - `packages/react/src/components/charts/BarChart.tsx` -- SVG bar chart with axes, labels, tooltips
  - `packages/react/src/components/charts/LineChart.tsx` -- SVG line chart with axes, data points
  - `packages/react/src/components/charts/PieChart.tsx` -- SVG pie/donut chart with labels
  - `packages/react/src/components/charts/ScatterChart.tsx` -- SVG scatter plot
  - `packages/react/src/components/charts/ChartAxis.tsx` -- Shared axis component (tick marks, labels, grid lines)
  - `packages/react/src/components/charts/ChartTooltip.tsx` -- Hover tooltip for chart data points
  - `packages/core/src/features/chartData.ts` -- `extractChartData(table, range)` converts cell range to chart-friendly data series
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `ChartConfig` type, add `enableCharts?: boolean` to `TableOptions`
  - `packages/react/src/components/Table.tsx` -- Render `<ChartPanel>` when chart is active
  - `packages/themes/src/base.css` -- Add `.yable-chart-panel`, `.yable-chart-*` styles
- **Dependencies**: TASK-02 (needs cell selection for data range)

---

## Phase 7 -- Enterprise Polish

### TASK-27: Sidebar / Tool Panels
- **Agent**: 5
- **Complexity**: L
- **Description**: Collapsible sidebar with panels: Columns panel (show/hide/reorder columns via drag), Filters panel (summary of all active filters with edit/remove). Sidebar opens on button click, slides in from right. Tab interface for switching panels.
- **New Files**:
  - `packages/react/src/components/Sidebar.tsx` -- Sidebar container with open/close animation, tab navigation
  - `packages/react/src/components/ColumnsPanel.tsx` -- List of all columns with visibility toggles, drag-to-reorder
  - `packages/react/src/components/FiltersPanel.tsx` -- Summary of active filters with edit/remove buttons per filter
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `enableSidebar?: boolean`, `sidebarPanels?: ('columns' | 'filters')[]` to `TableOptions`
  - `packages/react/src/components/Table.tsx` -- Render `<Sidebar>` adjacent to table when enabled
  - `packages/react/src/types.ts` -- Add sidebar-related props to `TableProps`
  - `packages/themes/src/base.css` -- Add `.yable-sidebar`, `.yable-sidebar-panel`, `.yable-sidebar-tab` styles
- **Dependencies**: None

### TASK-28: Status Bar
- **Agent**: 5
- **Complexity**: S
- **Description**: Footer bar showing: total row count, selected row count, filtered row count, aggregation values for selected cells (sum, average, count, min, max). Customizable panels. Sticky at bottom.
- **New Files**:
  - `packages/react/src/components/StatusBar.tsx` -- Bottom bar with configurable panels: row count, selection count, aggregation display
  - `packages/react/src/components/StatusBarPanel.tsx` -- Individual panel component
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `enableStatusBar?: boolean`, `statusBarPanels?: StatusBarPanelConfig[]` to `TableOptions`
  - `packages/react/src/components/Table.tsx` -- Render `<StatusBar>` below pagination when enabled
  - `packages/themes/src/base.css` -- Add `.yable-status-bar`, `.yable-status-panel` styles
- **Dependencies**: None

### TASK-29: Context Menu UI
- **Agent**: 5
- **Complexity**: M
- **Description**: Built-in right-click context menu with common actions: copy, paste, cut, export selection, sort ascending/descending, pin column, hide column, auto-size column. Extensible: user can add custom menu items. Keyboard accessible (arrow keys to navigate, Enter to select). Nested submenus.
- **New Files**:
  - `packages/react/src/components/ContextMenu.tsx` -- Floating menu component with keyboard navigation, positioned at click point, auto-repositions to stay in viewport
  - `packages/react/src/components/ContextMenuItem.tsx` -- Individual menu item (icon, label, shortcut hint, separator, submenu)
  - `packages/react/src/hooks/useContextMenu.ts` -- React hook managing menu state, position, open/close, keyboard navigation
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `ContextMenuConfig` type, add `contextMenu?: ContextMenuConfig` to `TableOptions`, add default menu items list
  - `packages/react/src/components/Table.tsx` -- Attach `onContextMenu` handler to table container, render `<ContextMenu>`
  - `packages/themes/src/base.css` -- Add `.yable-context-menu`, `.yable-context-menu-item`, `.yable-context-menu-separator` styles
- **Dependencies**: None

### TASK-30: Print Layout
- **Agent**: 5
- **Complexity**: M
- **Description**: Print-friendly layout mode. Removes sticky positioning, virtualization. Expands all rows. Shows all pages (no pagination). Applies print-specific CSS: page breaks, header on every page, clean borders. API: `table.preparePrint()` returns print-ready DOM.
- **New Files**:
  - `packages/react/src/components/PrintLayout.tsx` -- Component that renders the full table without pagination/virtualization for printing
  - `packages/react/src/hooks/usePrintLayout.ts` -- React hook that opens print dialog with print-optimized table
- **Modified Files**:
  - `packages/themes/src/base.css` -- Add `@media print` styles: hide pagination, sidebar, context menu; show all rows; adjust spacing; enable `page-break-inside: avoid` on rows
- **Dependencies**: None

### TASK-31: RTL Support
- **Agent**: 5
- **Complexity**: M
- **Description**: Right-to-left layout support. Mirrors all horizontal layout: column order, pinning sides, resize handles, sort indicators, pagination. Uses `dir="rtl"` attribute and CSS logical properties where possible. Configurable via `direction: 'ltr' | 'rtl'` prop.
- **New Files**:
  - `packages/themes/src/rtl.css` -- RTL-specific CSS overrides using `[dir="rtl"]` selector, logical properties, mirrored positioning
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `direction?: 'ltr' | 'rtl'` to `TableOptions`
  - `packages/react/src/components/Table.tsx` -- Apply `dir` attribute to container
  - `packages/react/src/components/TableHeader.tsx` -- Flip resize handle position for RTL
  - `packages/react/src/components/SortIndicator.tsx` -- Mirror sort indicator position
  - `packages/themes/src/base.css` -- Convert `left`/`right` to `inset-inline-start`/`inset-inline-end` where applicable
- **Dependencies**: None

### TASK-32: i18n / Localization
- **Agent**: 5
- **Complexity**: S
- **Description**: Locale text configuration for all built-in UI strings. Default English locale. User provides locale object to override any string. Strings: pagination labels, filter placeholders, empty state, loading text, context menu items, column menu items.
- **New Files**:
  - `packages/core/src/i18n/locales.ts` -- `defaultLocale` object with all UI strings, `LocaleConfig` type, `mergeLocales()` helper
  - `packages/core/src/i18n/en.ts` -- English locale (default)
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `locale?: Partial<LocaleConfig>` to `TableOptions`
  - `packages/core/src/index.ts` -- Export locale types and defaults
  - `packages/react/src/components/Pagination.tsx` -- Use locale strings for button labels
  - `packages/react/src/components/GlobalFilter.tsx` -- Use locale for placeholder
- **Dependencies**: None

### TASK-33: WCAG 2.0 AA Accessibility
- **Agent**: 1
- **Complexity**: L
- **Description**: Full ARIA conformance for data grid pattern. `role="grid"` on container, `role="row"` on `<tr>`, `role="gridcell"` / `role="columnheader"` on cells. `aria-rowindex`, `aria-colindex` on every cell. `aria-selected` for selected cells/rows. `aria-sort` on sortable headers (already partial). `aria-expanded` for expandable rows. Live region for sort/filter/page change announcements. Focus management for keyboard navigation.
- **New Files**:
  - `packages/react/src/components/AriaLiveRegion.tsx` -- Hidden live region that announces table state changes (sort, filter, page) to screen readers
  - `packages/core/src/features/accessibility.ts` -- ARIA attribute generators: `getGridCellProps(row, col)`, `getColumnHeaderProps(header)`, `getRowProps(row)`
- **Modified Files**:
  - `packages/react/src/components/Table.tsx` -- Add `aria-label`, `aria-describedby`, render `<AriaLiveRegion>`
  - `packages/react/src/components/TableBody.tsx` -- Add `role="row"`, `aria-rowindex`, `aria-selected` to `<tr>`
  - `packages/react/src/components/TableCell.tsx` -- Add `role="gridcell"`, `aria-colindex`, `aria-readonly`, `aria-selected`
  - `packages/react/src/components/TableHeader.tsx` -- Add `role="columnheader"`, `aria-colindex`, ensure `aria-sort` is correct
  - `packages/react/src/components/Pagination.tsx` -- Add `nav` landmark, `aria-label="Pagination"`
- **Dependencies**: TASK-01 (keyboard navigation is required for accessibility)

### TASK-34: Pivot Mode
- **Agent**: 4
- **Complexity**: XL
- **Description**: Full pivot tables with auto-generated columns. User selects row fields, column fields, and value fields (with aggregation). Pivot engine generates cross-tabulation: row groups become rows, column groups become dynamic columns, values are aggregated at intersections. Expandable row/column groups.
- **New Files**:
  - `packages/core/src/features/pivot.ts` -- `PivotEngine`: takes flat data + pivot config, generates `{pivotRows, pivotColumns, values}`. Handles multi-level row/column grouping, subtotals, grand totals. Column generation from unique column field values. Value aggregation using existing `aggregationFns`
  - `packages/react/src/components/PivotConfig.tsx` -- UI for configuring pivot: drag fields between "rows", "columns", "values" zones
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `PivotConfig` type (`rowFields`, `colFields`, `valueFields` with aggregation), add `pivot?: PivotConfig` to `TableOptions`, add `enablePivot?: boolean`, add `getPivotRowModel()` to `Table`
  - `packages/core/src/core/table.ts` -- Add pivot row model step (replaces normal pipeline when pivot is active)
- **Dependencies**: None (uses existing grouping/aggregation infrastructure)
- **State Slice**: `pivot: PivotState`

### TASK-35: Formulas
- **Agent**: 2
- **Complexity**: XL
- **Description**: Spreadsheet-style cell formulas. Cells can contain formulas starting with `=`. Formula engine supports: arithmetic (`+`,`-`,`*`,`/`), cell references (`A1`, `B3`), range references (`A1:A10`), functions (`SUM()`, `AVG()`, `COUNT()`, `MIN()`, `MAX()`, `IF()`, `CONCAT()`). Dependency tracking for recalculation. Circular reference detection.
- **New Files**:
  - `packages/core/src/features/formulas/parser.ts` -- Formula parser: tokenizer and AST builder for formula expressions
  - `packages/core/src/features/formulas/evaluator.ts` -- AST evaluator: resolves cell references, computes arithmetic, calls built-in functions
  - `packages/core/src/features/formulas/functions.ts` -- Built-in formula functions (SUM, AVG, COUNT, MIN, MAX, IF, CONCAT, etc.)
  - `packages/core/src/features/formulas/engine.ts` -- Formula engine: dependency graph, topological sort for recalculation order, circular reference detection, formula cache
  - `packages/core/src/features/formulas/cellRef.ts` -- Cell reference parser (`A1` notation <-> `{row, col}` coordinates)
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `enableFormulas?: boolean` to `TableOptions`, add `FormulaState` to `TableState`, add `setFormula()`, `getFormulaValue()`, `getFormulaDependencies()` to `Table`
  - `packages/core/src/core/cell.ts` -- Override `getValue()` to evaluate formula when cell value starts with `=`
- **Dependencies**: None
- **State Slice**: `formulas: FormulaState`

---

## Phase 8 -- Beautiful Design System

### TASK-36: Theme Builder
- **Agent**: 5
- **Complexity**: L
- **Description**: Visual theme customization with CSS variables. Provide a `createTheme()` function that takes a partial token object and generates a CSS class with overrides. Support for light/dark variants in a single theme definition. Runtime theme switching without page reload.
- **New Files**:
  - `packages/themes/src/createTheme.ts` -- `createTheme(name, tokens)` generates a CSS class string from token overrides. `injectTheme(name, tokens)` injects a `<style>` tag at runtime. `ThemeTokens` type with all `--yable-*` variable names
  - `packages/react/src/hooks/useTheme.ts` -- React hook for dynamic theme management: switch themes, inject custom themes, read current theme tokens
- **Modified Files**:
  - `packages/themes/src/tokens.css` -- Document all available tokens with comments
  - `packages/core/src/types.ts` -- Add `theme?: string | ThemeConfig` to `TableOptions` (string = built-in name, object = custom tokens)
- **Dependencies**: None

### TASK-37: Multiple Built-in Themes
- **Agent**: 5
- **Complexity**: M
- **Description**: Add 4+ new distinct themes beyond current 3 (default, stripe, compact). New themes: `midnight` (dark-first design), `ocean` (blue/teal palette), `rose` (warm pink/rose palette), `forest` (green/earth tones), `mono` (grayscale professional). Each theme includes light and dark variants.
- **New Files**:
  - `packages/themes/src/themes/midnight.css` -- Dark-first theme with deep navy base, electric accents
  - `packages/themes/src/themes/ocean.css` -- Blue/teal palette with aqua accents
  - `packages/themes/src/themes/rose.css` -- Warm pink/rose palette with coral accents
  - `packages/themes/src/themes/forest.css` -- Green/earth tones with emerald accents
  - `packages/themes/src/themes/mono.css` -- Grayscale professional theme
- **Modified Files**:
  - `packages/themes/src/index.css` -- No change (themes are imported separately)
  - `packages/themes/package.json` -- Add exports for each new theme CSS file
- **Dependencies**: None

### TASK-38: Column Menu UI
- **Agent**: 3
- **Complexity**: M
- **Description**: Right-click or button menu on column headers. Menu items: Sort Ascending, Sort Descending, Clear Sort (separator) Pin Left, Pin Right, Unpin (separator) Auto-size Column, Auto-size All (separator) Hide Column, Show All Columns (separator) Group by Column. Extensible with custom items per column.
- **New Files**:
  - `packages/react/src/components/ColumnMenu.tsx` -- Column header dropdown menu component with built-in action items
  - `packages/react/src/components/ColumnMenuButton.tsx` -- Three-dot menu trigger button for column header
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `enableColumnMenu?: boolean` to `TableOptions`, add `columnMenuItems?: ColumnMenuItem[]` to `ColumnDefExtensions`
  - `packages/react/src/components/TableHeader.tsx` -- Render `<ColumnMenuButton>` in header cells when enabled
  - `packages/themes/src/base.css` -- Add `.yable-column-menu`, `.yable-column-menu-btn` styles
- **Dependencies**: TASK-05 (uses auto-size), reuses context menu styling from TASK-29

### TASK-39: Filter UI Components
- **Agent**: 3
- **Complexity**: L
- **Description**: Beautiful, purpose-built filter input components. Range slider for number columns (dual-handle). Date picker calendar for date columns. Multi-select with chips/tags for categorical columns. Clear/reset buttons. These are used inside floating filters, set filters, and the advanced filter builder.
- **New Files**:
  - `packages/react/src/components/filters/RangeSlider.tsx` -- Dual-handle range slider with labels, uses faceted min/max values
  - `packages/react/src/components/filters/DatePicker.tsx` -- Calendar date picker component (month grid, prev/next nav, range selection)
  - `packages/react/src/components/filters/MultiSelect.tsx` -- Multi-value select with tags/chips, dropdown with search, powered by faceted unique values
  - `packages/react/src/components/filters/FilterChip.tsx` -- Tag/chip component for showing active filter values
- **Modified Files**:
  - `packages/themes/src/base.css` -- Add `.yable-range-slider`, `.yable-date-picker`, `.yable-multi-select`, `.yable-filter-chip` styles
- **Dependencies**: TASK-16 (floating filters use these components)

### TASK-40: Grouped Header Collapse
- **Agent**: 3
- **Complexity**: S
- **Description**: Column groups (GroupColumnDef) can be collapsed to show only the group header, hiding all child columns. Toggle chevron on group header. Collapsed state persisted in table state. API: `table.toggleColumnGroupCollapsed(groupId)`.
- **New Files**:
  - `packages/core/src/features/groupedHeaderCollapse.ts` -- Manage collapsed group state, modify visible columns when group is collapsed, show group header with count badge
- **Modified Files**:
  - `packages/core/src/types.ts` -- Add `collapsedColumnGroups: Record<string, boolean>` to `TableState`, add `toggleColumnGroupCollapsed()` to `Table`
  - `packages/core/src/core/table.ts` -- Filter out child columns of collapsed groups from visible columns
  - `packages/react/src/components/TableHeader.tsx` -- Render collapse toggle on group header cells, show child count badge when collapsed
  - `packages/themes/src/base.css` -- Add `.yable-group-toggle`, `.yable-group-badge` styles
- **Dependencies**: None
- **State Slice**: `collapsedColumnGroups` (added to existing state)

---

## Dependency Graph

```
TASK-01 (Keyboard Nav) ─────┬──> TASK-02 (Cell Selection) ──┬──> TASK-03 (Clipboard)
                            │                               │──> TASK-10 (Fill Handle)
                            │                               └──> TASK-26 (Charts)
                            └──> TASK-33 (Accessibility)

TASK-04 (Undo/Redo)           [independent]
TASK-05 (Col Auto-Size)   ──> TASK-38 (Column Menu)
TASK-06 (Col Spanning)        [independent]
TASK-07 (Row Spanning)        [independent]
TASK-08 (Row Dragging)        [independent]
TASK-09 (Full Row Edit)       [independent]
TASK-11 (Loading Overlay)     [independent]
TASK-12 (No-Rows Overlay)     [independent]
TASK-13 (Cell Flashing)       [independent]
TASK-14 (Tooltips)            [independent]
TASK-15 (Row Animation)       [independent]
TASK-16 (Floating Filters)──> TASK-39 (Filter UI)
TASK-17 (Set Filter)          [independent]
TASK-18 (Adv Filter Builder)  [independent]
TASK-19 (Tree Data)           [independent]
TASK-20 (Master/Detail)       [independent]
TASK-21 (Excel Export)        [independent]
TASK-22 (Server-Side)    ──> TASK-23 (Infinite Scroll)
TASK-24 (Col Virtualization)  [independent]
TASK-25 (Sparklines)          [independent]
TASK-27 (Sidebar)             [independent]
TASK-28 (Status Bar)          [independent]
TASK-29 (Context Menu)        [independent]
TASK-30 (Print Layout)        [independent]
TASK-31 (RTL)                 [independent]
TASK-32 (i18n)                [independent]
TASK-34 (Pivot Mode)          [independent]
TASK-35 (Formulas)            [independent]
TASK-36 (Theme Builder)       [independent]
TASK-37 (Built-in Themes)     [independent]
TASK-40 (Header Collapse)     [independent]
```

---

## Agent Execution Order

### Agent 1 -- Keyboard & Selection & Accessibility
| Order | Task | Complexity | Depends On |
|-------|------|-----------|------------|
| 1 | TASK-01: Keyboard Navigation | XL | -- |
| 2 | TASK-02: Cell Range Selection | XL | TASK-01 |
| 3 | TASK-33: WCAG 2.0 AA Accessibility | L | TASK-01 |

**Total work**: 2 XL + 1 L

### Agent 2 -- Clipboard, Undo/Redo, Fill Handle, Formulas
| Order | Task | Complexity | Depends On |
|-------|------|-----------|------------|
| 1 | TASK-04: Undo/Redo | M | -- |
| 2 | TASK-03: Clipboard Support | L | TASK-02 (Agent 1) |
| 3 | TASK-10: Fill Handle | L | TASK-02 (Agent 1) |
| 4 | TASK-35: Formulas | XL | -- |

**Total work**: 1 XL + 2 L + 1 M
**Note**: Agent 2 starts with TASK-04 (no deps) while waiting for Agent 1 to finish TASK-02

### Agent 3 -- Column Features & Filters
| Order | Task | Complexity | Depends On |
|-------|------|-----------|------------|
| 1 | TASK-05: Column Auto-Size | M | -- |
| 2 | TASK-06: Column Spanning | L | -- |
| 3 | TASK-16: Floating Filters | M | -- |
| 4 | TASK-17: Set Filter | L | -- |
| 5 | TASK-38: Column Menu UI | M | TASK-05 |
| 6 | TASK-40: Grouped Header Collapse | S | -- |
| 7 | TASK-18: Advanced Filter Builder | XL | -- |
| 8 | TASK-39: Filter UI Components | L | TASK-16 |

**Total work**: 1 XL + 3 L + 3 M + 1 S

### Agent 4 -- Row Features & Tree/Pivot
| Order | Task | Complexity | Depends On |
|-------|------|-----------|------------|
| 1 | TASK-07: Row Spanning | L | -- |
| 2 | TASK-08: Row Dragging | L | -- |
| 3 | TASK-09: Full Row Editing | M | -- |
| 4 | TASK-19: Tree Data | XL | -- |
| 5 | TASK-20: Master/Detail | L | -- |
| 6 | TASK-34: Pivot Mode | XL | -- |

**Total work**: 2 XL + 3 L + 1 M

### Agent 5 -- Visual/UX, Design System, Enterprise Polish
| Order | Task | Complexity | Depends On |
|-------|------|-----------|------------|
| 1 | TASK-11: Loading Overlay | S | -- |
| 2 | TASK-12: No-Rows Overlay | S | -- |
| 3 | TASK-14: Tooltips | M | -- |
| 4 | TASK-28: Status Bar | S | -- |
| 5 | TASK-32: i18n / Localization | S | -- |
| 6 | TASK-13: Cell Flashing | M | -- |
| 7 | TASK-15: Row Animation | M | -- |
| 8 | TASK-37: Multiple Built-in Themes | M | -- |
| 9 | TASK-36: Theme Builder | L | -- |
| 10 | TASK-29: Context Menu UI | M | -- |
| 11 | TASK-27: Sidebar / Tool Panels | L | -- |
| 12 | TASK-30: Print Layout | M | -- |
| 13 | TASK-31: RTL Support | M | -- |

**Total work**: 2 L + 6 M + 4 S

### Agent 6 -- Advanced Features, Export, Charts
| Order | Task | Complexity | Depends On |
|-------|------|-----------|------------|
| 1 | TASK-21: Excel Export | L | -- |
| 2 | TASK-24: Column Virtualization | L | -- |
| 3 | TASK-25: Sparklines | M | -- |
| 4 | TASK-22: Server-Side Data Model | XL | -- |
| 5 | TASK-23: Infinite Scroll | L | TASK-22 |
| 6 | TASK-26: Integrated Charts | XL | TASK-02 (Agent 1) |

**Total work**: 2 XL + 3 L + 1 M

---

## Complexity Estimates

| Size | Meaning | Estimated Hours |
|------|---------|----------------|
| S | Small -- single file, < 100 lines, well-defined scope | 1-2h |
| M | Medium -- 2-3 files, 100-300 lines, some integration | 3-5h |
| L | Large -- 3-5 files, 300-600 lines, moderate integration | 5-8h |
| XL | Extra Large -- 5+ files, 600+ lines, complex logic, heavy integration | 8-16h |

### Summary
| Complexity | Count |
|-----------|-------|
| S | 5 |
| M | 13 |
| L | 14 |
| XL | 8 |
| **Total** | **40** |

---

## Shared File Modification Protocol

When multiple agents need to modify the same file, follow these rules:

### `packages/core/src/types.ts`
- Each agent APPENDS a clearly commented section block
- Pattern:
```typescript
// ---------------------------------------------------------------------------
// [Feature Name] — Added by Agent N
// ---------------------------------------------------------------------------
```
- New state fields go at the END of `TableState` interface
- New table methods go at the END of `Table` interface
- New column def extensions go at the END of `ColumnDefExtensions`
- NEVER modify existing type definitions

### `packages/core/src/core/table.ts`
- New state updaters: append after existing `wireUpdater()` calls (line ~594)
- New table methods: append to table instance object before the closing `return table` (line ~917)
- New memo computations: append after existing row model pipeline
- NEVER modify the existing row model pipeline chain order

### `packages/react/src/components/TableBody.tsx`
- Agent 1: Adds keyboard data attributes + focus state to `<tr>` and `<td>`
- Agent 4: Adds drag handle, tree toggle, master/detail rendering
- Agent 5: Adds row animation wrapper
- Each agent wraps/extends existing JSX -- never replaces it

### `packages/react/src/components/TableCell.tsx`
- Agent 1: Adds focus ring, `data-focused`, `tabIndex`
- Agent 2: Adds fill handle rendering
- Agent 5: Adds flash animation class, tooltip

### `packages/react/src/components/TableHeader.tsx`
- Agent 3: Adds floating filter row, column menu button, group collapse toggle
- Agent 5: Adds tooltip for headers

### `packages/themes/src/base.css`
- Each agent appends new CSS rules at the END of the file
- Each agent uses a unique comment header:
```css
/* ── [Feature Name] (Agent N) ───────────────────────────────── */
```

---

## Testing Strategy

Each feature should include:
1. **Unit tests** in `packages/core/src/features/__tests__/` for pure logic
2. **Integration test** added to `packages/core/src/core.test.ts` for state management
3. **Storybook story** in `stories/` for visual verification

Test file ownership follows agent ownership -- each agent creates test files for their features only.

---

## Build Verification

After all agents complete, run:
```bash
pnpm build          # Verify all packages compile
pnpm test:ci        # Run full test suite
pnpm typecheck      # TypeScript strict mode check
pnpm storybook:build # Verify storybook builds
```
