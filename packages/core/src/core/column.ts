// @yable/core — Column Model

import type {
  RowData,
  Column,
  ColumnDef,
  ColumnDefExtensions,
  Table,
  ColumnPinningPosition,
  SortingFn,
  FilterFn,
} from '../types'
import { resolveColumnId, memo } from '../utils'
import { resolveSortingFn, resolveFilterFn } from './resolvers'
import { sortingFns } from '../sortingFns'
import { filterFns } from '../filterFns'

// ---------------------------------------------------------------------------
// Helper: safely access ColumnDefExtensions properties from a ColumnDef union
// ---------------------------------------------------------------------------

/**
 * Extract extension properties from a ColumnDef.
 * All four union variants include ColumnDefExtensions (GroupColumnDef uses Partial),
 * so casting to the extensions interface is safe for optional property reads.
 */
function getExtensions<TData extends RowData, TValue>(
  columnDef: ColumnDef<TData, TValue>
): Partial<ColumnDefExtensions<TData, TValue>> {
  return columnDef as Partial<ColumnDefExtensions<TData, TValue>>
}

export function createColumn<TData extends RowData, TValue = unknown>(
  table: Table<TData>,
  columnDef: ColumnDef<TData, TValue>,
  depth: number,
  parent?: Column<TData, unknown>
): Column<TData, TValue> {
  const id = resolveColumnId(columnDef)
  const ext = getExtensions(columnDef)

  const column: Column<TData, TValue> = {
    id,
    columnDef,
    depth,
    parent,
    columns: [],
    accessorFn: undefined,

    // Gets populated by features via createColumn hooks
    getSize: () => {
      const state = table.getState()
      const sizing = state.columnSizing?.[id]
      return sizing ?? ext.size ?? 150
    },
    getStart: () => 0,
    getAfter: () => 0,

    getFlatColumns: memo(
      () => [column.columns],
      (subColumns: Column<TData, unknown>[]) => {
        const result: Column<TData, unknown>[] = [column as Column<TData, unknown>]
        for (const sub of subColumns) {
          result.push(...sub.getFlatColumns())
        }
        return result
      },
      { key: `${id}_getFlatColumns` }
    ),

    getLeafColumns: memo(
      () => [column.columns],
      (subColumns: Column<TData, unknown>[]) => {
        if (subColumns.length === 0) return [column as Column<TData, unknown>]
        const result: Column<TData, unknown>[] = []
        for (const sub of subColumns) {
          result.push(...sub.getLeafColumns())
        }
        return result
      },
      { key: `${id}_getLeafColumns` }
    ),

    // Sorting
    getIsSorted: () => {
      const sorting = table.getState().sorting
      const sort = sorting?.find((s) => s.id === id)
      return sort ? sort.desc ? 'desc' : 'asc' : false
    },
    getNextSortingOrder: () => {
      const current = column.getIsSorted()
      if (!current) return 'asc'
      if (current === 'asc') return 'desc'
      return false
    },
    getCanSort: () => {
      return ext.enableSorting !== false
    },
    getCanMultiSort: () => {
      return true
    },
    getSortIndex: () => {
      const sorting = table.getState().sorting
      return sorting?.findIndex((s) => s.id === id) ?? -1
    },

    // T1-04: Wire sortingFn from column def
    getSortingFn: (): SortingFn<TData> => {
      const resolved = resolveSortingFn<TData>(
        ext.sortingFn as string | SortingFn<TData> | undefined,
        table.options.sortingFns
      )
      if (resolved) return resolved

      // Auto-detect: fall back to built-in 'auto' which uses alphanumeric
      return column.getAutoSortingFn()
    },

    getAutoSortingFn: (): SortingFn<TData> => {
      // Default to alphanumeric sorting
      return sortingFns.alphanumeric as SortingFn<TData>
    },

    getAutoSortDir: () => {
      return 'asc'
    },
    clearSorting: () => {
      table.setSorting((old) => old.filter((s) => s.id !== id))
    },
    toggleSorting: (desc?: boolean, isMulti?: boolean) => {
      table.setSorting((old) => {
        const existing = old.find((s) => s.id === id)
        const resolvedDesc = desc ?? (existing ? !existing.desc : false)

        if (isMulti) {
          if (existing) {
            return old.map((s) =>
              s.id === id ? { ...s, desc: resolvedDesc } : s
            )
          }
          return [...old, { id, desc: resolvedDesc }]
        }

        return [{ id, desc: resolvedDesc }]
      })
    },
    getToggleSortingHandler: () => {
      if (!column.getCanSort()) return undefined
      return (e: unknown) => {
        const isMulti = e && typeof e === 'object' && 'shiftKey' in e
          ? !!(e as { shiftKey: boolean }).shiftKey
          : false
        column.toggleSorting(undefined, isMulti)
      }
    },

    // Filtering
    getIsFiltered: () => {
      const filters = table.getState().columnFilters
      return filters?.some((f) => f.id === id) ?? false
    },
    getFilterValue: () => {
      const filters = table.getState().columnFilters
      return filters?.find((f) => f.id === id)?.value
    },
    setFilterValue: (value: unknown) => {
      table.setColumnFilters((old) => {
        const existing = old.find((f) => f.id === id)
        if (existing) {
          if (value === undefined || value === '') {
            return old.filter((f) => f.id !== id)
          }
          return old.map((f) => (f.id === id ? { ...f, value } : f))
        }
        if (value === undefined || value === '') return old
        return [...old, { id, value }]
      })
    },
    getCanFilter: () => {
      return ext.enableColumnFilter !== false
    },
    getCanGlobalFilter: () => {
      return ext.enableGlobalFilter !== false
    },

    // T1-04: Wire filterFn from column def
    getFilterFn: (): FilterFn<TData> | undefined => {
      return resolveFilterFn<TData>(
        ext.filterFn as string | FilterFn<TData> | undefined,
        table.options.filterFns
      )
    },

    getAutoFilterFn: (): FilterFn<TData> | undefined => {
      // Default to includesString filter
      return filterFns.includesString as FilterFn<TData>
    },

    getFilterIndex: () => {
      const filters = table.getState().columnFilters
      return filters?.findIndex((f) => f.id === id) ?? -1
    },

    // Visibility
    getIsVisible: () => {
      const visibility = table.getState().columnVisibility
      return visibility?.[id] !== false
    },
    getCanHide: () => {
      return ext.enableHiding !== false
    },
    toggleVisibility: (value?: boolean) => {
      table.setColumnVisibility((old) => ({
        ...old,
        [id]: value ?? !column.getIsVisible(),
      }))
    },
    getToggleVisibilityHandler: () => {
      return (_e: unknown) => {
        column.toggleVisibility()
      }
    },

    // Pinning
    getIsPinned: () => {
      const pinning = table.getState().columnPinning
      if (pinning?.left?.includes(id)) return 'left'
      if (pinning?.right?.includes(id)) return 'right'
      return false
    },
    getCanPin: () => {
      return ext.enablePinning !== false
    },
    pin: (position: ColumnPinningPosition) => {
      table.setColumnPinning((old) => {
        const left = (old.left ?? []).filter((c) => c !== id)
        const right = (old.right ?? []).filter((c) => c !== id)
        if (position === 'left') left.push(id)
        if (position === 'right') right.push(id)
        return { left, right }
      })
    },
    getPinnedIndex: () => {
      const pinning = table.getState().columnPinning
      const position = column.getIsPinned()
      if (!position) return -1
      const list = position === 'left' ? pinning.left : pinning.right
      return list?.indexOf(id) ?? -1
    },

    // Resizing
    getCanResize: () => {
      return ext.enableResizing !== false
    },
    getIsResizing: () => {
      return table.getState().columnSizingInfo?.isResizingColumn === id
    },
    resetSize: () => {
      table.setColumnSizing((old) => {
        const next = { ...old }
        delete next[id]
        return next
      })
    },

    // Faceting
    getFacetedRowModel: () => table.getRowModel(),
    getFacetedUniqueValues: () => new Map(),
    getFacetedMinMaxValues: () => undefined,

    // Grouping
    getIsGrouped: () => {
      return table.getState().grouping?.includes(id) ?? false
    },
    getGroupedIndex: () => {
      return table.getState().grouping?.indexOf(id) ?? -1
    },
    getCanGroup: () => {
      return ext.enableGrouping !== false
    },
    toggleGrouping: () => {
      table.setGrouping((old) => {
        if (old.includes(id)) return old.filter((g) => g !== id)
        return [...old, id]
      })
    },
    getAutoAggregationFn: () => undefined,
    getAggregationFn: () => undefined,
  }

  // Set up accessor function
  if ('accessorFn' in columnDef && columnDef.accessorFn) {
    column.accessorFn = columnDef.accessorFn
  } else if ('accessorKey' in columnDef && columnDef.accessorKey) {
    const key = columnDef.accessorKey as string
    column.accessorFn = ((row: TData) => {
      const parts = key.split('.')
      let value: unknown = row
      for (const part of parts) {
        if (value == null) return undefined
        value = (value as Record<string, unknown>)[part]
      }
      return value as TValue
    })
  }

  return column
}
