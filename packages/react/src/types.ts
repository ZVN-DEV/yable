// @yable/react — React-specific types

import type { RowData, Table, Row, Cell, Header } from '@yable/core'
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
  /** Theme variant: "default" | "stripe" | "compact" */
  theme?: 'default' | 'stripe' | 'compact'
  /** Whether rows are clickable (adds cursor + hover) */
  clickableRows?: boolean
  /** Show footer */
  footer?: boolean
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Custom empty state render */
  renderEmpty?: () => React.ReactNode
  /** Custom loading render */
  renderLoading?: () => React.ReactNode
  /** Children rendered inside the table container (e.g. Pagination) */
  children?: React.ReactNode
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
