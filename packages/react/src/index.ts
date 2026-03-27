// @yable/react — React adapter for YableTables

// Re-export core types consumers will need
export type {
  RowData,
  ColumnDef,
  ColumnDefBase,
  AccessorKeyColumnDef,
  AccessorFnColumnDef,
  DisplayColumnDef,
  GroupColumnDef,
  TableOptions,
  TableOptionsResolved,
  Table as TableInstance,
  Row,
  Cell,
  Column,
  Header,
  HeaderGroup,
  CellContext,
  HeaderContext,
  TableState,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  ExpandedState,
  ColumnOrderState,
  ColumnPinningState,
  RowPinningState,
  VisibilityState,
  ColumnSizingState,
  ColumnSizingInfoState,
  EditingState,
  Updater,
  OnChangeFn,
  SortDirection,
  SortingFn,
  FilterFn,
  AggregationFn,
  ColumnMeta,
  UndoRedoState,
  UndoAction,
  ClipboardOptions,
  FillHandleState,
  FormulaState,
  RowDragState,
  PivotConfig,
  PivotState,
  RowDragEvent,
  RowDragEndEvent,
  RowReorderEvent,
  RowEditEvent,
  RowEditCommitEvent,
  CellFlashEvent,
} from '@yable/core'

// Re-export core utilities
export {
  createColumnHelper,
  sortingFns,
  filterFns,
  aggregationFns,
  functionalUpdate,
} from '@yable/core'

// Re-export i18n
export {
  en,
  createLocale,
  setDefaultLocale,
  getDefaultLocale,
  resetLocale,
} from '@yable/core'

export type {
  YableLocale,
  PartialLocale,
} from '@yable/core'

// React-specific types
export type {
  TableProps,
  TableRowProps,
  TableCellProps,
  TableHeaderCellProps,
  StatusBarPanelConfig,
  StatusBarPanelProps,
} from './types'

// Hooks
export { useTable } from './useTable'
export { useVirtualization } from './hooks/useVirtualization'
export type {
  VirtualRow,
  UseVirtualizationOptions,
  UseVirtualizationResult,
} from './hooks/useVirtualization'

// Context
export { useTableContext, TableProvider } from './context'

// Components
export { Table } from './components/Table'
export { TableHeader } from './components/TableHeader'
export { TableBody } from './components/TableBody'
export { TableCell } from './components/TableCell'
export { TableFooter } from './components/TableFooter'
export { Pagination } from './components/Pagination'
export { GlobalFilter } from './components/GlobalFilter'
export { SortIndicator } from './components/SortIndicator'
export { ErrorBoundary, CellErrorBoundary } from './components/ErrorBoundary'

// Form components
export { CellInput } from './form/CellInput'
export { CellSelect } from './form/CellSelect'
export { CellCheckbox } from './form/CellCheckbox'
export { CellToggle } from './form/CellToggle'
export { CellDatePicker } from './form/CellDatePicker'

// Feature hooks
export { useClipboard } from './hooks/useClipboard'
export type { UseClipboardOptions } from './hooks/useClipboard'
export { useFillHandle } from './hooks/useFillHandle'
export type { FillHandleDragState, UseFillHandleOptions, UseFillHandleReturn } from './hooks/useFillHandle'

// Feature components
export { FillHandle } from './components/FillHandle'
export type { FillHandleProps } from './components/FillHandle'

// Row Dragging
export { DragHandle } from './components/DragHandle'
export { useRowDrag } from './hooks/useRowDrag'
export type { UseRowDragOptions, UseRowDragReturn } from './hooks/useRowDrag'

// Tree Data
export { TreeToggle } from './components/TreeToggle'

// Master/Detail
export { MasterDetail } from './components/MasterDetail'
export { ExpandIcon } from './components/ExpandIcon'

// Pivot
export { PivotConfigPanel } from './components/PivotConfig'
export type {
  PivotConfigProps,
  PivotFieldItem,
  PivotValueItem,
} from './components/PivotConfig'

// Loading Overlay
export { LoadingOverlay } from './components/LoadingOverlay'
export type { LoadingOverlayProps } from './components/LoadingOverlay'

// No Rows Overlay
export { NoRowsOverlay } from './components/NoRowsOverlay'
export type { NoRowsOverlayProps } from './components/NoRowsOverlay'

// Tooltip
export { Tooltip } from './components/Tooltip'
export type { TooltipProps } from './components/Tooltip'
export { useTooltip } from './hooks/useTooltip'
export type { UseTooltipOptions, TooltipPosition } from './hooks/useTooltip'

// Status Bar
export { StatusBar } from './components/StatusBar'
export { StatusBarPanelComponent } from './components/StatusBarPanel'
export type { StatusBarPanelComponentProps } from './components/StatusBarPanel'

// Cell Flash
export { FlashCell } from './components/FlashCell'
export { useCellFlash } from './hooks/useCellFlash'
export type { UseCellFlashOptions } from './hooks/useCellFlash'

// Row Animation
export { useRowAnimation } from './hooks/useRowAnimation'
export type { UseRowAnimationOptions } from './hooks/useRowAnimation'

// Context Menu
export { ContextMenu } from './components/ContextMenu'
export { ContextMenuItem } from './components/ContextMenuItem'
export type { ContextMenuItemDef } from './components/ContextMenuItem'
export { useContextMenu } from './hooks/useContextMenu'

// Sidebar / Tool Panels
export { Sidebar } from './components/Sidebar'
export { ColumnsPanel } from './components/ColumnsPanel'
export { FiltersPanel } from './components/FiltersPanel'

// Print Layout
export { PrintLayout } from './components/PrintLayout'
export { usePrintLayout } from './hooks/usePrintLayout'
export type { UsePrintLayoutOptions } from './hooks/usePrintLayout'

// Theme
export { useTheme } from './hooks/useTheme'
export type { UseThemeOptions } from './hooks/useTheme'
