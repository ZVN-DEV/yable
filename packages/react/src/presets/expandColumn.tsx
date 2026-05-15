import type { RowData, ColumnDef } from '@zvndev/yable-core'

export interface ExpandColumnOptions {
  id?: string
  size?: number
}

export function expandColumn<TData extends RowData>(
  options: ExpandColumnOptions = {},
): ColumnDef<TData, unknown> {
  const { id = '_expand', size = 40 } = options
  return {
    id,
    header: () => null,
    cell: ({ row }) => {
      if (!row.getCanExpand()) return null
      return (
        <button
          type="button"
          className="yable-expand-btn"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleExpanded()
          }}
          aria-expanded={row.getIsExpanded()}
          aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
        >
          <span
            className="yable-expand-icon"
            style={{
              display: 'inline-block',
              transform: row.getIsExpanded() ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 150ms ease',
            }}
          >
            ▶
          </span>
        </button>
      )
    },
    size,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
    enableReorder: false,
    lockVisible: true,
  } as ColumnDef<TData, unknown>
}
