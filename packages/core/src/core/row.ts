// @yable/core — Row Model

import type {
  RowData,
  Row,
  Table,
  RowPinningPosition,
} from '../types'
import { createCell } from './cell'

export function createRow<TData extends RowData>(
  table: Table<TData>,
  id: string,
  original: TData,
  rowIndex: number,
  depth: number,
  subRows?: Row<TData>[],
  parentId?: string
): Row<TData> {
  const row: Row<TData> = {
    id,
    index: rowIndex,
    original,
    depth,
    parentId,
    subRows: subRows ?? [],

    // Value access
    getValue: <TValue = unknown>(columnId: string): TValue => {
      const column = table.getColumn(columnId)
      if (!column?.accessorFn) return undefined as TValue
      // T1-09: Wrap accessorFn in try-catch
      try {
        return column.accessorFn(original, rowIndex) as TValue
      } catch (err) {
        console.error(
          `[yable] accessorFn threw for column "${columnId}", row "${id}":`,
          err
        )
        return undefined as TValue
      }
    },
    renderValue: <TValue = unknown>(columnId: string): TValue => {
      return row.getValue(columnId)
    },
    getAllCells: () => {
      return table.getAllLeafColumns().map((column) =>
        createCell(table, row, column, column.id)
      )
    },
    getVisibleCells: () => {
      return table.getVisibleFlatColumns().map((column) =>
        createCell(table, row, column, column.id)
      )
    },
    getLeftVisibleCells: () => {
      return table.getLeftVisibleLeafColumns().map((column) =>
        createCell(table, row, column, column.id)
      )
    },
    getRightVisibleCells: () => {
      return table.getRightVisibleLeafColumns().map((column) =>
        createCell(table, row, column, column.id)
      )
    },
    getCenterVisibleCells: () => {
      return table.getCenterVisibleLeafColumns().map((column) =>
        createCell(table, row, column, column.id)
      )
    },

    // Selection
    getIsSelected: () => {
      return table.getState().rowSelection?.[id] ?? false
    },
    getIsSomeSelected: () => {
      if (row.subRows.length === 0) return false
      const allSelected = row.subRows.every((sub) => sub.getIsSelected())
      if (allSelected) return false
      return row.subRows.some((sub) => sub.getIsSelected() || sub.getIsSomeSelected())
    },
    getIsAllSubRowsSelected: () => {
      if (row.subRows.length === 0) return false
      return row.subRows.every((sub) => sub.getIsSelected())
    },
    getCanSelect: () => {
      const opts = table.options
      if (typeof opts.enableRowSelection === 'function') {
        return opts.enableRowSelection(row)
      }
      return opts.enableRowSelection !== false
    },
    getCanMultiSelect: () => {
      return table.options.enableMultiRowSelection !== false
    },
    getCanSelectSubRows: () => {
      return table.options.enableSubRowSelection !== false
    },
    toggleSelected: (value?: boolean, opts?: { selectChildren?: boolean }) => {
      const isSelected = value ?? !row.getIsSelected()
      table.setRowSelection((old) => {
        const next = { ...old }
        if (isSelected) {
          next[id] = true
        } else {
          delete next[id]
        }

        if (opts?.selectChildren !== false && row.subRows.length > 0) {
          for (const subRow of row.subRows) {
            if (isSelected) {
              next[subRow.id] = true
            } else {
              delete next[subRow.id]
            }
          }
        }

        return next
      })
    },
    getToggleSelectedHandler: () => {
      return (_e: unknown) => {
        row.toggleSelected()
      }
    },

    // Expanding
    getIsExpanded: () => {
      const expanded = table.getState().expanded
      if (expanded === true) return true
      return (expanded as Record<string, boolean>)?.[id] ?? false
    },
    getCanExpand: () => {
      return row.subRows.length > 0 || (table.options.getRowCanExpand?.(row) ?? false)
    },
    getIsGrouped: () => {
      return !!row.groupingColumnId
    },
    toggleExpanded: (expanded?: boolean) => {
      table.setExpanded((old) => {
        const prev = old === true ? {} : { ...(old as Record<string, boolean>) }
        const isExpanded = expanded ?? !row.getIsExpanded()
        if (isExpanded) {
          prev[id] = true
        } else {
          delete prev[id]
        }
        return prev
      })
    },
    getToggleExpandedHandler: () => {
      return (_e: unknown) => {
        row.toggleExpanded()
      }
    },

    // Pinning
    getIsPinned: () => {
      const pinning = table.getState().rowPinning
      if (pinning?.top?.includes(id)) return 'top'
      if (pinning?.bottom?.includes(id)) return 'bottom'
      return false
    },
    getCanPin: () => {
      return table.options.enableRowPinning !== false
    },
    pin: (
      position: RowPinningPosition,
      _includeLeafRows?: boolean,
      _includeParentRows?: boolean
    ) => {
      table.setRowPinning((old) => {
        const top = (old.top ?? []).filter((r) => r !== id)
        const bottom = (old.bottom ?? []).filter((r) => r !== id)

        if (position === 'top') top.push(id)
        if (position === 'bottom') bottom.push(id)

        return { top, bottom }
      })
    },

    // Grouping
    groupingColumnId: undefined,
    groupingValue: undefined,
    getGroupingValue: (columnId: string) => {
      return row.getValue(columnId)
    },
    getLeafRows: () => {
      const leaves: Row<TData>[] = []
      const collect = (rows: Row<TData>[]) => {
        for (const r of rows) {
          if (r.subRows.length === 0) {
            leaves.push(r)
          } else {
            collect(r.subRows)
          }
        }
      }
      collect(row.subRows)
      return leaves
    },

    // Tree data extensions
    getParentRow: () => {
      if (!parentId) return undefined
      try {
        return table.getRow(parentId, true)
      } catch {
        return undefined
      }
    },
    getTreeDepth: () => {
      return (row as any)._treeDepth ?? depth
    },
    isLeaf: () => {
      return (row as any)._isLeaf ?? row.subRows.length === 0
    },
  }

  return row
}
