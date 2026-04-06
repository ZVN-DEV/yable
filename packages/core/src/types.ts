// ============================================================================
// @yable/core — Type Definitions
// ============================================================================

// ---------------------------------------------------------------------------
// Base Types
// ---------------------------------------------------------------------------

export type RowData = Record<string, any>

export type Updater<T> = T | ((prev: T) => T)

export type OnChangeFn<T> = (updater: Updater<T>) => void

export type NoInfer<T> = [T][T extends unknown ? 0 : never]

export type DeepKeys<T> = unknown extends T
  ? string
  : T extends Record<string, any>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, any>
          ? `${K}` | `${K}.${DeepKeys<T[K]>}`
          : `${K}`
      }[keyof T & string]
    : never

export type DeepValue<T, K> = K extends `${infer A}.${infer B}`
  ? A extends keyof T
    ? DeepValue<T[A], B>
    : never
  : K extends keyof T
    ? T[K]
    : never

// ---------------------------------------------------------------------------
// Feature System
// ---------------------------------------------------------------------------

export interface TableFeature<TData extends RowData = any> {
  getDefaultOptions?: (
    table: Table<TData>
  ) => Partial<TableOptionsResolved<TData>>

  getInitialState?: (state: TableState) => TableState

  getDefaultColumnDef?: () => Partial<ColumnDef<TData, unknown>>

  createTable?: (table: Table<TData>) => void
  createColumn?: (column: Column<TData, unknown>, table: Table<TData>) => void
  createRow?: (row: Row<TData>, table: Table<TData>) => void
  createCell?: (
    cell: Cell<TData, unknown>,
    column: Column<TData, unknown>,
    row: Row<TData>,
    table: Table<TData>
  ) => void
}

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

export type ColumnDefBase<TData extends RowData, TValue = unknown> = {
  id?: string
  header?: string | ((ctx: HeaderContext<TData, TValue>) => unknown)
  footer?: string | ((ctx: HeaderContext<TData, TValue>) => unknown)
  cell?: string | ((ctx: CellContext<TData, TValue>) => unknown)
  meta?: ColumnMeta
}

export type AccessorKeyColumnDef<
  TData extends RowData,
  TValue = unknown,
> = ColumnDefBase<TData, TValue> & {
  accessorKey: DeepKeys<TData> & string
  accessorFn?: never
} & ColumnDefExtensions<TData, TValue>

export type AccessorFnColumnDef<
  TData extends RowData,
  TValue = unknown,
> = ColumnDefBase<TData, TValue> & {
  accessorKey?: never
  accessorFn: (row: TData, index: number) => TValue
  id: string
} & ColumnDefExtensions<TData, TValue>

export type DisplayColumnDef<
  TData extends RowData,
  TValue = unknown,
> = ColumnDefBase<TData, TValue> & {
  accessorKey?: never
  accessorFn?: never
  id: string
} & ColumnDefExtensions<TData, TValue>

export type GroupColumnDef<
  TData extends RowData,
  TValue = unknown,
> = ColumnDefBase<TData, TValue> & {
  columns: ColumnDef<TData, any>[]
} & Partial<ColumnDefExtensions<TData, TValue>>

export type ColumnDef<TData extends RowData, TValue = unknown> =
  | AccessorKeyColumnDef<TData, TValue>
  | AccessorFnColumnDef<TData, TValue>
  | DisplayColumnDef<TData, TValue>
  | GroupColumnDef<TData, TValue>

export interface ColumnDefExtensions<TData extends RowData, TValue = unknown> {
  // Sizing
  size?: number
  minSize?: number
  maxSize?: number

  // Sorting
  enableSorting?: boolean
  sortingFn?: SortingFnOption<TData>
  sortDescFirst?: boolean
  sortUndefined?: false | -1 | 1 | 'first' | 'last'
  invertSorting?: boolean

  // Filtering
  enableColumnFilter?: boolean
  enableGlobalFilter?: boolean
  filterFn?: FilterFnOption<TData>

  // Visibility
  enableHiding?: boolean

  // Pinning
  enablePinning?: boolean

  // Resizing
  enableResizing?: boolean

  // Selection (for checkbox column)
  enableMultiRowSelection?: boolean

  // Grouping
  enableGrouping?: boolean
  getGroupingValue?: (row: TData) => unknown

  // Aggregation
  aggregationFn?: AggregationFnOption<TData>
  aggregatedCell?: string | ((ctx: CellContext<TData, TValue>) => unknown)

  // Cell editing
  editable?: boolean | ((row: Row<TData>) => boolean)
  editConfig?: CellEditConfig<TData, TValue>

  // Row spanning
  rowSpan?: (
    row: Row<TData>,
    rows: Row<TData>[],
    rowIndex: number
  ) => number | undefined

  // Styling
  cellClassName?:
    | string
    | ((ctx: CellContext<TData, TValue>) => string | undefined)
  headerClassName?: string
  footerClassName?: string

  // Tooltip
  tooltip?: boolean | string | ((ctx: CellContext<TData, TValue>) => string)
  headerTooltip?: string
  tooltipDelay?: number

  // Cell Flash
  enableCellFlash?: boolean
  flashDuration?: number
  flashUpColor?: string
  flashDownColor?: string
}

export interface ColumnMeta {
  alwaysEditable?: boolean
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Cell Edit Config
// ---------------------------------------------------------------------------

export type CellEditType =
  | 'text'
  | 'number'
  | 'select'
  | 'toggle'
  | 'date'
  | 'checkbox'
  | 'custom'

export interface CellEditConfig<TData extends RowData, TValue = unknown> {
  type: CellEditType
  options?: { label: string; value: unknown }[]
  getOptions?: (row: Row<TData>) => { label: string; value: unknown }[]
  validate?: (value: TValue, row: Row<TData>) => string | null
  parse?: (inputValue: string) => TValue
  format?: (value: TValue) => string
  placeholder?: string
  render?: (props: CellEditRenderProps<TData, TValue>) => unknown
}

export interface CellEditRenderProps<TData extends RowData, TValue = unknown> {
  value: TValue
  onChange: (value: TValue) => void
  onCommit: () => void
  onCancel: () => void
  row: Row<TData>
  column: Column<TData, TValue>
  isValid: boolean
  validationError: string | null
}

// ---------------------------------------------------------------------------
// Table Options
// ---------------------------------------------------------------------------

export interface TableOptions<TData extends RowData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  state?: Partial<TableState>
  onStateChange?: OnChangeFn<TableState>
  initialState?: Partial<TableState>
  getRowId?: (row: TData, index: number, parent?: Row<TData>) => string
  debugAll?: boolean

  // Locale
  locale?: Record<string, string>

  // Row model getters (provided by features)
  getCoreRowModel?: (table: Table<TData>) => () => RowModel<TData>
  getFilteredRowModel?: (table: Table<TData>) => () => RowModel<TData>
  getSortedRowModel?: (table: Table<TData>) => () => RowModel<TData>
  getPaginationRowModel?: (table: Table<TData>) => () => RowModel<TData>
  getGroupedRowModel?: (table: Table<TData>) => () => RowModel<TData>
  getExpandedRowModel?: (table: Table<TData>) => () => RowModel<TData>
  getFacetedRowModel?: (
    table: Table<TData>,
    columnId: string
  ) => () => RowModel<TData>
  getFacetedUniqueValues?: (
    table: Table<TData>,
    columnId: string
  ) => () => Map<unknown, number>
  getFacetedMinMaxValues?: (
    table: Table<TData>,
    columnId: string
  ) => () => [number, number] | undefined

  // Sorting options
  enableSorting?: boolean
  enableMultiSort?: boolean
  enableSortingRemoval?: boolean
  maxMultiSortColCount?: number
  manualSorting?: boolean
  sortingFns?: Record<string, SortingFn<TData>>
  onSortingChange?: OnChangeFn<SortingState>
  isMultiSortEvent?: (e: unknown) => boolean

  // Filtering options
  enableFilters?: boolean
  enableColumnFilters?: boolean
  enableGlobalFilter?: boolean
  manualFiltering?: boolean
  filterFns?: Record<string, FilterFn<TData>>
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  onGlobalFilterChange?: OnChangeFn<string>
  globalFilterFn?: FilterFnOption<TData>
  getColumnCanGlobalFilter?: (column: Column<TData, unknown>) => boolean

  // Pagination options
  manualPagination?: boolean
  pageCount?: number
  rowCount?: number
  autoResetPageIndex?: boolean
  onPaginationChange?: OnChangeFn<PaginationState>

  // Selection options
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
  enableMultiRowSelection?: boolean | ((row: Row<TData>) => boolean)
  enableSubRowSelection?: boolean | ((row: Row<TData>) => boolean)
  onRowSelectionChange?: OnChangeFn<RowSelectionState>

  // Visibility options
  enableHiding?: boolean
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>

  // Column ordering options
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>

  // Column pinning options
  enableColumnPinning?: boolean
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>

  // Column sizing options
  enableColumnResizing?: boolean
  columnResizeMode?: 'onChange' | 'onEnd'
  columnResizeDirection?: 'ltr' | 'rtl'
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>
  onColumnSizingInfoChange?: OnChangeFn<ColumnSizingInfoState>

  // Row expanding options
  enableExpanding?: boolean
  getSubRows?: (row: TData, index: number) => TData[] | undefined
  getRowCanExpand?: (row: Row<TData>) => boolean
  manualExpanding?: boolean
  paginateExpandedRows?: boolean
  onExpandedChange?: OnChangeFn<ExpandedState>
  renderDetailPanel?: (row: Row<TData>) => unknown

  // Row pinning options
  enableRowPinning?: boolean | ((row: Row<TData>) => boolean)
  keepPinnedRows?: boolean
  onRowPinningChange?: OnChangeFn<RowPinningState>

  // Grouping options
  enableGrouping?: boolean
  manualGrouping?: boolean
  onGroupingChange?: OnChangeFn<GroupingState>

  // Cell editing options
  enableCellEditing?: boolean
  onEditingChange?: OnChangeFn<EditingState>
  onEditCommit?: (changes: Record<string, Partial<TData>>) => void

  // Keyboard navigation options
  enableKeyboardNavigation?: boolean
  onKeyboardNavigationChange?: OnChangeFn<KeyboardNavigationState>

  // Virtualization options
  enableVirtualization?: boolean
  rowHeight?: number | ((index: number) => number)
  overscan?: number
  estimateRowHeight?: number
  /** Pre-computed row heights from Pretext measurement (Float64Array indexed by row) */
  pretextHeights?: Float64Array | null
  /** Pre-computed prefix sums for O(log n) scroll lookups */
  pretextPrefixSums?: Float64Array | null

  // Export options
  enableExport?: boolean

  // Undo/Redo options
  enableUndoRedo?: boolean
  undoStackSize?: number

  // Clipboard options
  enableClipboard?: boolean
  clipboardOptions?: ClipboardOptions

  // Fill Handle options
  enableFillHandle?: boolean

  // Formula options
  enableFormulas?: boolean

  // Row dragging options
  enableRowDragging?: boolean
  onRowReorder?: (event: { fromIndex: number; toIndex: number; rowId: string }) => void

  // Tree data options
  getDataPath?: (row: TData) => string[]
  treeData?: boolean

  // Pivot options
  enablePivot?: boolean
  pivotConfig?: PivotConfig

  // Row styling
  rowClassName?: string | ((row: Row<TData>) => string | undefined)
  rowStyle?: React.CSSProperties | ((row: Row<TData>) => React.CSSProperties)

  // Event handlers (adapters wire these to DOM events)
  onCellClick?: (event: CellClickEvent<TData>) => void
  onCellDoubleClick?: (event: CellClickEvent<TData>) => void
  onCellContextMenu?: (event: CellClickEvent<TData>) => void
  onRowClick?: (event: RowClickEvent<TData>) => void
  onRowDoubleClick?: (event: RowClickEvent<TData>) => void
  onRowContextMenu?: (event: RowClickEvent<TData>) => void
  onHeaderClick?: (event: HeaderClickEvent<TData>) => void
  onHeaderContextMenu?: (event: HeaderClickEvent<TData>) => void
}

export type TableOptionsResolved<TData extends RowData> = Required<
  Pick<TableOptions<TData>, 'data' | 'columns' | 'state' | 'onStateChange'>
> &
  Omit<TableOptions<TData>, 'data' | 'columns' | 'state' | 'onStateChange'>

// ---------------------------------------------------------------------------
// Table State
// ---------------------------------------------------------------------------

export interface TableState {
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
  keyboardNavigation: KeyboardNavigationState
  undoRedo: UndoRedoState
  fillHandle: FillHandleState
  formulas: FormulaState
  rowDrag: RowDragState
  pivot: PivotState
}

// Sorting
export type SortDirection = 'asc' | 'desc'

export interface ColumnSort {
  id: string
  desc: boolean
}

export type SortingState = ColumnSort[]

export type SortingFn<TData extends RowData> = (
  rowA: Row<TData>,
  rowB: Row<TData>,
  columnId: string
) => number

export type SortingFnOption<TData extends RowData> =
  | 'auto'
  | SortingFn<TData>
  | keyof BuiltInSortingFns
  | (string & {})

export interface BuiltInSortingFns {
  alphanumeric: SortingFn<any>
  alphanumericCaseSensitive: SortingFn<any>
  text: SortingFn<any>
  textCaseSensitive: SortingFn<any>
  datetime: SortingFn<any>
  basic: SortingFn<any>
}

// Filtering
export interface ColumnFilter {
  id: string
  value: unknown
}

export type ColumnFiltersState = ColumnFilter[]

export type FilterFn<TData extends RowData> = (
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
  addMeta: (meta: FilterMeta) => void
) => boolean

export type FilterFnOption<TData extends RowData> =
  | FilterFn<TData>
  | keyof BuiltInFilterFns
  | (string & {})

export interface BuiltInFilterFns {
  includesString: FilterFn<any>
  includesStringSensitive: FilterFn<any>
  equalsString: FilterFn<any>
  equalsStringSensitive: FilterFn<any>
  arrIncludes: FilterFn<any>
  arrIncludesAll: FilterFn<any>
  arrIncludesSome: FilterFn<any>
  equals: FilterFn<any>
  weakEquals: FilterFn<any>
  inNumberRange: FilterFn<any>
}

export interface FilterMeta {
  itemRank?: unknown
  [key: string]: unknown
}

// Pagination
export interface PaginationState {
  pageIndex: number
  pageSize: number
}

// Selection
export type RowSelectionState = Record<string, boolean>

// Visibility
export type VisibilityState = Record<string, boolean>

// Column Order
export type ColumnOrderState = string[]

// Column Pinning
export interface ColumnPinningState {
  left?: string[]
  right?: string[]
}

// Column Sizing
export type ColumnSizingState = Record<string, number>

export interface ColumnSizingInfoState {
  startOffset: number | null
  startSize: number | null
  deltaOffset: number | null
  deltaPercentage: number | null
  isResizingColumn: string | false
  columnSizingStart: [string, number][]
}

// Expanded
export type ExpandedState = Record<string, boolean> | true

// Row Pinning
export interface RowPinningState {
  top?: string[]
  bottom?: string[]
}

// Grouping
export type GroupingState = string[]

// Editing
export interface EditingState {
  activeCell?: { rowId: string; columnId: string }
  pendingValues: Record<string, Record<string, unknown>>
  /** Set of row IDs currently being edited in full-row mode */
  editingRows?: string[]
}

// Keyboard Navigation
export interface KeyboardNavigationCell {
  rowIndex: number
  columnIndex: number
}

export interface KeyboardNavigationState {
  focusedCell: KeyboardNavigationCell | null
}

export type KeyboardNavigationDirection = 'up' | 'down' | 'left' | 'right'

export type KeyboardNavigationAction =
  | {
      type: 'arrow'
      direction: KeyboardNavigationDirection
      ctrlKey?: boolean
    }
  | {
      type: 'tab'
      shiftKey?: boolean
    }
  | {
      type: 'home'
      ctrlKey?: boolean
    }
  | {
      type: 'end'
      ctrlKey?: boolean
    }
  | {
      type: 'page'
      direction: 'up' | 'down'
      pageSize: number
    }

// Undo/Redo
export interface UndoRedoState {
  undoStack: UndoAction[]
  redoStack: UndoAction[]
  maxSize: number
}

export interface UndoAction {
  type: 'cell-edit'
  rowId: string
  columnId: string
  oldValue: unknown
  newValue: unknown
  timestamp: number
}

// Row Drag
export interface RowDragState {
  /** The row id currently being dragged, or null */
  draggingRowId: string | null
  /** The row id that is the current drop target */
  overRowId: string | null
  /** Position of the drop indicator relative to the target row */
  dropPosition: 'before' | 'after' | null
}

// Pivot
export interface PivotConfig {
  /** Fields to use as row groups */
  rowFields: { field: string; label?: string }[]
  /** Fields to use as column groups (generate dynamic columns) */
  columnFields: { field: string; label?: string }[]
  /** Fields to aggregate as values */
  valueFields: {
    field: string
    aggregation: string | AggregationFn<any>
    label?: string
  }[]
  /** Whether to show row subtotals */
  showRowSubtotals?: boolean
  /** Whether to show column subtotals */
  showColumnSubtotals?: boolean
  /** Whether to show grand total row */
  showGrandTotal?: boolean
}

export interface PivotState {
  /** Whether pivot mode is active */
  enabled: boolean
  /** Pivot configuration */
  config: PivotConfig
  /** Expanded row groups (by path key) */
  expandedRowGroups: Record<string, boolean>
  /** Expanded column groups (by path key) */
  expandedColumnGroups: Record<string, boolean>
}

// Clipboard
export interface ClipboardOptions {
  /** Column delimiter for copy/paste. Default: '\t' (tab, for Excel compatibility) */
  delimiter?: string
  /** Row delimiter for copy/paste. Default: '\n' */
  rowDelimiter?: string
  /** Include column headers when copying. Default: false */
  includeHeaders?: boolean
}

// Fill Handle
export interface FillHandleState {
  /** Whether a fill drag is in progress */
  isDragging: boolean
  /** Source cell position (row index, column index) */
  sourceCell?: { rowIndex: number; columnIndex: number }
  /** Current drag target cell position */
  targetCell?: { rowIndex: number; columnIndex: number }
  /** Fill direction */
  direction?: 'down' | 'right' | 'up' | 'left'
}

// Formulas
export interface FormulaState {
  /** Whether formulas are enabled */
  enabled: boolean
  /** Map of cell ID -> raw formula string (e.g. '=SUM(A1:A10)') */
  formulas: Record<string, string>
  /** Map of cell ID -> computed value */
  computedValues: Record<string, unknown>
  /** Map of cell ID -> error message (if evaluation failed) */
  errors: Record<string, string>
}

// Aggregation
export type AggregationFn<TData extends RowData> = (
  columnId: string,
  leafRows: Row<TData>[],
  childRows: Row<TData>[]
) => unknown

export type AggregationFnOption<TData extends RowData> =
  | 'sum'
  | 'min'
  | 'max'
  | 'extent'
  | 'mean'
  | 'median'
  | 'unique'
  | 'uniqueCount'
  | 'count'
  | AggregationFn<TData>
  | (string & {})

// ---------------------------------------------------------------------------
// Table Instance
// ---------------------------------------------------------------------------

export interface Table<TData extends RowData> {
  _features: TableFeature<TData>[]
  options: TableOptionsResolved<TData>
  initialState: TableState

  // State
  getState: () => TableState
  setState: (updater: Updater<TableState>) => void
  setOptions: (newOptions: Updater<TableOptionsResolved<TData>>) => void
  reset: () => void

  // Column API
  getAllColumns: () => Column<TData, unknown>[]
  getAllFlatColumns: () => Column<TData, unknown>[]
  getAllLeafColumns: () => Column<TData, unknown>[]
  getColumn: (columnId: string) => Column<TData, unknown> | undefined
  getVisibleFlatColumns: () => Column<TData, unknown>[]
  getVisibleLeafColumns: () => Column<TData, unknown>[]
  getLeftVisibleLeafColumns: () => Column<TData, unknown>[]
  getRightVisibleLeafColumns: () => Column<TData, unknown>[]
  getCenterVisibleLeafColumns: () => Column<TData, unknown>[]

  // Header API
  getHeaderGroups: () => HeaderGroup<TData>[]
  getLeftHeaderGroups: () => HeaderGroup<TData>[]
  getRightHeaderGroups: () => HeaderGroup<TData>[]
  getCenterHeaderGroups: () => HeaderGroup<TData>[]
  getFooterGroups: () => HeaderGroup<TData>[]
  getLeftFooterGroups: () => HeaderGroup<TData>[]
  getRightFooterGroups: () => HeaderGroup<TData>[]
  getCenterFooterGroups: () => HeaderGroup<TData>[]

  // Row Model API
  getCoreRowModel: () => RowModel<TData>
  getRowModel: () => RowModel<TData>
  getRow: (id: string, searchAll?: boolean) => Row<TData>
  getFilteredRowModel: () => RowModel<TData>
  getPreFilteredRowModel: () => RowModel<TData>
  getSortedRowModel: () => RowModel<TData>
  getPreSortedRowModel: () => RowModel<TData>
  getPaginationRowModel: () => RowModel<TData>
  getPrePaginationRowModel: () => RowModel<TData>
  getGroupedRowModel: () => RowModel<TData>
  getPreGroupedRowModel: () => RowModel<TData>
  getExpandedRowModel: () => RowModel<TData>
  getPreExpandedRowModel: () => RowModel<TData>

  // Pagination API
  getPageCount: () => number
  getRowCount: () => number
  getCanPreviousPage: () => boolean
  getCanNextPage: () => boolean
  previousPage: () => void
  nextPage: () => void
  firstPage: () => void
  lastPage: () => void
  setPagination: (updater: Updater<PaginationState>) => void
  setPageIndex: (updater: Updater<number>) => void
  setPageSize: (size: number) => void
  resetPageIndex: (defaultState?: boolean) => void
  resetPageSize: (defaultState?: boolean) => void
  resetPagination: (defaultState?: boolean) => void

  // Sorting API
  setSorting: (updater: Updater<SortingState>) => void
  resetSorting: (defaultState?: boolean) => void

  // Filtering API
  setColumnFilters: (updater: Updater<ColumnFiltersState>) => void
  resetColumnFilters: (defaultState?: boolean) => void
  setGlobalFilter: (updater: Updater<string>) => void
  resetGlobalFilter: (defaultState?: boolean) => void

  // Selection API
  getSelectedRowModel: () => RowModel<TData>
  getFilteredSelectedRowModel: () => RowModel<TData>
  getGroupedSelectedRowModel: () => RowModel<TData>
  getIsAllRowsSelected: () => boolean
  getIsSomeRowsSelected: () => boolean
  getIsAllPageRowsSelected: () => boolean
  getIsSomePageRowsSelected: () => boolean
  toggleAllRowsSelected: (value?: boolean) => void
  toggleAllPageRowsSelected: (value?: boolean) => void
  setRowSelection: (updater: Updater<RowSelectionState>) => void
  resetRowSelection: (defaultState?: boolean) => void

  // Visibility API
  setColumnVisibility: (updater: Updater<VisibilityState>) => void
  resetColumnVisibility: (defaultState?: boolean) => void
  toggleAllColumnsVisible: (value?: boolean) => void
  getIsAllColumnsVisible: () => boolean
  getIsSomeColumnsVisible: () => boolean

  // Column Order API
  setColumnOrder: (updater: Updater<ColumnOrderState>) => void
  resetColumnOrder: (defaultState?: boolean) => void

  // Column Pinning API
  setColumnPinning: (updater: Updater<ColumnPinningState>) => void
  resetColumnPinning: (defaultState?: boolean) => void
  getIsSomeColumnsPinned: (position?: 'left' | 'right') => boolean

  // Column Sizing API
  setColumnSizing: (updater: Updater<ColumnSizingState>) => void
  setColumnSizingInfo: (updater: Updater<ColumnSizingInfoState>) => void
  resetColumnSizing: (defaultState?: boolean) => void
  getTotalSize: () => number
  getLeftTotalSize: () => number
  getRightTotalSize: () => number
  getCenterTotalSize: () => number

  // Expanding API
  setExpanded: (updater: Updater<ExpandedState>) => void
  toggleAllRowsExpanded: (expanded?: boolean) => void
  resetExpanded: (defaultState?: boolean) => void
  getCanSomeRowsExpand: () => boolean
  getIsAllRowsExpanded: () => boolean
  getIsSomeRowsExpanded: () => boolean
  getExpandedDepth: () => number

  // Row Pinning API
  setRowPinning: (updater: Updater<RowPinningState>) => void
  resetRowPinning: (defaultState?: boolean) => void
  getTopRows: () => Row<TData>[]
  getBottomRows: () => Row<TData>[]
  getCenterRows: () => Row<TData>[]

  // Grouping API
  setGrouping: (updater: Updater<GroupingState>) => void
  resetGrouping: (defaultState?: boolean) => void

  // Editing API
  startEditing: (rowId: string, columnId: string) => void
  commitEdit: () => void
  cancelEdit: () => void
  setPendingValue: (
    rowId: string,
    columnId: string,
    value: unknown
  ) => void
  getPendingValue: (rowId: string, columnId: string) => unknown | undefined
  getPendingRow: (rowId: string) => Partial<TData> | undefined
  getAllPendingChanges: () => Record<string, Partial<TData>>
  hasPendingChanges: () => boolean
  commitAllPending: () => void
  discardAllPending: () => void
  getValidationErrors: () => Record<string, Record<string, string>>
  isValid: () => boolean
  setEditing: (updater: Updater<EditingState>) => void
  resetEditing: (defaultState?: boolean) => void

  // Keyboard Navigation API
  getFocusedCell: () => KeyboardNavigationCell | null
  setFocusedCell: (cell: KeyboardNavigationCell | null) => void
  clearFocusedCell: () => void
  moveFocus: (action: KeyboardNavigationAction) => KeyboardNavigationCell | null
  setKeyboardNavigation: (updater: Updater<KeyboardNavigationState>) => void
  resetKeyboardNavigation: (defaultState?: boolean) => void

  // Export API
  exportData: (options?: ExportOptions) => string

  // Undo/Redo API
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearUndoHistory: () => void

  // Clipboard API
  copyToClipboard: (options?: ClipboardOptions) => string
  pasteFromClipboard: (text: string, targetRowId: string, targetColumnId: string, options?: ClipboardOptions) => void
  cutCells: (options?: ClipboardOptions) => string

  // Fill Handle API
  fillRange: (
    sourceRange: { startRow: number; startCol: number; endRow: number; endCol: number },
    targetRange: { startRow: number; startCol: number; endRow: number; endCol: number }
  ) => void

  // Formula API
  setFormula: (rowId: string, columnId: string, formula: string) => void
  getFormula: (rowId: string, columnId: string) => string | undefined
  evaluateFormulas: () => void

  // Row Dragging API
  moveRow: (fromIndex: number, toIndex: number) => void

  // Row Editing API (full row)
  startRowEditing: (rowId: string) => void
  commitRowEdit: (rowId: string) => void
  cancelRowEdit: (rowId: string) => void

  // Pivot API
  getPivotRowModel: () => RowModel<TData>

  // Event Emitter
  events: EventEmitter<YableEventMap<TData>>

  // Locale API
  getLocaleString: (key: string) => string
}

// ---------------------------------------------------------------------------
// Row Model
// ---------------------------------------------------------------------------

export interface RowModel<TData extends RowData> {
  rows: Row<TData>[]
  flatRows: Row<TData>[]
  rowsById: Record<string, Row<TData>>
}

// ---------------------------------------------------------------------------
// Column Instance
// ---------------------------------------------------------------------------

export interface Column<TData extends RowData, TValue = unknown> {
  id: string
  depth: number
  columnDef: ColumnDef<TData, TValue>
  columns: Column<TData, unknown>[]
  parent?: Column<TData, unknown>

  // Value access
  accessorFn?: (row: TData, index: number) => TValue

  // Column tree traversal
  getFlatColumns: () => Column<TData, unknown>[]
  getLeafColumns: () => Column<TData, unknown>[]

  // Sizing
  getSize: () => number
  getStart: (position?: ColumnPinningPosition) => number
  getAfter: (position?: ColumnPinningPosition) => number
  getCanResize: () => boolean
  getIsResizing: () => boolean
  resetSize: () => void

  // Sorting
  getCanSort: () => boolean
  getCanMultiSort: () => boolean
  getAutoSortingFn: () => SortingFn<TData>
  getAutoSortDir: () => SortDirection
  getSortingFn: () => SortingFn<TData>
  getNextSortingOrder: () => SortDirection | false
  getIsSorted: () => false | SortDirection
  getSortIndex: () => number
  clearSorting: () => void
  toggleSorting: (desc?: boolean, isMulti?: boolean) => void
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined

  // Filtering
  getCanFilter: () => boolean
  getCanGlobalFilter: () => boolean
  getIsFiltered: () => boolean
  getFilterValue: () => unknown
  getFilterIndex: () => number
  setFilterValue: (value: unknown) => void
  getAutoFilterFn: () => FilterFn<TData> | undefined
  getFilterFn: () => FilterFn<TData> | undefined

  // Visibility
  getCanHide: () => boolean
  getIsVisible: () => boolean
  toggleVisibility: (value?: boolean) => void
  getToggleVisibilityHandler: () => (event: unknown) => void

  // Pinning
  getCanPin: () => boolean
  getIsPinned: () => ColumnPinningPosition | false
  pin: (position: ColumnPinningPosition) => void
  getPinnedIndex: () => number

  // Faceting
  getFacetedRowModel: () => RowModel<TData>
  getFacetedUniqueValues: () => Map<unknown, number>
  getFacetedMinMaxValues: () => [number, number] | undefined

  // Grouping
  getCanGroup: () => boolean
  getIsGrouped: () => boolean
  getGroupedIndex: () => number
  toggleGrouping: () => void
  getAutoAggregationFn: () => AggregationFn<TData> | undefined
  getAggregationFn: () => AggregationFn<TData> | undefined
}

export type ColumnPinningPosition = 'left' | 'right' | false

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export interface Header<TData extends RowData, TValue = unknown> {
  id: string
  index: number
  depth: number
  column: Column<TData, TValue>
  headerGroup: HeaderGroup<TData>
  subHeaders: Header<TData, unknown>[]
  colSpan: number
  rowSpan: number
  isPlaceholder: boolean
  placeholderId?: string
  getLeafHeaders: () => Header<TData, unknown>[]
  getSize: () => number
  getStart: (position?: ColumnPinningPosition) => number
  getContext: () => HeaderContext<TData, TValue>
  getResizeHandler: () => ((event: unknown) => void) | undefined
}

export interface HeaderGroup<TData extends RowData> {
  id: string
  depth: number
  headers: Header<TData, unknown>[]
}

export interface HeaderContext<TData extends RowData, TValue = unknown> {
  table: Table<TData>
  header: Header<TData, TValue>
  column: Column<TData, TValue>
}

// ---------------------------------------------------------------------------
// Row Instance
// ---------------------------------------------------------------------------

export interface Row<TData extends RowData> {
  id: string
  index: number
  original: TData
  depth: number
  parentId?: string
  subRows: Row<TData>[]

  // Value access
  getValue: <TValue = unknown>(columnId: string) => TValue
  renderValue: <TValue = unknown>(columnId: string) => TValue
  getAllCells: () => Cell<TData, unknown>[]
  getVisibleCells: () => Cell<TData, unknown>[]
  getLeftVisibleCells: () => Cell<TData, unknown>[]
  getRightVisibleCells: () => Cell<TData, unknown>[]
  getCenterVisibleCells: () => Cell<TData, unknown>[]

  // Selection
  getIsSelected: () => boolean
  getIsSomeSelected: () => boolean
  getIsAllSubRowsSelected: () => boolean
  getCanSelect: () => boolean
  getCanMultiSelect: () => boolean
  getCanSelectSubRows: () => boolean
  toggleSelected: (value?: boolean, opts?: { selectChildren?: boolean }) => void
  getToggleSelectedHandler: () => (event: unknown) => void

  // Expanding
  getIsExpanded: () => boolean
  getCanExpand: () => boolean
  getIsGrouped: () => boolean
  toggleExpanded: (expanded?: boolean) => void
  getToggleExpandedHandler: () => (event: unknown) => void

  // Pinning
  getIsPinned: () => RowPinningPosition | false
  getCanPin: () => boolean
  pin: (position: RowPinningPosition, includeLeafRows?: boolean, includeParentRows?: boolean) => void

  // Grouping
  groupingColumnId?: string
  groupingValue?: unknown
  getGroupingValue: (columnId: string) => unknown
  getLeafRows: () => Row<TData>[]

  // Tree data extensions
  getParentRow: () => Row<TData> | undefined
  getTreeDepth: () => number
  isLeaf: () => boolean
}

export type RowPinningPosition = 'top' | 'bottom' | false

// ---------------------------------------------------------------------------
// Cell Instance
// ---------------------------------------------------------------------------

export interface Cell<TData extends RowData, TValue = unknown> {
  id: string
  row: Row<TData>
  column: Column<TData, TValue>

  getValue: () => TValue
  renderValue: () => TValue
  getContext: () => CellContext<TData, TValue>

  // Editing
  getIsEditing: () => boolean
  getIsAlwaysEditable: () => boolean

  // Row spanning
  getRowSpan: () => number | undefined
}

export interface CellContext<TData extends RowData, TValue = unknown> {
  table: Table<TData>
  column: Column<TData, TValue>
  row: Row<TData>
  cell: Cell<TData, TValue>
  getValue: () => TValue
  renderValue: () => TValue
}

// ---------------------------------------------------------------------------
// Event System Types
// ---------------------------------------------------------------------------

export interface EventEmitter<TEventMap extends Record<string, any>> {
  on: <K extends keyof TEventMap>(
    event: K,
    handler: (payload: TEventMap[K]) => void
  ) => () => void

  off: <K extends keyof TEventMap>(
    event: K,
    handler: (payload: TEventMap[K]) => void
  ) => void

  emit: <K extends keyof TEventMap>(
    event: K,
    payload: TEventMap[K]
  ) => void

  removeAllListeners: (event?: keyof TEventMap) => void
}

export interface YableEventMap<TData extends RowData> {
  'cell:click': CellClickEvent<TData>
  'cell:dblclick': CellClickEvent<TData>
  'cell:contextmenu': CellClickEvent<TData>
  'row:click': RowClickEvent<TData>
  'row:dblclick': RowClickEvent<TData>
  'row:contextmenu': RowClickEvent<TData>
  'header:click': HeaderClickEvent<TData>
  'header:contextmenu': HeaderClickEvent<TData>
  'cell:edit:start': CellEditEvent<TData>
  'cell:edit:commit': CellEditEvent<TData>
  'cell:edit:cancel': CellEditEvent<TData>
  'selection:change': SelectionChangeEvent<TData>
  'sort:change': SortChangeEvent
  'filter:change': FilterChangeEvent
  'page:change': PageChangeEvent
  'state:change': StateChangeEvent
  'undo': UndoRedoEvent
  'redo': UndoRedoEvent
  'clipboard:copy': ClipboardEvent_
  'clipboard:paste': ClipboardEvent_
  'clipboard:cut': ClipboardEvent_
  'fill': FillEvent
  'cell:flash': CellFlashEvent
  'row:drag:start': RowDragEvent<TData>
  'row:drag:end': RowDragEndEvent<TData>
  'row:reorder': RowReorderEvent
  'row:edit:start': RowEditEvent<TData>
  'row:edit:commit': RowEditCommitEvent<TData>
  'row:edit:cancel': RowEditEvent<TData>
}

export interface CellClickEvent<TData extends RowData> {
  cell: Cell<TData, unknown>
  row: Row<TData>
  column: Column<TData, unknown>
  originalEvent?: unknown
}

export interface RowClickEvent<TData extends RowData> {
  row: Row<TData>
  cells: Cell<TData, unknown>[]
  originalEvent?: unknown
}

export interface HeaderClickEvent<TData extends RowData> {
  column: Column<TData, unknown>
  header: Header<TData, unknown>
  originalEvent?: unknown
}

export interface CellEditEvent<TData extends RowData> {
  cell: Cell<TData, unknown>
  row: Row<TData>
  column: Column<TData, unknown>
  value: unknown
  previousValue?: unknown
}

export interface SelectionChangeEvent<TData extends RowData> {
  selection: RowSelectionState
  selectedRows: Row<TData>[]
}

export interface SortChangeEvent {
  sorting: SortingState
}

export interface FilterChangeEvent {
  columnFilters: ColumnFiltersState
  globalFilter: string
}

export interface PageChangeEvent {
  pagination: PaginationState
}

export interface StateChangeEvent {
  state: TableState
  previousState: TableState
}

export interface UndoRedoEvent {
  action: UndoAction
  state: UndoRedoState
}

export interface ClipboardEvent_ {
  text: string
  cells: { rowId: string; columnId: string; value: unknown }[]
}

export interface FillEvent {
  sourceRange: { startRow: number; startCol: number; endRow: number; endCol: number }
  targetRange: { startRow: number; startCol: number; endRow: number; endCol: number }
  filledValues: { rowId: string; columnId: string; value: unknown }[]
}

export interface CellFlashEvent {
  columnId: string
  rowId: string
  direction: 'up' | 'down' | 'change'
  previousValue: unknown
  newValue: unknown
  timestamp: number
}

// ---------------------------------------------------------------------------
// Export Options
// ---------------------------------------------------------------------------

export interface ExportOptions {
  format?: 'csv' | 'json'
  allRows?: boolean
  columns?: string[]
  includeHeaders?: boolean
  delimiter?: string
  fileName?: string
}

// ---------------------------------------------------------------------------
// Row Drag Events
// ---------------------------------------------------------------------------

export interface RowDragEvent<TData extends RowData> {
  rowId: string
  rowIndex: number
  row: Row<TData>
}

export interface RowDragEndEvent<TData extends RowData> {
  rowId: string
  row: Row<TData>
  cancelled: boolean
}

export interface RowReorderEvent {
  fromIndex: number
  toIndex: number
  rowId: string
}

// ---------------------------------------------------------------------------
// Row Edit Events
// ---------------------------------------------------------------------------

export interface RowEditEvent<TData extends RowData> {
  rowId: string
  row: Row<TData>
}

export interface RowEditCommitEvent<TData extends RowData> {
  rowId: string
  row: Row<TData>
  values: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Column Helper
// ---------------------------------------------------------------------------

export interface ColumnHelper<TData extends RowData> {
  accessor: <
    TAccessor extends DeepKeys<TData> | ((row: TData) => unknown),
    TValue extends TAccessor extends (...args: any) => infer R
      ? R
      : TAccessor extends DeepKeys<TData>
        ? DeepValue<TData, TAccessor>
        : never,
  >(
    accessor: TAccessor,
    column: TAccessor extends (...args: any) => any
      ? Omit<AccessorFnColumnDef<TData, TValue>, 'accessorFn'>
      : Omit<AccessorKeyColumnDef<TData, TValue>, 'accessorKey'>
  ) => ColumnDef<TData, TValue>

  display: (column: DisplayColumnDef<TData>) => ColumnDef<TData, unknown>
  group: (column: GroupColumnDef<TData>) => ColumnDef<TData, unknown>
}

// ---------------------------------------------------------------------------
// React Types (for rowStyle prop — keep minimal)
// ---------------------------------------------------------------------------

declare namespace React {
  interface CSSProperties {
    [key: string]: string | number | undefined
  }
}
