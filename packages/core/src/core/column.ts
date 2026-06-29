// @zvndev/yable-core — Column Model

import type {
  RowData,
  Row,
  RowModel,
  Column,
  ColumnDef,
  ColumnDefExtensions,
  Table,
  ColumnPinningPosition,
  SortingFn,
  FilterFn,
  AggregationFn,
} from '../types'
import { resolveColumnId, memo, MAX_ACCESSOR_DEPTH } from '../utils'
import { resolveSortingFn, resolveFilterFn } from './resolvers'
import { sortingFns } from '../sortingFns'
import { filterFns } from '../filterFns'
import { aggregationFns } from '../aggregationFns'

// ---------------------------------------------------------------------------
// Helper: safely access ColumnDefExtensions properties from a ColumnDef union
// ---------------------------------------------------------------------------

/**
 * Extract extension properties from a ColumnDef.
 * All four union variants include ColumnDefExtensions (GroupColumnDef uses Partial),
 * so casting to the extensions interface is safe for optional property reads.
 */
function getExtensions<TData extends RowData, TValue>(
  columnDef: ColumnDef<TData, TValue>,
): Partial<ColumnDefExtensions<TData, TValue>> {
  return columnDef as Partial<ColumnDefExtensions<TData, TValue>>
}

export function createColumn<TData extends RowData, TValue = unknown>(
  table: Table<TData>,
  columnDef: ColumnDef<TData, TValue>,
  depth: number,
  parent?: Column<TData, unknown>,
): Column<TData, TValue> {
  const id = resolveColumnId(columnDef)
  const ext = getExtensions(columnDef)

  // One-shot guard so we don't spam the console on every getSize() call
  // when a column def has invalid min/max bounds.
  let warnedInvalidSizeBounds = false

  const getFacetedRowModel = (): RowModel<TData> => {
    const coreModel = table.getCoreRowModel()
    if (table.options.manualFiltering) return coreModel

    const columnFilters = table.getState().columnFilters.filter((filter) => filter.id !== id)
    const globalFilter = table.getState().globalFilter

    if (columnFilters.length === 0 && !globalFilter) return coreModel

    let filtered = coreModel.rows

    for (const filter of columnFilters) {
      const filterColumn = table.getColumn(filter.id)
      if (!filterColumn) continue

      filtered = filtered.filter((row: Row<TData>) => {
        const filterFn = filterColumn.getFilterFn()

        if (filterFn) {
          try {
            return filterFn(row, filter.id, filter.value, () => {})
          } catch (err) {
            console.error(
              `[yable E010] filterFn threw for column "${filter.id}", row "${row.id}":`,
              err,
            )
            return true
          }
        }

        const value = row.getValue(filter.id)
        if (Array.isArray(filter.value)) {
          return filter.value.some((candidate) => value === candidate)
        }

        return String(value ?? '')
          .toLowerCase()
          .includes(String(filter.value ?? '').toLowerCase())
      })
    }

    if (globalFilter) {
      const searchStr = String(globalFilter).toLowerCase()
      filtered = filtered.filter((row: Row<TData>) => {
        return table.getAllLeafColumns().some((candidateColumn: Column<TData, unknown>) => {
          const value = row.getValue(candidateColumn.id)
          return String(value ?? '')
            .toLowerCase()
            .includes(searchStr)
        })
      })
    }

    const rowsById: Record<string, Row<TData>> = {}
    for (const row of filtered) {
      rowsById[row.id] = row
    }

    return {
      rows: filtered,
      flatRows: filtered,
      rowsById,
    }
  }

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
      const raw = sizing ?? ext.size ?? 150

      const min = ext.minSize
      const max = ext.maxSize

      // Validate bounds: if a user accidentally sets minSize > maxSize the
      // resulting clamp would silently flip the size. Warn once and resolve
      // by treating minSize as the floor (i.e. min wins). This is documented
      // so callers know which bound takes precedence on misconfiguration.
      if (typeof min === 'number' && typeof max === 'number' && min > max) {
        if (!warnedInvalidSizeBounds) {
          warnedInvalidSizeBounds = true
          console.warn(`[yable] column "${id}" has minSize (${min}) > maxSize (${max})`)
        }
        // Min wins: clamp the raw size up to min, ignoring the broken max.
        return Math.max(raw, min)
      }

      let resolved = raw
      if (typeof min === 'number') resolved = Math.max(resolved, min)
      if (typeof max === 'number') resolved = Math.min(resolved, max)
      return resolved
    },
    getStart: (position?: ColumnPinningPosition) => {
      // Cumulative sticky offset for a pinned column. Resolve the side from the
      // explicit argument, falling back to the column's own pinned position.
      const pos = position ?? column.getIsPinned()

      if (pos === 'left') {
        // Sum the widths of all left-pinned visible leaf columns BEFORE this one.
        let offset = 0
        for (const col of table.getLeftVisibleLeafColumns()) {
          if (col.id === id) break
          offset += col.getSize()
        }
        return offset
      }

      if (pos === 'right') {
        // Sum the widths of all right-pinned visible leaf columns AFTER this one.
        let offset = 0
        let seen = false
        for (const col of table.getRightVisibleLeafColumns()) {
          if (col.id === id) {
            seen = true
            continue
          }
          if (seen) offset += col.getSize()
        }
        return offset
      }

      return 0
    },
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
      { key: `${id}_getFlatColumns` },
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
      { key: `${id}_getLeafColumns` },
    ),

    // Sorting
    getIsSorted: () => {
      const sorting = table.getState().sorting
      const sort = sorting?.find((s) => s.id === id)
      return sort ? (sort.desc ? 'desc' : 'asc') : false
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
        table.options.sortingFns,
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
      // Header-click path (no explicit direction, single-sort): cycle through
      // the 3-state order none -> asc -> desc -> (removed | back to asc).
      // Removal on the final step is gated by `enableSortingRemoval`; when it is
      // falsy the column toggles between asc and desc only. Explicit-desc and
      // multi-sort callers keep their existing set/append semantics below.
      if (desc === undefined && !isMulti) {
        table.setSorting((old) => {
          const existing = old.find((s) => s.id === id)
          if (!existing) return [{ id, desc: false }]
          if (!existing.desc) return [{ id, desc: true }]
          if (table.options.enableSortingRemoval) {
            return old.filter((s) => s.id !== id)
          }
          return [{ id, desc: false }]
        })
        return
      }

      table.setSorting((old) => {
        const existing = old.find((s) => s.id === id)
        const resolvedDesc = desc ?? (existing ? !existing.desc : false)

        if (isMulti) {
          if (existing) {
            return old.map((s) => (s.id === id ? { ...s, desc: resolvedDesc } : s))
          }
          return [...old, { id, desc: resolvedDesc }]
        }

        return [{ id, desc: resolvedDesc }]
      })
    },
    getToggleSortingHandler: () => {
      if (!column.getCanSort()) return undefined
      return (e: unknown) => {
        const isMulti =
          e && typeof e === 'object' && 'shiftKey' in e
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
        table.options.filterFns,
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
      const resolved = value ?? !column.getIsVisible()

      // If hiding (resolved === false), check guards
      if (resolved === false) {
        // lockVisible: column-level lock prevents hiding
        if (ext.lockVisible) return

        // suppressDragHidesColumns: prevent hiding during active column drag
        // Default is true when not explicitly set
        const suppress = table.options.suppressDragHidesColumns !== false
        if (suppress && table.getIsColumnDragActive()) return
      }

      table.setColumnVisibility((old) => ({
        ...old,
        [id]: resolved,
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

    // Reordering
    getCanReorder: () => {
      // Disabled by an explicit per-column opt-out, or by the table option,
      // or for placeholder/group columns (no leaf id to reorder).
      if (ext.enableReorder === false) return false
      if (table.options.enableColumnReorder === false) return false
      return true
    },

    // Faceting
    getFacetedRowModel,
    getFacetedUniqueValues: () => {
      const facetedRows = getFacetedRowModel().rows
      const values = new Map<unknown, number>()

      for (const row of facetedRows) {
        const value = row.getValue(id)
        if (Array.isArray(value)) {
          for (const item of value) {
            values.set(item, (values.get(item) ?? 0) + 1)
          }
          continue
        }
        values.set(value, (values.get(value) ?? 0) + 1)
      }

      return values
    },
    getFacetedMinMaxValues: () => {
      const facetedRows = getFacetedRowModel().rows
      let min: number | undefined
      let max: number | undefined

      for (const row of facetedRows) {
        const value = row.getValue<number | string>(id)
        const numeric = typeof value === 'number' ? value : Number(value)
        if (!Number.isFinite(numeric)) continue
        min = min == null ? numeric : Math.min(min, numeric)
        max = max == null ? numeric : Math.max(max, numeric)
      }

      return min == null || max == null ? undefined : [min, max]
    },

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
    getAggregationFn: (): AggregationFn<TData> | undefined => {
      const agg = columnDef.aggregationFn
      if (!agg) return undefined
      if (typeof agg === 'function') return agg as AggregationFn<TData>
      const fn = (aggregationFns as Record<string, AggregationFn<RowData>>)[agg as string]
      return fn as AggregationFn<TData> | undefined
    },
  }

  // Set up accessor function
  if ('accessorFn' in columnDef && columnDef.accessorFn) {
    column.accessorFn = columnDef.accessorFn
  } else if ('accessorKey' in columnDef && columnDef.accessorKey) {
    const key = columnDef.accessorKey as string
    const parts = key.split('.')
    const tooDeep = parts.length > MAX_ACCESSOR_DEPTH
    if (tooDeep) {
      console.error(`[yable] accessor path too deep (>${MAX_ACCESSOR_DEPTH} segments): ${key}`)
    }
    column.accessorFn = (row: TData) => {
      if (tooDeep) return undefined as unknown as TValue
      let value: unknown = row
      for (const part of parts) {
        if (value == null) return undefined as unknown as TValue
        value = (value as Record<string, unknown>)[part]
      }
      return value as TValue
    }
  }

  return column
}
