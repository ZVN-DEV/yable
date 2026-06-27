// @zvndev/yable-react — Main Table Component

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import type { HeaderGroup, RowData, Table as TableInstance } from '@zvndev/yable-core'
import { TableProvider } from '../context'
import { useYableDefaults } from '../YableProvider'
import { resolveYableProfile } from '../config'
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
  stickyHeader: stickyHeaderProp,
  striped: stripedProp,
  bordered: borderedProp,
  compact: compactProp,
  theme: themeProp,
  config,
  configProfile,
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
  direction: directionProp,
  statusBar,
  statusBarPanels,
  sidebar,
  sidebarPanels,
  defaultSidebarPanel,
  floatingFilters,
  columnVirtualization,
  columnVirtualizationOverscan,
  ariaLabel: ariaLabelProp,
  ...rest
}: TableProps<TData>) {
  // Merge provider-level tableProps under explicit props (explicit wins)
  const providerDefaults = useYableDefaults()
  const { tableProps: providerTableProps } = providerDefaults
  const profile = resolveYableProfile(
    config ?? providerDefaults.config,
    configProfile ?? providerDefaults.tableProfile,
  )
  const profileTableProps = profile.table
  const stickyHeader =
    stickyHeaderProp ?? profileTableProps?.stickyHeader ?? providerTableProps?.stickyHeader
  const striped = stripedProp ?? profileTableProps?.striped ?? providerTableProps?.striped
  const bordered = borderedProp ?? profileTableProps?.bordered ?? providerTableProps?.bordered
  const compact = compactProp ?? profileTableProps?.compact ?? providerTableProps?.compact
  const theme = themeProp ?? profileTableProps?.theme ?? providerTableProps?.theme
  const direction = directionProp ?? profileTableProps?.direction ?? providerTableProps?.direction
  const ariaLabel = ariaLabelProp ?? profileTableProps?.ariaLabel ?? providerTableProps?.ariaLabel
  const resolvedClickableRows = clickableRows ?? profileTableProps?.clickableRows
  const resolvedStatusBar = statusBar ?? profileTableProps?.statusBar
  const resolvedSidebar = sidebar ?? profileTableProps?.sidebar
  const resolvedSidebarPanels = sidebarPanels ??
    profileTableProps?.sidebarPanels ?? ['columns', 'filters']
  const resolvedDefaultSidebarPanel = defaultSidebarPanel ?? profileTableProps?.defaultSidebarPanel
  const resolvedFloatingFilters = floatingFilters ?? profileTableProps?.floatingFilters
  const resolvedColumnVirtualization =
    columnVirtualization ?? profileTableProps?.columnVirtualization
  const resolvedColumnVirtualizationOverscan =
    columnVirtualizationOverscan ?? profileTableProps?.columnVirtualizationOverscan

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPanel, setSidebarPanel] = useState<'columns' | 'filters'>(
    resolvedDefaultSidebarPanel ?? 'columns',
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
    Boolean(resolvedColumnVirtualization) &&
    !hasPinnedColumns &&
    !hasGroupedHeaders &&
    allVisibleColumns.length > 0
  const allVisibleColumnSizeSignature = allVisibleColumns
    .map((column) => `${column.id}:${column.getSize()}`)
    .join('|')

  const columnVirtualState = useColumnVirtualization({
    containerRef: horizontalScrollRef,
    columns: allVisibleColumns,
    overscan: resolvedColumnVirtualizationOverscan ?? 2,
    enabled: canVirtualizeColumns,
    sizingKey: allVisibleColumnSizeSignature,
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

  // ---- aria-live announcements for sort, filter, and pagination changes ----
  const [announcement, setAnnouncement] = useState('')
  const prevSortingRef = useRef(table.getState().sorting)
  const prevFilterCountRef = useRef(rows.length)
  const prevHasFiltersRef = useRef(isFiltered)
  const prevPaginationRef = useRef(table.getState().pagination)
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    // Skip announcements on first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const currentSorting = table.getState().sorting
    const currentPagination = table.getState().pagination
    const currentRowCount = rows.length
    const currentIsFiltered = isFiltered

    // Check for sorting changes
    if (JSON.stringify(currentSorting) !== JSON.stringify(prevSortingRef.current)) {
      prevSortingRef.current = currentSorting
      const firstSort = currentSorting[0]
      if (firstSort) {
        const column = table.getColumn(firstSort.id)
        const headerDef = column?.columnDef.header
        const columnName = typeof headerDef === 'string' ? headerDef : firstSort.id
        const direction = firstSort.desc ? 'descending' : 'ascending'
        setAnnouncement(`Sorted by ${columnName} ${direction}`)
        return
      }
    }

    // Check for filter result count changes
    if (
      currentRowCount !== prevFilterCountRef.current ||
      currentIsFiltered !== prevHasFiltersRef.current
    ) {
      prevFilterCountRef.current = currentRowCount
      prevHasFiltersRef.current = currentIsFiltered
      if (currentIsFiltered) {
        setAnnouncement(`${currentRowCount} rows after filtering`)
        return
      }
    }

    // Check for pagination changes
    if (JSON.stringify(currentPagination) !== JSON.stringify(prevPaginationRef.current)) {
      prevPaginationRef.current = currentPagination
      const pageCount = table.getPageCount()
      if (pageCount > 0) {
        setAnnouncement(`Page ${currentPagination.pageIndex + 1} of ${pageCount}`)
        return
      }
    }
  })

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      contextMenu.open(e.clientX, e.clientY, table)
    },
    [contextMenu, table],
  )

  const visibleLeafColumns = renderTable.getVisibleLeafColumns()
  const visibleColumnTotalSize = visibleLeafColumns.reduce(
    (sum, column) => sum + column.getSize(),
    0,
  )

  const colgroup =
    visibleLeafColumns.length === 0 ? null : (
      <colgroup>
        {visibleLeafColumns.map((col) => (
          <col key={col.id} style={{ width: col.getSize() }} />
        ))}
      </colgroup>
    )

  const outerTableStyle = useMemo((): React.CSSProperties | undefined => {
    if (columnVirtualState.isVirtualized) {
      return {
        width: columnVirtualState.visibleWidth,
        minWidth: columnVirtualState.visibleWidth,
        marginLeft: columnVirtualState.startOffset,
        tableLayout: 'fixed',
      }
    }
    return {
      minWidth: visibleColumnTotalSize || undefined,
      tableLayout: 'fixed',
    }
  }, [
    columnVirtualState.isVirtualized,
    columnVirtualState.visibleWidth,
    columnVirtualState.startOffset,
    visibleColumnTotalSize,
  ])

  const tableNode = (
    <table
      className="yable-table"
      style={outerTableStyle}
      data-column-virtualized={columnVirtualState.isVirtualized || undefined}
    >
      {colgroup}
      <TableHeader table={renderTable} floatingFilters={resolvedFloatingFilters} />
      <TableBody table={renderTable} clickableRows={resolvedClickableRows} colgroup={colgroup} />
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
        aria-label={ariaLabel ?? 'Data table'}
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

        {resolvedSidebar && (
          <Sidebar
            table={table}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            panels={resolvedSidebarPanels}
            activePanel={sidebarPanel}
            onPanelChange={setSidebarPanel}
          />
        )}

        {resolvedStatusBar && <StatusBar table={table} panels={statusBarPanels} />}

        {children}

        {contextMenu.isOpen && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={contextMenu.close}
            table={table}
          />
        )}

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {announcement}
        </div>
      </div>
    </TableProvider>
  )
}
