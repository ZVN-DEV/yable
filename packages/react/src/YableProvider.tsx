// @zvndev/yable-react — Project-wide defaults provider

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { ColumnDefBase, ColumnDefExtensions } from '@zvndev/yable-core'
import type { TableProps } from './types'
import type { YableConfig } from './config'

/**
 * Project-wide default table and column options.
 *
 * Wrap your app (or a subtree) in `<YableProvider>` so every `<Table>` and
 * `useTable` call inherits these defaults without repeating config.
 *
 * Component-level and hook-level values always take precedence over provider
 * defaults.
 */
export interface YableDefaults {
  /** Layered project config with default and named table/cell profiles */
  config?: YableConfig
  /** Named config profile used by descendants unless overridden */
  tableProfile?: string
  /** Default props applied to every `<Table>` in the subtree */
  tableProps?: Partial<
    Pick<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- provider defaults must work for every table row shape.
      TableProps<any>,
      | 'striped'
      | 'bordered'
      | 'compact'
      | 'stickyHeader'
      | 'theme'
      | 'direction'
      | 'ariaLabel'
      | 'adaptiveLayout'
    >
  >
  /** Default column definition merged under every table's own `defaultColumnDef` */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- provider defaults are merged into generic table options later.
  defaultColumnDef?: Partial<ColumnDefBase<any, unknown>> &
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- provider defaults are row-shape agnostic.
    Partial<ColumnDefExtensions<any, unknown>>
}

const YableContext = createContext<YableDefaults>({})

/**
 * Read the nearest `YableProvider` defaults.
 *
 * Safe to call outside a provider — returns an empty object.
 */
export function useYableDefaults(): YableDefaults {
  return useContext(YableContext)
}

/**
 * Provide project-wide defaults for all Yable tables in a subtree.
 *
 * @example
 * ```tsx
 * <YableProvider
 *   striped
 *   stickyHeader
 *   theme="stripe"
 *   defaultColumnDef={{ enableSorting: true }}
 * >
 *   <EmployeeTable />
 *   <ProjectTable />
 * </YableProvider>
 * ```
 */
export function YableProvider({
  children,
  config,
  tableProfile,
  defaultColumnDef,
  striped,
  stickyHeader,
  bordered,
  compact,
  theme,
  direction,
  ariaLabel,
}: YableDefaults & {
  children: ReactNode
  striped?: boolean
  stickyHeader?: boolean
  bordered?: boolean
  compact?: boolean
  theme?: string
  direction?: 'ltr' | 'rtl'
  ariaLabel?: string
}) {
  // Build tableProps from flat props — only include keys that were actually passed
  const tableProps: YableDefaults['tableProps'] = {}
  if (striped !== undefined) tableProps.striped = striped
  if (stickyHeader !== undefined) tableProps.stickyHeader = stickyHeader
  if (bordered !== undefined) tableProps.bordered = bordered
  if (compact !== undefined) tableProps.compact = compact
  if (theme !== undefined) tableProps.theme = theme
  if (direction !== undefined) tableProps.direction = direction
  if (ariaLabel !== undefined) tableProps.ariaLabel = ariaLabel

  const value: YableDefaults = {
    config,
    tableProfile,
    tableProps: Object.keys(tableProps).length > 0 ? tableProps : undefined,
    defaultColumnDef,
  }

  return <YableContext.Provider value={value}>{children}</YableContext.Provider>
}
