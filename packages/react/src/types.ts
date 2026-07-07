// @zvndev/yable-react — React-specific types

import type { RowData, Table, Row, Cell, Header, Column } from '@zvndev/yable-core'
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import type { YableConfig } from './config'

export type AdaptiveTableLayoutMode = 'auto' | 'table' | 'cards'

/** Density preset controlling cell/header padding, row height, and font size. */
export type TableDensity = 'condensed' | 'regular' | 'spacious'

/** Object form of the `autoColumnWidth` prop. */
export interface AutoColumnWidthOptions {
  /** Rows sampled for measurement. Default 100. */
  sampleSize?: number
  /**
   * `'fit'` = never horizontally scroll: squish over-wide columns and let them
   * WRAP. `'scroll'` = keep natural widths, allow horizontal scroll. Default `'fit'`.
   */
  overflow?: 'fit' | 'scroll'
  /**
   * When natural total ≤ container, how to spend the leftover space:
   * - `'leave'` (default) — keep columns at natural width, leave a gutter.
   * - `'distribute'` — grow auto columns proportionally in a waterfall that
   *   respects each `maxSize` as a HARD cap; a gutter remains only if EVERY
   *   auto column hits its `maxSize`.
   * - `'stretch'` — same waterfall, but `maxSize` is a SOFT cap: if space is
   *   still left after every column caps, grow past `maxSize` so the container
   *   fills exactly and never gutters.
   */
  underflow?: 'leave' | 'distribute' | 'stretch'
}

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
  /**
   * Density preset: `'condensed'`, `'regular'`, or `'spacious'`. Maps to a token
   * set (padding, row height, font size) in the themes package. Independent of
   * and layered under `compact` — both may be set, though a single density
   * preset is the recommended path.
   */
  density?: TableDensity
  /**
   * Opt-in smart column sizing. `true` fits columns to their content using the
   * default policy (`overflow: 'fit'`, `underflow: 'leave'`, `sampleSize: 100`);
   * pass an object to tune it. Default OFF — existing layouts are unaffected.
   *
   * Columns with an explicit `size` or `enableAutoSize: false` keep their width
   * and are excluded from measurement and squishing. Squish + wrap is only
   * applied when the table is NOT row-virtualized; under virtualization the
   * table falls back to `overflow: 'scroll'` behavior.
   */
  autoColumnWidth?: boolean | AutoColumnWidthOptions
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
