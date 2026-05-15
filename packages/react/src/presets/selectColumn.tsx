import type { RowData, ColumnDef } from '@zvndev/yable-core'

export interface SelectColumnOptions {
  id?: string
  size?: number
  headerAriaLabel?: string
}

export function selectColumn<TData extends RowData>(
  options: SelectColumnOptions = {},
): ColumnDef<TData, unknown> {
  const { id = '_select', size = 40, headerAriaLabel = 'Select all rows' } = options
  return {
    id,
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        ref={(el) => {
          if (el)
            el.indeterminate =
              table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
        }}
        onChange={() => table.toggleAllPageRowsSelected()}
        aria-label={headerAriaLabel}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        aria-label={`Select row`}
      />
    ),
    size,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
    enableReorder: false,
    enableHiding: false,
    lockVisible: true,
  } as ColumnDef<TData, unknown>
}
