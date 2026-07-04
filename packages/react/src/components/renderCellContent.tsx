import React from 'react'
import type { Cell, CellContext, RowData, Table } from '@zvndev/yable-core'
import { resolveCellType } from '../cells/resolver'

type CellRenderer<TData extends RowData> = (ctx: CellContext<TData, unknown>) => React.ReactNode

export function renderCellContent<TData extends RowData>(
  cell: Cell<TData, unknown>,
  table: Table<TData>,
): React.ReactNode {
  const column = cell.column
  const isEditing = cell.getIsEditing()
  const isAlwaysEditable = cell.getIsAlwaysEditable()
  const cellStatus = table.getCellStatus(cell.row.id, column.id)
  const overrideValue =
    cellStatus !== 'idle' ? table.getCellRenderValue(cell.row.id, column.id) : undefined

  let content: React.ReactNode
  const cellDef = column.columnDef.cell
  const cellType = column.columnDef.cellType

  if (typeof cellDef === 'function') {
    const ctx = cell.getContext()
    if (overrideValue !== undefined) {
      const overriddenCtx = {
        ...ctx,
        getValue: () => overrideValue,
        renderValue: () => overrideValue,
      }
      content = (cellDef as CellRenderer<TData>)(overriddenCtx)
    } else {
      content = (cellDef as CellRenderer<TData>)(ctx)
    }
  } else if (cellType && !(isEditing || isAlwaysEditable)) {
    content = resolveCellType(cellType, cell.getContext(), column.columnDef.cellTypeProps)
  } else {
    content = (overrideValue !== undefined ? overrideValue : cell.renderValue()) as React.ReactNode
  }

  if (!cell.row.getIsGrouped()) return content

  if (column.id === cell.row.groupingColumnId) {
    const expanded = cell.row.getIsExpanded()
    return (
      <span className="yable-group-cell" style={{ paddingLeft: cell.row.depth * 16 }}>
        <button
          type="button"
          className="yable-group-toggle"
          aria-label={expanded ? 'Collapse group' : 'Expand group'}
          aria-expanded={expanded}
          onClick={cell.row.getToggleExpandedHandler()}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <span className="yable-group-value">{String(cell.row.groupingValue ?? '')}</span>
        <span className="yable-group-count">({cell.row.getLeafRows().length})</span>
      </span>
    )
  }

  const aggDef = column.columnDef.aggregatedCell
  if (typeof aggDef === 'function') {
    return (aggDef as CellRenderer<TData>)(cell.getContext())
  }

  const aggVal = cell.getValue()
  return aggVal == null ? null : (aggVal as React.ReactNode)
}
