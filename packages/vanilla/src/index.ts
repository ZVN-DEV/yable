// @yable/vanilla — Vanilla JS adapter for YableTables

// Re-export core types consumers will need
export type {
  RowData,
  ColumnDef,
  TableOptions,
  Table,
  Row,
  Cell,
  Column,
  Header,
  HeaderGroup,
  CellContext,
  TableState,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  EditingState,
  Updater,
  SortDirection,
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

// Main factory
export { createTableDOM } from './createTableDOM'
export type { CreateTableDOMOptions, TableDOM } from './createTableDOM'

// Event types
export type { VanillaEventHandler, VanillaEventHandlers } from './events'

// Renderer (for advanced usage)
export { renderTable, renderPagination } from './renderer'
