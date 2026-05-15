import type { ReactNode } from 'react'
import type { RowData, ColumnDef, Row, CellContext } from '@zvndev/yable-core'

export interface ActionItem<TData extends RowData> {
  label: string
  icon?: ReactNode
  onClick: (row: Row<TData>) => void
  hidden?: (row: Row<TData>) => boolean
  disabled?: (row: Row<TData>) => boolean
}

export interface ActionsColumnOptions<TData extends RowData> {
  id?: string
  header?: string
  size?: number
  actions: ActionItem<TData>[] | ((row: Row<TData>) => ActionItem<TData>[])
}

export function actionsColumn<TData extends RowData>(
  options: ActionsColumnOptions<TData>,
): ColumnDef<TData, unknown> {
  const { id = '_actions', header = '', size = 100, actions } = options
  return {
    id,
    header,
    cell: (ctx: CellContext<TData, unknown>) => {
      const items = typeof actions === 'function' ? actions(ctx.row) : actions
      return (
        <div className="yable-cell-actions">
          {items
            .filter((a) => !a.hidden || !a.hidden(ctx.row))
            .map((action, i) => (
              <button
                key={i}
                type="button"
                className="yable-action-btn"
                disabled={action.disabled?.(ctx.row)}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick(ctx.row)
                }}
                title={action.label}
              >
                {action.icon ?? action.label}
              </button>
            ))}
        </div>
      )
    },
    size,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
    enableReorder: false,
  } as ColumnDef<TData, unknown>
}
