// @zvndev/yable-react — layered table configuration utilities

import type {
  ColumnDef,
  ColumnDefBase,
  ColumnDefExtensions,
  Row,
  RowData,
} from '@zvndev/yable-core'
import type { CSSProperties } from 'react'
import type { TableProps } from './types'

export type YableTableVisualConfig = Partial<
  Pick<
    TableProps<any>,
    | 'striped'
    | 'bordered'
    | 'compact'
    | 'stickyHeader'
    | 'theme'
    | 'direction'
    | 'ariaLabel'
    | 'clickableRows'
    | 'floatingFilters'
    | 'columnVirtualization'
    | 'columnVirtualizationOverscan'
    | 'statusBar'
    | 'sidebar'
    | 'sidebarPanels'
    | 'defaultSidebarPanel'
  >
>

export type YableColumnConfig<TData extends RowData = any, TValue = unknown> = Partial<
  ColumnDefBase<TData, TValue>
> &
  Partial<ColumnDefExtensions<TData, TValue>>

export interface YableRowConfig<TData extends RowData = any> {
  className?: string | ((row: Row<TData>) => string | undefined)
  style?: CSSProperties | ((row: Row<TData>) => CSSProperties)
}

export type YableCellConfig<TData extends RowData = any, TValue = unknown> = Pick<
  YableColumnConfig<TData, TValue>,
  | 'cell'
  | 'cellType'
  | 'cellTypeProps'
  | 'cellClassName'
  | 'cellStyle'
  | 'editable'
  | 'editConfig'
  | 'tooltip'
  | 'tooltipDelay'
>

export interface YableColumnConfigSet<TData extends RowData = any> {
  default?: YableColumnConfig<TData>
  byId?: Record<string, YableColumnConfig<TData>>
}

export interface YableCellConfigSet<TData extends RowData = any> {
  default?: YableCellConfig<TData>
  named?: Record<string, YableCellConfig<TData>>
  byColumn?: Record<string, YableCellConfig<TData>>
}

export interface YableTableProfile<TData extends RowData = any> {
  table?: YableTableVisualConfig
  columns?: YableColumnConfigSet<TData>
  rows?: YableRowConfig<TData>
  cells?: YableCellConfigSet<TData>
}

export interface YableConfig<TData extends RowData = any> extends YableTableProfile<TData> {
  profiles?: Record<string, YableTableProfile<TData>>
}

export interface ResolvedYableProfile<
  TData extends RowData = any,
> extends YableTableProfile<TData> {
  name: string
}

export function createYableConfig<TData extends RowData = any>(
  config: YableConfig<TData>,
): YableConfig<TData> {
  return config
}

export function resolveYableProfile<TData extends RowData = any>(
  config?: YableConfig<TData>,
  profileName = 'default',
): ResolvedYableProfile<TData> {
  const base = pickProfileFields(config)
  const named = profileName === 'default' ? undefined : config?.profiles?.[profileName]
  return {
    name: profileName,
    table: { ...base.table, ...named?.table },
    columns: {
      default: { ...base.columns?.default, ...named?.columns?.default },
      byId: { ...base.columns?.byId, ...named?.columns?.byId },
    },
    rows: { ...base.rows, ...named?.rows },
    cells: {
      default: { ...base.cells?.default, ...named?.cells?.default },
      named: { ...base.cells?.named, ...named?.cells?.named },
      byColumn: { ...base.cells?.byColumn, ...named?.cells?.byColumn },
    },
  }
}

export function getYableDefaultColumnDef<TData extends RowData>(
  profile?: YableTableProfile<TData>,
): YableColumnConfig<TData> | undefined {
  const next: YableColumnConfig<TData> = {
    ...profile?.columns?.default,
  }

  return Object.keys(next).length > 0 ? next : undefined
}

export function applyYableConfigToColumns<TData extends RowData>(
  columns: ColumnDef<TData, any>[],
  profile?: YableTableProfile<TData>,
): ColumnDef<TData, any>[] {
  if (!profile) return columns
  return columns.map((columnDef) => applyColumnConfig(columnDef, profile))
}

function applyColumnConfig<TData extends RowData>(
  columnDef: ColumnDef<TData, any>,
  profile: YableTableProfile<TData>,
): ColumnDef<TData, any> {
  const columnId = getColumnId(columnDef)
  const explicit = columnDef as YableColumnConfig<TData> & {
    columns?: ColumnDef<TData, any>[]
    cellConfig?: string | string[]
  }
  const cellNames = normalizeCellConfigNames(explicit.cellConfig)
  const namedCellConfig = cellNames.reduce<YableCellConfig<TData>>(
    (acc, name) => ({ ...acc, ...profile.cells?.named?.[name] }),
    {},
  )
  const defaultCell = profile.cells?.default
  const columnCell = columnId ? profile.cells?.byColumn?.[columnId] : undefined
  const columnConfig = columnId ? profile.columns?.byId?.[columnId] : undefined

  const children =
    'columns' in columnDef && columnDef.columns
      ? { columns: columnDef.columns.map((child) => applyColumnConfig(child, profile)) }
      : undefined

  return {
    ...defaultCell,
    ...namedCellConfig,
    ...columnCell,
    ...columnConfig,
    ...columnDef,
    ...children,
  } as ColumnDef<TData, any>
}

function pickProfileFields<TData extends RowData>(
  config?: YableConfig<TData>,
): YableTableProfile<TData> {
  if (!config) return {}
  return {
    table: config.table,
    columns: config.columns,
    rows: config.rows,
    cells: config.cells,
  }
}

function getColumnId<TData extends RowData>(columnDef: ColumnDef<TData, any>): string | undefined {
  if ('id' in columnDef && columnDef.id) return String(columnDef.id)
  if ('accessorKey' in columnDef && columnDef.accessorKey) return String(columnDef.accessorKey)
  return undefined
}

function normalizeCellConfigNames(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}
