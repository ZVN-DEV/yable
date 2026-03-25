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
} from '@yable/core'

// Re-export core utilities
export {
  createColumnHelper,
  sortingFns,
  filterFns,
  aggregationFns,
  functionalUpdate,
} from '@yable/core'

// React-specific types
export type {
  TableProps,
  TableRowProps,
  TableCellProps,
  TableHeaderCellProps,
} from './types'

// Hook
export { useTable } from './useTable'

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

// Form components
export { CellInput } from './form/CellInput'
export { CellSelect } from './form/CellSelect'
export { CellCheckbox } from './form/CellCheckbox'
export { CellToggle } from './form/CellToggle'
export { CellDatePicker } from './form/CellDatePicker'
