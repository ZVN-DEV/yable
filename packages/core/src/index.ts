// @zvndev/yable-core — Framework-agnostic table engine

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  // Base
  RowData,
  Updater,
  OnChangeFn,
  DeepKeys,
  DeepValue,

  // Feature system
  TableFeature,

  // Column definitions
  ColumnDef,
  ColumnDefBase,
  ColumnDefExtensions,
  AccessorKeyColumnDef,
  AccessorFnColumnDef,
  DisplayColumnDef,
  GroupColumnDef,
  ColumnMeta,
  CellEditType,
  CellEditConfig,
  CellEditRenderProps,

  // Table
  TableOptions,
  TableOptionsResolved,
  Table,
  TableState,

  // State slices
  SortDirection,
  ColumnSort,
  SortingState,
  SortingFn,
  SortingFnOption,
  ColumnFilter,
  ColumnFiltersState,
  FilterFn,
  FilterFnOption,
  FilterMeta,
  PaginationState,
  RowSelectionState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnSizingInfoState,
  ExpandedState,
  RowPinningState,
  GroupingState,
  EditingState,
  KeyboardNavigationCell,
  KeyboardNavigationState,
  KeyboardNavigationDirection,
  KeyboardNavigationAction,
  AggregationFn,
  AggregationFnOption,

  // Column
  Column,
  ColumnPinningPosition,

  // Header
  Header,
  HeaderGroup,
  HeaderContext,

  // Row
  Row,
  RowPinningPosition,
  RowModel,

  // Cell
  Cell,
  CellContext,

  // Events
  EventEmitter,
  YableEventMap,
  CellClickEvent,
  RowClickEvent,
  HeaderClickEvent,
  CellEditEvent,
  SelectionChangeEvent,
  SortChangeEvent,
  FilterChangeEvent,
  PageChangeEvent,
  StateChangeEvent,
  RowEditEvent,
  RowEditCommitEvent,
  CellFlashEvent,
  RowDragEvent,
  RowDragEndEvent,
  RowReorderEvent,
  ClipboardOptions,

  // Feature state types
  UndoRedoState,
  UndoAction,
  FillHandleState,
  FormulaState,
  RowDragState,
  PivotState,
  PivotConfig,

  // Export
  ExportOptions,

  // Column Helper
  ColumnHelper,
} from './types'

// ---------------------------------------------------------------------------
// Core Engine
// ---------------------------------------------------------------------------

export { createTable } from './core/table'
export { resolveSortingFn, resolveFilterFn } from './core/resolvers'
export { createColumn } from './core/column'
export { createRow } from './core/row'
export { createCell } from './core/cell'
export { buildHeaderGroups, createHeader } from './core/headers'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export {
  functionalUpdate,
  memo,
  getDeepValue,
  resolveColumnId,
  resolveRowId,
  getCellValue,
  shallowEqual,
  makeStateUpdater,
  noop,
  identity,
  isFunction,
  range,
  flattenBy,
  uniqueBy,
  clamp,
} from './utils'

// ---------------------------------------------------------------------------
// Column Helper
// ---------------------------------------------------------------------------

export { createColumnHelper } from './columnHelper'

// ---------------------------------------------------------------------------
// Built-in Functions
// ---------------------------------------------------------------------------

export { sortingFns } from './sortingFns'
export type { BuiltInSortingFn } from './sortingFns'

export { filterFns } from './filterFns'
export type { BuiltInFilterFn } from './filterFns'

export { aggregationFns } from './aggregationFns'
export type { BuiltInAggregationFn } from './aggregationFns'

// ---------------------------------------------------------------------------
// Event System
// ---------------------------------------------------------------------------

export { EventEmitterImpl } from './events/EventEmitter'

// ---------------------------------------------------------------------------
// Features (re-exports)
// ---------------------------------------------------------------------------

export { detectCellChanges } from './features/cellFlash'
export type { CellFlashInfo } from './features/cellFlash'
export {
  canCellEnterEditMode,
  getCellPositionByIds,
  getFirstKeyboardCell,
  getLastKeyboardCell,
  getNextFocusedCell,
  getResolvedFocusedCell,
  normalizeFocusedCell,
} from './features/keyboardNavigation'
export type { ResolvedKeyboardNavigationCell } from './features/keyboardNavigation'

// ---------------------------------------------------------------------------
// Locale / i18n
// ---------------------------------------------------------------------------

export { en } from './i18n/en'
export type { YableLocale } from './i18n/en'
export {
  createLocale,
  setDefaultLocale,
  getDefaultLocale,
  resetLocale,
} from './i18n/locales'
export type { PartialLocale } from './i18n/locales'

// ---------------------------------------------------------------------------
// Async Commit (Task #10)
// ---------------------------------------------------------------------------
export { CommitError } from './features/commits/CommitError'
export type { CommitErrorCells } from './features/commits/CommitError'
export type {
  CellStatus,
  CellPatch,
  CommitResult,
  CommitRecord,
  CommitsSlice,
  OnCommitFn,
} from './features/commits/types'
export { createCommitCoordinator } from './features/commits/coordinator'
export type {
  CommitStore,
  CoordinatorOptions,
  CommitCoordinator,
} from './features/commits/coordinator'
