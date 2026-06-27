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
      <label className="yable-checkbox-hitbox" onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          className="yable-checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el)
              el.indeterminate =
                table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
          }}
          onChange={() => table.toggleAllPageRowsSelected()}
          aria-label={headerAriaLabel}
        />
      </label>
    ),
    cell: ({ row }) => (
      <label className="yable-checkbox-hitbox" onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          className="yable-checkbox"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
        />
      </label>
    ),
    size,
    enableSorting: true,
    sortingFn: (rowA, rowB) => Number(rowA.getIsSelected()) - Number(rowB.getIsSelected()),
    enableColumnFilter: false,
    enableResizing: false,
    enableReorder: false,
    enableHiding: false,
    lockVisible: true,
  } as ColumnDef<TData, unknown>
}
