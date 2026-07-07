// @zvndev/yable-react — Main Table Component

import React, { useMemo, useState, useCallback, useRef, useEffect, useId } from 'react'
import {
  createTable,
  generatePivotColumnDefs,
  getPivotRowModel as buildPivotRowModel,
  type ColumnDef,
  type HeaderGroup,
  type PivotConfig,
  type PivotColumn,
  type RowData,
  type Table as TableInstance,
  type TableState,
} from '@zvndev/yable-core'
import { TableProvider } from '../context'
import { useYableDefaults } from '../YableProvider'
import { resolveYableProfile } from '../config'
import type { TableProps } from '../types'
import { TableHeader } from './TableHeader'
import { TableBody } from './TableBody'
import { AdaptiveTableCards, type RequiredAdaptiveLayout } from './AdaptiveTableCards'
import { TableFooter } from './TableFooter'
import { LoadingOverlay } from './LoadingOverlay'
import { NoRowsOverlay } from './NoRowsOverlay'
import { StatusBar } from './StatusBar'
import { Sidebar } from './Sidebar'
import { ContextMenu } from './ContextMenu'
import { useContextMenu } from '../hooks/useContextMenu'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'
import { useColumnVirtualization } from '../hooks/useColumnVirtualization'
import { useFillHandle } from '../hooks/useFillHandle'
import { useAutoColumnSizing } from '../hooks/useAutoColumnSizing'
import type { AutoColumnWidthOptions } from '../types'

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
  density: densityProp,
  autoColumnWidth: autoColumnWidthProp,
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
  adaptiveLayout: adaptiveLayoutProp,
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
  const density = densityProp ?? profileTableProps?.density ?? providerTableProps?.density
  const resolvedAutoColumnWidth =
    autoColumnWidthProp ?? profileTableProps?.autoColumnWidth ?? providerTableProps?.autoColumnWidth
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
  const resolvedAdaptiveLayout =
    adaptiveLayoutProp ?? profileTableProps?.adaptiveLayout ?? providerTableProps?.adaptiveLayout

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPanel, setSidebarPanel] = useState<'columns' | 'filters'>(
    resolvedDefaultSidebarPanel ?? 'columns',
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const horizontalScrollRef = useRef<HTMLDivElement>(null)
  const autoWidthInstanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const tableState = table.getState()
  const sourceData = table.options.data
  const pivotTable = usePivotRenderTable(table, tableState, sourceData)
  const baseTable = pivotTable ?? table
  const isRtl = direction === 'rtl'
  const adaptiveLayout = useMemo(
    () => normalizeAdaptiveLayout(resolvedAdaptiveLayout),
    [resolvedAdaptiveLayout],
  )
  const adaptiveLayoutActive = useAdaptiveLayoutActive(containerRef, adaptiveLayout)

  const classNames = [
    'yable',
    theme && `yable-theme-${theme}`,
    stickyHeader && 'yable--sticky-header',
    striped && 'yable--striped',
    bordered && 'yable--bordered',
    compact && 'yable--compact',
    density && `yable--density-${density}`,
    loading && 'yable-loading',
    isRtl && 'yable--rtl',
    sidebarOpen && 'yable--sidebar-open',
    pivotTable && 'yable--pivot-mode',
    adaptiveLayout && adaptiveLayout.mode !== 'table' && 'yable--adaptive-layout',
    adaptiveLayoutActive && 'yable--adaptive-cards-active',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const baseState = baseTable.getState()
  const rows = baseTable.getRowModel().rows
  const hasGlobalFilter = Boolean(baseState.globalFilter)
  const hasColumnFilters = baseState.columnFilters.length > 0
  const isFiltered = hasGlobalFilter || hasColumnFilters
  const allVisibleColumns = baseTable.getVisibleLeafColumns()
  const hasPinnedColumns =
    baseTable.getLeftVisibleLeafColumns().length > 0 ||
    baseTable.getRightVisibleLeafColumns().length > 0
  const hasGroupedHeaders = baseTable.getHeaderGroups().length > 1
  const canVirtualizeColumns =
    !adaptiveLayoutActive &&
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
      return baseTable
    }

    const virtualColumns = columnVirtualState.virtualColumns.map((entry) => entry.column)
    const visibleColumnIds = new Set(virtualColumns.map((column) => column.id))
    const next = Object.create(baseTable) as TableInstance<TData>

    next.getVisibleFlatColumns = () => virtualColumns
    next.getVisibleLeafColumns = () => virtualColumns
    next.getCenterVisibleLeafColumns = () => virtualColumns
    next.getLeftVisibleLeafColumns = () => []
    next.getRightVisibleLeafColumns = () => []
    next.getHeaderGroups = () => filterHeaderGroups(baseTable.getHeaderGroups(), visibleColumnIds)
    next.getCenterHeaderGroups = () =>
      filterHeaderGroups(baseTable.getCenterHeaderGroups(), visibleColumnIds)
    next.getFooterGroups = () => filterHeaderGroups(baseTable.getFooterGroups(), visibleColumnIds)
    next.getCenterFooterGroups = () =>
      filterHeaderGroups(baseTable.getCenterFooterGroups(), visibleColumnIds)

    return next
  }, [
    canVirtualizeColumns,
    columnVirtualState.isVirtualized,
    columnVirtualState.virtualColumns,
    baseTable,
  ])

  const showColumnVirtualizationShell = canVirtualizeColumns

  // Row virtualization renders its own scroll surface: a single scroll
  // container that wraps BOTH the header and the body so pinned header `th` and
  // pinned body `td` resolve their `position: sticky` against the same
  // horizontally-scrolling element. This is bypassed while the column-
  // virtualization shell is active (that path owns its own horizontal scroller)
  // or when the adaptive card layout is showing.
  const enableRowVirtualization = Boolean(renderTable.options.enableVirtualization)
  const useRowVirtualizationSurface =
    enableRowVirtualization && !showColumnVirtualizationShell && !adaptiveLayoutActive

  const contextMenu = useContextMenu()
  useKeyboardNavigation(baseTable, { containerRef })

  // Fill handle drag tracking — provides the mousedown handler the focused
  // cell's FillHandle corner attaches to. Inert unless `enableFillHandle` is set.
  const { onFillHandleMouseDown } = useFillHandle(baseTable, {
    enabled: !pivotTable && Boolean(baseTable.options.enableFillHandle),
  })

  // ---- aria-live announcements for sort, filter, and pagination changes ----
  const [announcement, setAnnouncement] = useState('')
  const prevSortingRef = useRef(baseState.sorting)
  const prevFilterCountRef = useRef(rows.length)
  const prevHasFiltersRef = useRef(isFiltered)
  const prevPaginationRef = useRef(baseState.pagination)
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    // Skip announcements on first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const currentSorting = baseState.sorting
    const currentPagination = baseState.pagination
    const currentRowCount = rows.length
    const currentIsFiltered = isFiltered

    // Check for sorting changes
    if (JSON.stringify(currentSorting) !== JSON.stringify(prevSortingRef.current)) {
      prevSortingRef.current = currentSorting
      const firstSort = currentSorting[0]
      if (firstSort) {
        const column = baseTable.getColumn(firstSort.id)
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
      const pageCount = baseTable.getPageCount()
      if (pageCount > 0) {
        setAnnouncement(`Page ${currentPagination.pageIndex + 1} of ${pageCount}`)
        return
      }
    }
  }, [baseState.pagination, baseState.sorting, baseTable, isFiltered, rows.length])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      // Resolve the right-clicked column from the nearest header/cell so the
      // menu's sort actions operate on the column under the cursor.
      const targetEl = (e.target as HTMLElement | null)?.closest?.('[data-column-id]')
      const targetColumnId = targetEl?.getAttribute('data-column-id') ?? undefined
      contextMenu.open(e.clientX, e.clientY, baseTable, targetColumnId)
    },
    [baseTable, contextMenu],
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

  // Smart column width (opt-in). Disabled for pivot, adaptive cards, and the
  // column-virtualization shell (those own their own width math). Squish + wrap
  // is further disabled under row virtualization inside the hook.
  const autoColumnWidthActive =
    Boolean(resolvedAutoColumnWidth) &&
    !pivotTable &&
    !adaptiveLayoutActive &&
    !showColumnVirtualizationShell
  const autoColumnWidthConfig: AutoColumnWidthOptions =
    resolvedAutoColumnWidth && typeof resolvedAutoColumnWidth === 'object'
      ? resolvedAutoColumnWidth
      : {}
  const autoColumnSignature = autoColumnWidthActive
    ? `${visibleLeafColumns.map((column) => column.id).join(',')}|${rows.length}|${density ?? ''}|${compact ? 1 : 0}`
    : ''
  const { wrapColumnIds } = useAutoColumnSizing({
    table: renderTable,
    columns: visibleLeafColumns,
    measureRef: mainRef,
    enabled: autoColumnWidthActive,
    config: autoColumnWidthConfig,
    isVirtualized: enableRowVirtualization,
    signature: autoColumnSignature,
  })
  const autoWidthClass = wrapColumnIds.length > 0 ? `yable-autofit-${autoWidthInstanceId}` : ''
  const wrapStyleCss = wrapColumnIds.length > 0 ? buildWrapCss(autoWidthClass, wrapColumnIds) : ''

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

  const desktopTableNode = (
    <table
      className="yable-table"
      style={outerTableStyle}
      data-column-virtualized={columnVirtualState.isVirtualized || undefined}
    >
      {colgroup}
      <TableHeader table={renderTable} floatingFilters={resolvedFloatingFilters} />
      <TableBody
        table={renderTable}
        clickableRows={resolvedClickableRows}
        colgroup={colgroup}
        onFillHandleMouseDown={onFillHandleMouseDown}
      />
      {footer && <TableFooter table={renderTable} />}
    </table>
  )

  // Row-virtualization surface: TableBody renders the full
  // `<div.yable-virtual-scroll-container><table>{colgroup}{header}<tbody/></table></div>`
  // so header and body share one sticky/scroll context.
  const rowVirtualizationSurfaceNode = (
    <TableBody
      table={renderTable}
      clickableRows={resolvedClickableRows}
      colgroup={colgroup}
      onFillHandleMouseDown={onFillHandleMouseDown}
      virtualizationSurface={{
        header: <TableHeader table={renderTable} floatingFilters={resolvedFloatingFilters} />,
        footer: footer ? <TableFooter table={renderTable} /> : undefined,
      }}
    />
  )

  const tableNode =
    adaptiveLayoutActive && adaptiveLayout ? (
      <AdaptiveTableCards
        table={baseTable}
        layout={adaptiveLayout}
        clickableRows={resolvedClickableRows}
      />
    ) : useRowVirtualizationSurface ? (
      rowVirtualizationSurfaceNode
    ) : (
      desktopTableNode
    )

  return (
    <TableProvider value={baseTable}>
      <div
        ref={containerRef}
        className={autoWidthClass ? `${classNames} ${autoWidthClass}` : classNames}
        data-theme={theme}
        dir={direction}
        role="grid"
        aria-label={ariaLabel ?? 'Data table'}
        aria-rowcount={baseTable.getRowModel().rows.length}
        aria-colcount={baseTable.getVisibleLeafColumns().length}
        onContextMenu={handleContextMenu}
        {...rest}
      >
        {wrapStyleCss ? <style dangerouslySetInnerHTML={{ __html: wrapStyleCss }} /> : null}
        <div className="yable-main" ref={mainRef}>
          {showColumnVirtualizationShell && !adaptiveLayoutActive ? (
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

        {resolvedSidebar && !sidebarOpen && (
          <button
            type="button"
            className="yable-sidebar-trigger"
            aria-label="Open tool panel"
            title="Open tool panel"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="3"
                y="4"
                width="18"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line x1="14" y1="4" x2="14" y2="20" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        )}

        {resolvedSidebar && (
          <Sidebar
            table={baseTable}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            panels={resolvedSidebarPanels}
            activePanel={sidebarPanel}
            onPanelChange={setSidebarPanel}
          />
        )}

        {resolvedStatusBar && <StatusBar table={baseTable} panels={statusBarPanels} />}

        {children}

        {contextMenu.isOpen && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={contextMenu.close}
            table={baseTable}
            targetColumnId={contextMenu.targetColumnId}
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

// Scoped CSS enabling text wrap on squished auto-sized columns. Scoped to this
// grid instance's generated class so it never affects sibling grids.
function buildWrapCss(scope: string, columnIds: string[]): string {
  const selectors = columnIds
    .map((id) => {
      const escaped = id.replace(/[\\"]/g, '\\$&')
      return (
        `.${scope} .yable-td[data-column-id="${escaped}"],` +
        `.${scope} .yable-th[data-column-id="${escaped}"]`
      )
    })
    .join(',')
  return `${selectors}{white-space:normal;overflow-wrap:anywhere;}`
}

type PivotEngineConfig = Parameters<typeof buildPivotRowModel<RowData>>[2]

function usePivotRenderTable<TData extends RowData>(
  table: TableInstance<TData>,
  tableState: TableState,
  sourceData: TData[],
): TableInstance<TData> | null {
  const activeConfig = getActivePivotConfig(table, tableState)

  return useMemo(() => {
    if (!activeConfig) return null

    const engineConfig = activeConfig as unknown as PivotEngineConfig
    const { rowModel, columns } = buildPivotRowModel(table, sourceData, engineConfig)
    const rowIds = rowModel.rows.map((row) => row.id)
    const pivotData = rowModel.rows.map((row) => row.original)
    const columnDefs = getPivotRenderColumnDefs<TData>(engineConfig, columns)

    const renderTable = createTable<TData>({
      ...table.options,
      data: pivotData,
      columns: columnDefs,
      state: {
        ...tableState,
        grouping: [],
      },
      onStateChange: table.options.onStateChange,
      getRowId: (_row, index) => rowIds[index] ?? `pivot_${index}`,
      enableFillHandle: false,
      enablePivot: false,
      enableGrouping: false,
      enableRowDragging: false,
    })

    renderTable.events = table.events

    return renderTable
  }, [activeConfig, sourceData, table, tableState])
}

function getActivePivotConfig<TData extends RowData>(
  table: TableInstance<TData>,
  state: TableState,
): PivotConfig | null {
  const stateConfig = state.pivot?.config
  const optionConfig = table.options.pivotConfig
  const isEnabled = Boolean(table.options.enablePivot || state.pivot?.enabled)
  const config = hasPivotConfig(stateConfig) ? stateConfig : optionConfig

  if (!isEnabled || !hasPivotConfig(config)) {
    return null
  }

  return config
}

function hasPivotConfig(config: PivotConfig | undefined): config is PivotConfig {
  return Boolean(config?.valueFields?.length)
}

function getPivotRenderColumnDefs<TData extends RowData>(
  config: PivotEngineConfig,
  columns: PivotColumn[],
): ColumnDef<TData, unknown>[] {
  return generatePivotColumnDefs<TData>(config, columns).map((columnDef) => ({
    ...columnDef,
    editable: false,
    enableGrouping: false,
    enableReorder: false,
    enableCellSelection: false,
    lockVisible: columnDef.id === '_pivotLabel' ? true : columnDef.lockVisible,
    size: columnDef.id === '_pivotLabel' ? (columnDef.size ?? 220) : columnDef.size,
  }))
}

const DEFAULT_ADAPTIVE_BREAKPOINT = 720
const DEFAULT_ADAPTIVE_SECONDARY_COLUMNS = 8

function normalizeAdaptiveLayout<TData extends RowData>(
  layout: TableProps<TData>['adaptiveLayout'],
): RequiredAdaptiveLayout<TData> | null {
  if (!layout) return null

  if (layout === true) {
    return {
      mode: 'auto',
      breakpoint: DEFAULT_ADAPTIVE_BREAKPOINT,
      maxSecondaryColumns: DEFAULT_ADAPTIVE_SECONDARY_COLUMNS,
    }
  }

  return {
    mode: layout.mode ?? 'auto',
    breakpoint: layout.breakpoint ?? DEFAULT_ADAPTIVE_BREAKPOINT,
    primaryColumnId: layout.primaryColumnId,
    secondaryColumnIds: layout.secondaryColumnIds,
    hiddenColumnIds: layout.hiddenColumnIds,
    maxSecondaryColumns: layout.maxSecondaryColumns ?? DEFAULT_ADAPTIVE_SECONDARY_COLUMNS,
    renderCard: layout.renderCard,
  }
}

function useAdaptiveLayoutActive<TData extends RowData>(
  containerRef: React.RefObject<HTMLDivElement | null>,
  layout: RequiredAdaptiveLayout<TData> | null,
): boolean {
  const [active, setActive] = useState(() => layout?.mode === 'cards')

  useEffect(() => {
    if (!layout) {
      setActive(false)
      return
    }

    if (layout.mode === 'cards' || layout.mode === 'table') {
      setActive(layout.mode === 'cards')
      return
    }

    const node = containerRef.current
    if (!node) return

    const update = (width: number) => {
      setActive(width <= layout.breakpoint)
    }

    update(node.getBoundingClientRect().width || node.clientWidth)

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => update(node.getBoundingClientRect().width || node.clientWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? node.getBoundingClientRect().width
      update(width)
    })
    observer.observe(node)

    return () => observer.disconnect()
  }, [containerRef, layout])

  return active
}
