// @zvndev/yable-react — Main Table Component

import React, { useMemo, useState, useCallback, useRef } from 'react'
import type { HeaderGroup, RowData, Table as TableInstance } from '@zvndev/yable-core'
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
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'
import { useColumnVirtualization } from '../hooks/useColumnVirtualization'

function filterHeaderGroups<TData extends RowData>(
  groups: HeaderGroup<TData>[],
  visibleColumnIds: Set<string>,
): HeaderGroup<TData>[] {
  return groups
    .map((group) => ({
      ...group,
      headers: group.headers.filter((header) => visibleColumnIds.has(header.column.id)),
    }))
    .filter((group) => group.headers.length > 0)
}

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
  emptyMessage,
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
  floatingFilters,
  columnVirtualization,
  columnVirtualizationOverscan,
  ...rest
}: TableProps<TData>) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPanel, setSidebarPanel] = useState<'columns' | 'filters'>(
    defaultSidebarPanel ?? 'columns',
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const horizontalScrollRef = useRef<HTMLDivElement>(null)
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
  const allVisibleColumns = table.getVisibleLeafColumns()
  const hasPinnedColumns =
    table.getLeftVisibleLeafColumns().length > 0 || table.getRightVisibleLeafColumns().length > 0
  const hasGroupedHeaders = table.getHeaderGroups().length > 1
  const canVirtualizeColumns =
    Boolean(columnVirtualization) &&
    !hasPinnedColumns &&
    !hasGroupedHeaders &&
    allVisibleColumns.length > 0

  const columnVirtualState = useColumnVirtualization({
    containerRef: horizontalScrollRef,
    columns: allVisibleColumns,
    overscan: columnVirtualizationOverscan ?? 2,
    enabled: canVirtualizeColumns,
  })

  const renderTable = useMemo(() => {
    if (!canVirtualizeColumns || !columnVirtualState.isVirtualized) {
      return table
    }

    const virtualColumns = columnVirtualState.virtualColumns.map((entry) => entry.column)
    const visibleColumnIds = new Set(virtualColumns.map((column) => column.id))
    const next = Object.create(table) as TableInstance<TData>

    next.getVisibleFlatColumns = () => virtualColumns
    next.getVisibleLeafColumns = () => virtualColumns
    next.getCenterVisibleLeafColumns = () => virtualColumns
    next.getLeftVisibleLeafColumns = () => []
    next.getRightVisibleLeafColumns = () => []
    next.getHeaderGroups = () => filterHeaderGroups(table.getHeaderGroups(), visibleColumnIds)
    next.getCenterHeaderGroups = () =>
      filterHeaderGroups(table.getCenterHeaderGroups(), visibleColumnIds)
    next.getFooterGroups = () => filterHeaderGroups(table.getFooterGroups(), visibleColumnIds)
    next.getCenterFooterGroups = () =>
      filterHeaderGroups(table.getCenterFooterGroups(), visibleColumnIds)

    return next
  }, [
    canVirtualizeColumns,
    columnVirtualState.isVirtualized,
    columnVirtualState.virtualColumns,
    table,
  ])

  const showColumnVirtualizationShell = canVirtualizeColumns

  const contextMenu = useContextMenu()
  useKeyboardNavigation(table, { containerRef })

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      contextMenu.open(e.clientX, e.clientY, table)
    },
    [contextMenu, table],
  )

  const tableNode = (
    <table
      className="yable-table"
      style={
        columnVirtualState.isVirtualized
          ? {
              width: columnVirtualState.visibleWidth,
              minWidth: columnVirtualState.visibleWidth,
              marginLeft: columnVirtualState.startOffset,
              tableLayout: 'fixed',
            }
          : undefined
      }
      data-column-virtualized={columnVirtualState.isVirtualized || undefined}
    >
      <TableHeader table={renderTable} floatingFilters={floatingFilters} />
      <TableBody table={renderTable} clickableRows={clickableRows} />
      {footer && <TableFooter table={renderTable} />}
    </table>
  )

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
          {showColumnVirtualizationShell ? (
            <div
              ref={horizontalScrollRef}
              className="yable-horizontal-scroll-container"
              style={{
                overflowX: 'auto',
                overflowY: 'visible',
                maxWidth: '100%',
                position: 'relative',
              }}
            >
              <div
                className="yable-horizontal-scroll-inner"
                style={{
                  width: Math.max(columnVirtualState.totalWidth, columnVirtualState.visibleWidth),
                  minWidth: Math.max(
                    columnVirtualState.totalWidth,
                    columnVirtualState.visibleWidth,
                  ),
                }}
              >
                {tableNode}
              </div>
            </div>
          ) : (
            tableNode
          )}

          <LoadingOverlay
            loading={loading}
            loadingComponent={renderLoading ? renderLoading() : loadingComponent}
            loadingText={loadingText}
          />

          {!loading &&
            rows.length === 0 &&
            (renderEmpty ? (
              renderEmpty()
            ) : (
              <NoRowsOverlay
                emptyComponent={emptyComponent}
                emptyIcon={emptyIcon}
                emptyMessage={emptyMessage}
                emptyDetail={emptyDetail}
                isFiltered={isFiltered}
              />
            ))}
        </div>

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

        {statusBar && <StatusBar table={table} panels={statusBarPanels} />}

        {children}

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
