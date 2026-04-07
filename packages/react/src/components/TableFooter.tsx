// @zvndev/yable-react — Table Footer Component

import type { RowData, Table } from '@zvndev/yable-core'

interface TableFooterProps<TData extends RowData> {
  table: Table<TData>
}

export function TableFooter<TData extends RowData>({
  table,
}: TableFooterProps<TData>) {
  const footerGroups = table.getFooterGroups()

  if (!footerGroups.length) return null

  return (
    <tfoot className="yable-tfoot">
      {footerGroups.map((footerGroup) => (
        <tr key={footerGroup.id} className="yable-tr">
          {footerGroup.headers.map((header) => {
            const footerDef = header.column.columnDef.footer
            const content = header.isPlaceholder
              ? null
              : typeof footerDef === 'function'
                ? (footerDef as Function)(header.getContext())
                : footerDef ?? null

            return (
              <td key={header.id} className="yable-td" colSpan={header.colSpan}>
                {content}
              </td>
            )
          })}
        </tr>
      ))}
    </tfoot>
  )
}
