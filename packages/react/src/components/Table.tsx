// @yable/react — Main Table Component

import type { RowData } from '@yable/core'
import { TableProvider } from '../context'
import type { TableProps } from '../types'
import { TableHeader } from './TableHeader'
import { TableBody } from './TableBody'
import { TableFooter } from './TableFooter'

export function Table<TData extends RowData>({
  table,
  stickyHeader,
  striped,
  bordered,
  compact,
  theme,
  clickableRows,
  footer,
  loading,
  emptyMessage = 'No data',
  renderEmpty,
  renderLoading,
  children,
  className,
  ...rest
}: TableProps<TData>) {
  const classNames = [
    'yable',
    theme && `yable-theme-${theme}`,
    stickyHeader && 'yable--sticky-header',
    striped && 'yable--striped',
    bordered && 'yable--bordered',
    compact && 'yable--compact',
    loading && 'yable-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const rows = table.getRowModel().rows

  return (
    <TableProvider value={table}>
      <div
        className={classNames}
        data-theme={theme}
        role="grid"
        aria-rowcount={table.getRowModel().rows.length}
        aria-colcount={table.getVisibleLeafColumns().length}
        {...rest}
      >
        {loading && renderLoading ? (
          renderLoading()
        ) : (
          <table className="yable-table">
            <TableHeader table={table} />
            <TableBody
              table={table}
              clickableRows={clickableRows}
            />
            {footer && <TableFooter table={table} />}
          </table>
        )}

        {!loading && rows.length === 0 && (
          renderEmpty ? (
            renderEmpty()
          ) : (
            <div className="yable-empty">
              <div className="yable-empty-message">{emptyMessage}</div>
            </div>
          )
        )}

        {children}
      </div>
    </TableProvider>
  )
}
