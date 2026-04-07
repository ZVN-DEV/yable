// @zvndev/yable-react — React-specific types

import type { RowData, Table, Row, Cell, Header } from '@zvndev/yable-core'
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

export interface TableProps<TData extends RowData>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
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

export interface TableRowProps<TData extends RowData>
  extends HTMLAttributes<HTMLTableRowElement> {
  row: Row<TData>
}

export interface TableCellProps<TData extends RowData, TValue = unknown>
  extends TdHTMLAttributes<HTMLTableCellElement> {
  cell: Cell<TData, TValue>
}

export interface TableHeaderCellProps<TData extends RowData, TValue = unknown>
  extends ThHTMLAttributes<HTMLTableCellElement> {
  header: Header<TData, TValue>
}
