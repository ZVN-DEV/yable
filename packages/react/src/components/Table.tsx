// @yable/react — Main Table Component

import React, { useState, useCallback, useRef } from 'react'
import type { RowData } from '@yable/core'
import { TableProvider } from '../context'
import type { TableProps } from '../types'
import { TableHeader } from './TableHeader'
import { TableBody } from './TableBody'
import { TableFooter } from './TableFooter'
import { LoadingOverlay } from './LoadingOverlay'
import { NoRowsOverlay } from './NoRowsOverlay'
import { StatusBar } from './StatusBar'
import { Sidebar } from './Sidebar'
import { ContextMenu } from './ContextMenu'
import { useContextMenu } from '../hooks/useContextMenu'

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
  loadingComponent,
  loadingText,
  emptyMessage = 'No data',
  emptyComponent,
  emptyIcon,
  emptyDetail,
  renderEmpty,
  renderLoading,
  children,
  className,
  direction,
  statusBar,
  statusBarPanels,
  sidebar,
  sidebarPanels = ['columns', 'filters'],
  defaultSidebarPanel,
  ...rest
}: TableProps<TData>) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPanel, setSidebarPanel] = useState<'columns' | 'filters'>(
    defaultSidebarPanel ?? 'columns'
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const isRtl = direction === 'rtl'

  const classNames = [
    'yable',
    theme && `yable-theme-${theme}`,
    stickyHeader && 'yable--sticky-header',
    striped && 'yable--striped',
    bordered && 'yable--bordered',
    compact && 'yable--compact',
    loading && 'yable-loading',
    isRtl && 'yable--rtl',
    sidebarOpen && 'yable--sidebar-open',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const rows = table.getRowModel().rows
  const hasGlobalFilter = Boolean(table.getState().globalFilter)
  const hasColumnFilters = table.getState().columnFilters.length > 0
  const isFiltered = hasGlobalFilter || hasColumnFilters

  // Context menu
  const contextMenu = useContextMenu()

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      contextMenu.open(e.clientX, e.clientY, table)
    },
    [contextMenu, table]
  )

  // toggleSidebar — currently wired in but not yet connected to UI
  // Will be used when sidebar toggle button is added
  void sidebarPanel

  return (
    <TableProvider value={table}>
      <div
        ref={containerRef}
        className={classNames}
        data-theme={theme}
        dir={direction}
        role="grid"
        aria-rowcount={table.getRowModel().rows.length}
        aria-colcount={table.getVisibleLeafColumns().length}
        onContextMenu={handleContextMenu}
        {...rest}
      >
        <div className="yable-main">
          <table className="yable-table">
            <TableHeader table={table} />
            <TableBody
              table={table}
              clickableRows={clickableRows}
            />
            {footer && <TableFooter table={table} />}
          </table>

          {/* Loading overlay sits on top of the table content */}
          <LoadingOverlay
            loading={loading}
            loadingComponent={renderLoading ? renderLoading() : loadingComponent}
            loadingText={loadingText}
          />

          {/* Empty state — shown when no rows and not loading */}
          {!loading && rows.length === 0 && (
            renderEmpty ? (
              renderEmpty()
            ) : (
              <NoRowsOverlay
                emptyComponent={emptyComponent}
                emptyIcon={emptyIcon}
                emptyMessage={emptyMessage}
                emptyDetail={emptyDetail}
                isFiltered={isFiltered}
              />
            )
          )}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <Sidebar
            table={table}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            panels={sidebarPanels}
            activePanel={sidebarPanel}
            onPanelChange={setSidebarPanel}
          />
        )}

        {/* Status bar */}
        {statusBar && (
          <StatusBar table={table} panels={statusBarPanels} />
        )}

        {children}

        {/* Context menu */}
        {contextMenu.isOpen && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={contextMenu.close}
            table={table}
          />
        )}
      </div>
    </TableProvider>
  )
}
