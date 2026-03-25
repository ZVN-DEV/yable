// @yable/core — Column Model

import type {
  RowData,
  Column,
  ColumnDef,
  Table,
  ColumnPinningPosition,
} from '../types'
import { resolveColumnId, memo } from '../utils'

export function createColumn<TData extends RowData, TValue = unknown>(
  table: Table<TData>,
  columnDef: ColumnDef<TData, TValue>,
  depth: number,
  parent?: Column<TData, unknown>
): Column<TData, TValue> {
  const id = resolveColumnId(columnDef)

  const column: Column<TData, TValue> = {
    id,
    columnDef: columnDef as any,
    depth,
    parent: parent as any,
    columns: [],
    accessorFn: undefined as any,

    // Gets populated by features via createColumn hooks
    getSize: () => {
      const state = table.getState()
      const sizing = state.columnSizing?.[id]
      return sizing ?? (columnDef as any).size ?? 150
    },
    getStart: () => 0,
    getAfter: () => 0,

    getFlatColumns: memo(
      () => [column.columns],
      (subColumns) => {
        const result: Column<TData, any>[] = [column as any]
        for (const sub of subColumns) {
          result.push(...sub.getFlatColumns())
        }
        return result
      },
      { key: `${id}_getFlatColumns` }
    ),

    getLeafColumns: memo(
      () => [column.columns],
      (subColumns) => {
        if (subColumns.length === 0) return [column as any]
        const result: Column<TData, any>[] = []
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
      return (columnDef as any).enableSorting !== false
    },
    getCanMultiSort: () => {
      return (columnDef as any).enableMultiSort ?? true
    },
    getSortIndex: () => {
      const sorting = table.getState().sorting
      return sorting?.findIndex((s) => s.id === id) ?? -1
    },
    getSortingFn: () => {
      return undefined as any // Set by RowSorting feature
    },
    getAutoSortingFn: () => {
      return undefined as any
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
        const event = e as MouseEvent
        column.toggleSorting(undefined, event?.shiftKey)
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
    setFilterValue: (value: any) => {
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
      return (columnDef as any).enableColumnFilter !== false
    },
    getCanGlobalFilter: () => {
      return (columnDef as any).enableGlobalFilter !== false
    },
    getFilterFn: () => {
      return undefined as any // Set by ColumnFiltering feature
    },
    getAutoFilterFn: () => {
      return undefined as any
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
      return (columnDef as any).enableHiding !== false
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
      return (columnDef as any).enablePinning !== false
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
      return (columnDef as any).enableResizing !== false
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
      return (columnDef as any).enableGrouping !== false
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
    column.accessorFn = columnDef.accessorFn as any
  } else if ('accessorKey' in columnDef && columnDef.accessorKey) {
    const key = columnDef.accessorKey as string
    column.accessorFn = ((row: TData) => {
      const parts = key.split('.')
      let value: any = row
      for (const part of parts) {
        if (value == null) return undefined
        value = value[part]
      }
      return value
    }) as any
  }

  return column
}
