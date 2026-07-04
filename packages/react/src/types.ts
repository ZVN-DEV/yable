// @zvndev/yable-react — React-specific types

import type { RowData, Table, Row, Cell, Header, Column } from '@zvndev/yable-core'
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import type { YableConfig } from './config'

export type AdaptiveTableLayoutMode = 'auto' | 'table' | 'cards'

export interface AdaptiveTableCardContext<TData extends RowData> {
  table: Table<TData>
  row: Row<TData>
  rowIndex: number
  cells: Cell<TData, unknown>[]
  primaryCell?: Cell<TData, unknown>
  secondaryCells: Cell<TData, unknown>[]
  visibleColumns: Column<TData, unknown>[]
}

export interface AdaptiveTableLayoutOptions<TData extends RowData> {
  /**
   * `auto` switches at the configured container breakpoint, `cards` forces the
   * adaptive card surface, and `table` keeps the desktop grid surface.
   */
  mode?: AdaptiveTableLayoutMode
  /** Container width in px where `auto` switches to cards. Default: 720. */
  breakpoint?: number
  /** Column shown as the card title. Defaults to the first visible column. */
  primaryColumnId?: string
  /** Ordered secondary columns. Defaults to all remaining visible columns. */
  secondaryColumnIds?: string[]
  /** Columns omitted from the adaptive card surface. */
  hiddenColumnIds?: string[]
  /** Caps secondary fields when no explicit `secondaryColumnIds` are provided. Default: 8. */
  maxSecondaryColumns?: number
  /** Fully custom card renderer for product-specific mobile/tablet layouts. */
  renderCard?: (context: AdaptiveTableCardContext<TData>) => React.ReactNode
}

export interface TableProps<TData extends RowData> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  table: Table<TData>
  /** Enable sticky header */
  stickyHeader?: boolean
  /** Enable striped rows */
  striped?: boolean
  /** Enable bordered cells */
  bordered?: boolean
  /** Enable compact spacing */
  compact?: boolean
  /** Theme variant */
  theme?: string
  /** Named table profile from `YableProvider config` */
  configProfile?: string
  /** Table-local config; overrides provider config for this component */
  config?: YableConfig<TData>
  /** Whether rows are clickable (adds cursor + hover) */
  clickableRows?: boolean
  /** Show footer */
  footer?: boolean
  /** Loading state */
  loading?: boolean
  /** Custom loading component */
  loadingComponent?: React.ReactNode
  /** Loading text shown below the spinner */
  loadingText?: string
  /** Empty state message */
  emptyMessage?: string
  /** Custom empty state render */
  renderEmpty?: () => React.ReactNode
  /** Custom loading render */
  renderLoading?: () => React.ReactNode
  /** Custom empty component */
  emptyComponent?: React.ReactNode
  /** Custom empty icon */
  emptyIcon?: React.ReactNode
  /** Secondary detail text for empty state */
  emptyDetail?: string
  /** Children rendered inside the table container (e.g. Pagination) */
  children?: React.ReactNode
  /** Text direction for RTL support */
  direction?: 'ltr' | 'rtl'
  /** Enable status bar */
  statusBar?: boolean
  /** Status bar panels configuration */
  statusBarPanels?: StatusBarPanelConfig[]
  /** Enable sidebar */
  sidebar?: boolean
  /** Sidebar panels */
  sidebarPanels?: ('columns' | 'filters')[]
  /** Default sidebar panel */
  defaultSidebarPanel?: 'columns' | 'filters'
  /** Render a second header row with per-column floating filters */
  floatingFilters?: boolean
  /** Virtualize wide tables horizontally when safe to do so */
  columnVirtualization?: boolean
  /** Additional columns rendered beyond the viewport when column virtualization is enabled */
  columnVirtualizationOverscan?: number
  /** Render a structural card layout for tablet/mobile while reusing this table instance */
  adaptiveLayout?: boolean | AdaptiveTableLayoutOptions<TData>
  /** Accessible label for the grid container. Default: "Data table" */
  ariaLabel?: string
}

/** Status bar panel configuration */
export interface StatusBarPanelConfig {
  id: string
  component?: React.ComponentType<StatusBarPanelProps>
  align?: 'left' | 'center' | 'right'
  label?: string
}

/** Props passed to status bar panel components */
export interface StatusBarPanelProps {
  table: Table<any>
}

export interface TableRowProps<TData extends RowData> extends HTMLAttributes<HTMLTableRowElement> {
  row: Row<TData>
}

export interface TableCellProps<
  TData extends RowData,
  TValue = unknown,
> extends TdHTMLAttributes<HTMLTableCellElement> {
  cell: Cell<TData, TValue>
}

export interface TableHeaderCellProps<
  TData extends RowData,
  TValue = unknown,
> extends ThHTMLAttributes<HTMLTableCellElement> {
  header: Header<TData, TValue>
}
