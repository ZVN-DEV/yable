// @yable/core — Sort/Filter function resolvers
// Factored out of table.ts to avoid circular imports (table -> column -> table).

import type { RowData, SortingFn, FilterFn } from '../types'
import { sortingFns } from '../sortingFns'
import { filterFns } from '../filterFns'

/**
 * T1-04: Resolve a sorting function from a column definition.
 * Handles: named built-in string, custom function, or 'auto'.
 */
export function resolveSortingFn<TData extends RowData>(
  sortingFnOption: string | SortingFn<TData> | undefined,
  tableSortingFns?: Record<string, SortingFn<TData>>
): SortingFn<TData> | undefined {
  if (!sortingFnOption) return undefined
  if (typeof sortingFnOption === 'function') return sortingFnOption
  // Check table-level custom sorting fns
  if (tableSortingFns?.[sortingFnOption]) return tableSortingFns[sortingFnOption]
  // Check built-in sorting fns
  if (sortingFnOption in sortingFns) {
    return sortingFns[sortingFnOption as keyof typeof sortingFns] as SortingFn<TData>
  }
  return undefined
}

/**
 * T1-04: Resolve a filter function from a column definition.
 * Handles: named built-in string, custom function.
 */
export function resolveFilterFn<TData extends RowData>(
  filterFnOption: string | FilterFn<TData> | undefined,
  tableFilterFns?: Record<string, FilterFn<TData>>
): FilterFn<TData> | undefined {
  if (!filterFnOption) return undefined
  if (typeof filterFnOption === 'function') return filterFnOption
  // Check table-level custom filter fns
  if (tableFilterFns?.[filterFnOption]) return tableFilterFns[filterFnOption]
  // Check built-in filter fns
  if (filterFnOption in filterFns) {
    return filterFns[filterFnOption as keyof typeof filterFns] as FilterFn<TData>
  }
  return undefined
}
