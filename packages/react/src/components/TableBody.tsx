// @zvndev/yable-react — Table Body Component

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Column, RowData, Table, Row } from '@zvndev/yable-core'
import {
  getRowSpan,
  resolveRowSpans,
  type RowSpanMap,
} from '@zvndev/yable-core/features/rowSpanning'
import { TableCell } from './TableCell'
import { CellErrorBoundary } from './ErrorBoundary'
import { MasterDetail } from './MasterDetail'
import { useVirtualization } from '../hooks/useVirtualization'

const EMPTY_PINNED_ROW_IDS: string[] = []

interface TableBodyProps<TData extends RowData> {
  table: Table<TData>
  clickableRows?: boolean
  colgroup?: React.ReactNode
  /** Stable mousedown handler for the fill handle, lifted from `useFillHandle`. */
  onFillHandleMouseDown?: (rowIndex: number, columnIndex: number, e: React.MouseEvent) => void
}

export function TableBody<TData extends RowData>({
  table,
  clickableRows,
  colgroup,
  onFillHandleMouseDown,
}: TableBodyProps<TData>) {
  const rowModel = table.getRowModel()
  const rows = rowModel.rows
  const visibleColumns = table.getVisibleLeafColumns()
  const activeCell = table.getState().editing.activeCell
  const focusedCell = table.getFocusedCell()
  const rowPinning = table.getState().rowPinning
  const pinnedTopRowIds = rowPinning.top ?? EMPTY_PINNED_ROW_IDS
  const pinnedBottomRowIds = rowPinning.bottom ?? EMPTY_PINNED_ROW_IDS
  const hasPinnedRows = pinnedTopRowIds.length > 0 || pinnedBottomRowIds.length > 0
  const coreRowsById = table.getCoreRowModel().rowsById
  const topRows = useMemo(
    () => (hasPinnedRows ? getRowsById(pinnedTopRowIds, coreRowsById) : []),
    [coreRowsById, hasPinnedRows, pinnedTopRowIds],
  )
  const centerRows = useMemo(
    () => (hasPinnedRows ? getUnpinnedRows(rows, pinnedTopRowIds, pinnedBottomRowIds) : rows),
    [hasPinnedRows, pinnedBottomRowIds, pinnedTopRowIds, rows],
  )
  const bottomRows = useMemo(
    () => (hasPinnedRows ? getRowsById(pinnedBottomRowIds, coreRowsById) : []),
    [coreRowsById, hasPinnedRows, pinnedBottomRowIds],
  )
  const virtualizedRows = hasPinnedRows ? centerRows : rows
  const cellSelection = table.getState().cellSelection ?? {
    range: null,
    anchor: null,
    isDragging: false,
  }
  const pendingValues = table.getState().editing.pendingValues ?? {}
  const options = table.options
  const enableVirtualization = options.enableVirtualization ?? false
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const rowHeight = options.rowHeight ?? 40
  const overscan = options.overscan ?? 5
  const estimateRowHeight = options.estimateRowHeight
  const pretextHeights = options.pretextHeights ?? null
  const pretextPrefixSums = options.pretextPrefixSums ?? null

  const virtualRowHeight = useMemo(() => {
    if (!hasPinnedRows || typeof rowHeight !== 'function') return rowHeight
    return (index: number) => rowHeight(topRows.length + index)
  }, [hasPinnedRows, rowHeight, topRows.length])

  const virtualPretext = useMemo(() => {
    if (!hasPinnedRows || !pretextHeights || !pretextPrefixSums) {
      return {
        heights: pretextHeights,
        prefixSums: pretextPrefixSums,
      }
    }

    const rowIndexById = new Map(rows.map((row, index) => [row.id, index]))
    const heights = new Float64Array(virtualizedRows.length)
    const prefixSums = new Float64Array(virtualizedRows.length + 1)
    const fallbackHeight =
      typeof rowHeight === 'number' && Number.isFinite(rowHeight) ? rowHeight : 0

    for (let index = 0; index < virtualizedRows.length; index++) {
      const row = virtualizedRows[index]!
      const sourceIndex = rowIndexById.get(row.id)
      const sourceHeight = sourceIndex === undefined ? undefined : pretextHeights[sourceIndex]
      const height =
        typeof sourceHeight === 'number' && Number.isFinite(sourceHeight) && sourceHeight > 0
          ? sourceHeight
          : fallbackHeight

      heights[index] = height
      prefixSums[index + 1] = prefixSums[index]! + height
    }

    return { heights, prefixSums }
  }, [hasPinnedRows, pretextHeights, pretextPrefixSums, rowHeight, rows, virtualizedRows])

  // Derive a stable hash from columnSizing so the virtualization hook can
  // invalidate its row-height cache when column widths change (text wrapping).
  const columnSizing = table.getState().columnSizing
  const columnSizingHash = useMemo(() => {
    const entries = Object.entries(columnSizing)
    if (entries.length === 0) return 0
    // Simple numeric hash: sum of (charCode-weighted key + value)
    let h = 0
    for (const [key, value] of entries) {
      for (let i = 0; i < key.length; i++) {
        h = (h * 31 + key.charCodeAt(i)) | 0
      }
      h = (h * 31 + (value | 0)) | 0
    }
    return h
  }, [columnSizing])

  const rowSpanColumnDefs = useMemo(
    () => visibleColumns.map((column) => column.columnDef),
    [visibleColumns],
  )
  const hasRowSpanColumns = useMemo(
    () => visibleColumns.some((column) => typeof column.columnDef.rowSpan === 'function'),
    [visibleColumns],
  )

  const fullRowSpanMap = useMemo(
    () => (hasRowSpanColumns ? resolveRowSpans(rows, rowSpanColumnDefs) : undefined),
    [hasRowSpanColumns, rowSpanColumnDefs, rows],
  )
  const topRowSpanMap = useMemo(
    () =>
      hasRowSpanColumns && hasPinnedRows ? resolveRowSpans(topRows, rowSpanColumnDefs) : undefined,
    [hasPinnedRows, hasRowSpanColumns, rowSpanColumnDefs, topRows],
  )
  const centerRowSpanMap = useMemo(
    () =>
      hasRowSpanColumns && (hasPinnedRows || enableVirtualization)
        ? resolveRowSpans(virtualizedRows, rowSpanColumnDefs)
        : undefined,
    [enableVirtualization, hasPinnedRows, hasRowSpanColumns, rowSpanColumnDefs, virtualizedRows],
  )
  const bottomRowSpanMap = useMemo(
    () =>
      hasRowSpanColumns && hasPinnedRows
        ? resolveRowSpans(bottomRows, rowSpanColumnDefs)
        : undefined,
    [bottomRows, hasPinnedRows, hasRowSpanColumns, rowSpanColumnDefs],
  )

  const { virtualRows, totalHeight } = useVirtualization({
    containerRef: scrollContainerRef,
    totalRows: virtualizedRows.length,
    rowHeight: virtualRowHeight,
    overscan,
    estimateRowHeight,
    pretextHeights: virtualPretext.heights,
    pretextPrefixSums: virtualPretext.prefixSums,
    columnSizingHash,
  })

  const cellSelectionKey = cellSelection.range
    ? `${cellSelection.range.start.rowIndex}:${cellSelection.range.start.columnIndex}:${cellSelection.range.end.rowIndex}:${cellSelection.range.end.columnIndex}:${cellSelection.isDragging ? 'dragging' : 'idle'}`
    : `none:${cellSelection.isDragging ? 'dragging' : 'idle'}`

  const visibleVirtualRowIndexes = useMemo(() => {
    if (!enableVirtualization || !hasRowSpanColumns) return undefined
    return new Set(virtualRows.map((row) => row.index))
  }, [enableVirtualization, hasRowSpanColumns, virtualRows])

  // Width of a classic (non-overlay) scrollbar in the virtual scroll
  // container; the body table compensates by this much to stay width-synced
  // with the header table. 0 on overlay-scrollbar platforms (macOS default).
  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      setScrollbarWidth(Math.max(0, el.offsetWidth - el.clientWidth))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [enableVirtualization])

  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (table.getState().cellSelection?.isDragging) {
        table.endCellRangeSelection()
      }
    }

    window.addEventListener('mouseup', handleWindowMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [table])

  const renderRow = (
    row: Row<TData>,
    rowIndex: number,
    pinnedPosition?: 'top' | 'bottom',
    rowSpanMap?: RowSpanMap,
    rowSpanRowIndex = rowIndex,
  ) => (
    <MemoizedTableRow
      key={row.id}
      row={row}
      table={table}
      rowIndex={rowIndex}
      rowSpanRowIndex={rowSpanRowIndex}
      rowSpanMap={rowSpanMap}
      visibleColumns={visibleColumns}
      isSelected={row.getIsSelected()}
      isExpanded={row.getIsExpanded()}
      isRowEditing={table.isRowEditing(row.id)}
      activeColumnId={activeCell?.rowId === row.id ? activeCell.columnId : undefined}
      focusedColumnIndex={focusedCell?.rowIndex === rowIndex ? focusedCell.columnIndex : null}
      hasFocusedCell={focusedCell !== null}
      cellSelectionKey={cellSelectionKey}
      pendingValuesKey={getPendingValuesKey(pendingValues[row.id])}
      clickable={clickableRows}
      pinnedPosition={pinnedPosition}
      onFillHandleMouseDown={onFillHandleMouseDown}
    />
  )

  if (!enableVirtualization) {
    // When no rows are pinned, getCenterRows() === the full row set, so we keep
    // the original full-row render to guarantee identical output. Only split
    // into top/center/bottom sections once row pinning is actually in use.
    if (hasPinnedRows) {
      let visualIndex = 0
      return (
        <tbody className="yable-tbody">
          {topRows.map((row, index) => renderRow(row, visualIndex++, 'top', topRowSpanMap, index))}
          {centerRows.map((row, index) =>
            renderRow(row, visualIndex++, undefined, centerRowSpanMap, index),
          )}
          {bottomRows.map((row, index) =>
            renderRow(row, visualIndex++, 'bottom', bottomRowSpanMap, index),
          )}
        </tbody>
      )
    }

    // Non-virtualized: render all rows directly
    return (
      <tbody className="yable-tbody">
        {rows.map((row, rowIndex) => renderRow(row, rowIndex, undefined, fullRowSpanMap, rowIndex))}
      </tbody>
    )
  }

  // Virtualized rendering
  const hasPretextData = !!(virtualPretext.heights && virtualPretext.prefixSums)
  const fixedRowHeight = typeof rowHeight === 'number' && !hasPretextData ? rowHeight : undefined
  const containerHeight =
    options.virtualViewportHeight ??
    (hasPretextData
      ? Math.min(totalHeight, 800) // Pretext: use real total, cap at 800px viewport
      : fixedRowHeight
        ? Math.min(totalHeight, fixedRowHeight * 20) // Default visible area ~20 rows
        : 600) // Fallback for variable heights

  // The mounted window is offset as one block. Rows stay real table rows so
  // the shared colgroup governs cell widths — per-row absolute positioning
  // blockifies <tr>, detaching body cell widths from the header table.
  const windowStart = virtualRows.length > 0 ? virtualRows[0]!.start : 0

  return (
    <tbody className="yable-tbody">
      {hasPinnedRows &&
        topRows.map((row, index) => renderRow(row, index, 'top', topRowSpanMap, index))}
      <tr style={{ height: 0, padding: 0, border: 'none' }}>
        <td style={{ height: 0, padding: 0, border: 'none' }} colSpan={visibleColumns.length}>
          <div
            ref={scrollContainerRef}
            className="yable-virtual-scroll-container"
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              height: containerHeight,
              position: 'relative',
            }}
          >
            <div
              className="yable-virtual-spacer"
              style={{ height: totalHeight, position: 'relative' }}
            >
              <table
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  // Match the header table's width (the scroll container's
                  // border-box) so table-layout: fixed distributes the shared
                  // colgroup identically in both tables even when a classic
                  // scrollbar narrows this one's content-box.
                  width: `calc(100% + ${scrollbarWidth}px)`,
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  transform: `translateY(${windowStart}px)`,
                }}
              >
                {colgroup}
                <tbody>
                  {virtualRows.map((vRow) => {
                    const row = virtualizedRows[vRow.index]
                    if (!row) return null
                    const visualRowIndex = hasPinnedRows ? topRows.length + vRow.index : vRow.index
                    return (
                      <MemoizedTableRow
                        key={row.id}
                        row={row}
                        table={table}
                        rowIndex={visualRowIndex}
                        rowSpanRowIndex={vRow.index}
                        rowSpanMap={centerRowSpanMap ?? fullRowSpanMap}
                        visibleRowSpanIndexes={visibleVirtualRowIndexes}
                        visibleColumns={visibleColumns}
                        isSelected={row.getIsSelected()}
                        isExpanded={row.getIsExpanded()}
                        isRowEditing={table.isRowEditing(row.id)}
                        activeColumnId={
                          activeCell?.rowId === row.id ? activeCell.columnId : undefined
                        }
                        focusedColumnIndex={
                          focusedCell?.rowIndex === visualRowIndex ? focusedCell.columnIndex : null
                        }
                        hasFocusedCell={focusedCell !== null}
                        cellSelectionKey={cellSelectionKey}
                        pendingValuesKey={getPendingValuesKey(pendingValues[row.id])}
                        clickable={clickableRows}
                        onFillHandleMouseDown={onFillHandleMouseDown}
                        virtualStyle={{ height: vRow.size }}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </td>
      </tr>
      {hasPinnedRows &&
        bottomRows.map((row, index) =>
          renderRow(
            row,
            topRows.length + virtualizedRows.length + index,
            'bottom',
            bottomRowSpanMap,
            index,
          ),
        )}
    </tbody>
  )
}

// ---------------------------------------------------------------------------
// TableRow — wrapped in React.memo with custom comparison
// ---------------------------------------------------------------------------

interface TableRowProps<TData extends RowData> {
  row: Row<TData>
  table: Table<TData>
  rowIndex: number
  rowSpanRowIndex: number
  rowSpanMap?: RowSpanMap
  visibleRowSpanIndexes?: Set<number>
  visibleColumns: Column<TData, unknown>[]
  isSelected: boolean
  isExpanded: boolean
  isRowEditing: boolean
  activeColumnId?: string
  focusedColumnIndex: number | null
  hasFocusedCell: boolean
  cellSelectionKey: string
  pendingValuesKey: string
  clickable?: boolean
  pinnedPosition?: 'top' | 'bottom'
  virtualStyle?: React.CSSProperties
  onFillHandleMouseDown?: (rowIndex: number, columnIndex: number, e: React.MouseEvent) => void
}

function TableRowInner<TData extends RowData>({
  row,
  table,
  rowIndex,
  rowSpanRowIndex,
  rowSpanMap,
  visibleRowSpanIndexes,
  visibleColumns,
  isSelected,
  isExpanded,
  isRowEditing,
  activeColumnId,
  focusedColumnIndex,
  hasFocusedCell,
  cellSelectionKey: _cellSelectionKey,
  pendingValuesKey: _pendingValuesKey,
  clickable,
  pinnedPosition,
  virtualStyle,
  onFillHandleMouseDown,
}: TableRowProps<TData>) {
  const allCells = row.getAllCells()
  const visibleCells = visibleColumns
    .map((column) => allCells.find((cell) => cell.column.id === column.id))
    .filter((cell): cell is NonNullable<typeof cell> => cell != null)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        table.options.enableRowClickSelection &&
        row.getCanSelect() &&
        !isInteractiveClickTarget(e.target)
      ) {
        row.toggleSelected()
      }

      if (clickable) {
        table.events.emit('row:click', {
          row,
          event: e.nativeEvent,
        } as any)
      }
    },
    [clickable, table, row],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      table.events.emit('row:dblclick', {
        row,
        event: e.nativeEvent,
      } as any)
    },
    [table.events, row],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      table.events.emit('row:contextmenu', {
        row,
        event: e.nativeEvent,
      } as any)
    },
    [table.events, row],
  )

  const selectionEnabled = Boolean(table.options.enableRowSelection)
  const expansionEnabled = Boolean(table.options.enableExpanding)
  const rowClassNameDef = table.options.rowClassName
  const userRowClassName =
    typeof rowClassNameDef === 'function' ? rowClassNameDef(row) : rowClassNameDef
  const rowStyleDef = table.options.rowStyle
  const userRowStyle = typeof rowStyleDef === 'function' ? rowStyleDef(row) : rowStyleDef
  const mergedRowStyle = userRowStyle ? { ...virtualStyle, ...userRowStyle } : virtualStyle
  const rowClassName = [
    'yable-tr',
    pinnedPosition && `yable-tr--pinned-${pinnedPosition}`,
    isRowEditing && 'yable-tr--row-editing',
    userRowClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <tr
        className={rowClassName}
        style={mergedRowStyle}
        data-selected={isSelected || undefined}
        data-expanded={isExpanded || undefined}
        data-row-editing={isRowEditing || undefined}
        data-clickable={clickable || undefined}
        data-pinned-row={pinnedPosition}
        data-row-id={row.id}
        data-row-index={rowIndex}
        aria-selected={selectionEnabled ? isSelected : undefined}
        aria-expanded={expansionEnabled ? isExpanded : undefined}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {visibleCells.map((cell, columnIndex) => {
          const rowSpan = resolveRenderedRowSpan(
            rowSpanMap,
            rowSpanRowIndex,
            cell.column.id,
            visibleRowSpanIndexes,
          )
          if (rowSpan === 0) return null

          const isFocused = focusedColumnIndex === columnIndex
          const isTabStop = isFocused || (!hasFocusedCell && rowIndex === 0 && columnIndex === 0)

          return (
            <CellErrorBoundary
              key={cell.id}
              resetKeys={[cell.getValue(), activeColumnId === cell.column.id, isFocused]}
            >
              <TableCell
                cell={cell}
                table={table}
                rowIndex={rowIndex}
                columnIndex={columnIndex}
                isFocused={isFocused}
                isTabStop={isTabStop}
                rowSpan={rowSpan}
                onFillHandleMouseDown={onFillHandleMouseDown}
              />
            </CellErrorBoundary>
          )
        })}
      </tr>

      {isExpanded && <MasterDetail row={row} table={table} colSpan={visibleColumns.length} />}
    </>
  )
}

// Custom comparison for React.memo: only re-render when meaningful props change.
// We compare by reference for data, and by value for boolean/selection/editing state.
function areRowPropsEqual<TData extends RowData>(
  prev: TableRowProps<TData>,
  next: TableRowProps<TData>,
): boolean {
  // Different row identity
  if (prev.row.id !== next.row.id) return false

  // Current row-model position changed
  if (prev.rowIndex !== next.rowIndex) return false
  if (prev.rowSpanRowIndex !== next.rowSpanRowIndex) return false
  if (prev.rowSpanMap !== next.rowSpanMap) return false
  if (prev.visibleRowSpanIndexes !== next.visibleRowSpanIndexes) return false

  // Visible columns or ordering changed
  if (prev.visibleColumns !== next.visibleColumns) return false

  // Data reference changed — re-render
  if (prev.row.original !== next.row.original) return false

  // Selection state
  if (prev.isSelected !== next.isSelected) return false

  // Expansion state
  if (prev.isExpanded !== next.isExpanded) return false

  // Full-row editing state
  if (prev.isRowEditing !== next.isRowEditing) return false

  // Clickable prop
  if (prev.clickable !== next.clickable) return false

  // Row-pinning position
  if (prev.pinnedPosition !== next.pinnedPosition) return false

  // Focus / edit state for this row
  if (prev.activeColumnId !== next.activeColumnId) return false
  if (prev.focusedColumnIndex !== next.focusedColumnIndex) return false
  if (prev.hasFocusedCell !== next.hasFocusedCell) return false
  if (prev.cellSelectionKey !== next.cellSelectionKey) return false
  if (prev.pendingValuesKey !== next.pendingValuesKey) return false

  // Virtual positioning
  if (prev.virtualStyle !== next.virtualStyle) {
    // For virtual rows, compare actual transform values
    if (!prev.virtualStyle || !next.virtualStyle) return false
    if (prev.virtualStyle.transform !== next.virtualStyle.transform) return false
    if (prev.virtualStyle.height !== next.virtualStyle.height) return false
  }

  // Table reference changed (e.g., options update)
  if (prev.table !== next.table) return false

  return true
}

const MemoizedTableRow = React.memo(TableRowInner, areRowPropsEqual) as typeof TableRowInner

function resolveRenderedRowSpan(
  rowSpanMap: RowSpanMap | undefined,
  rowIndex: number,
  columnId: string,
  visibleRowIndexes?: Set<number>,
): number | undefined {
  if (!rowSpanMap) return undefined

  const span = getRowSpan(rowSpanMap, rowIndex, columnId)
  if (span === undefined) return undefined

  if (span > 1) {
    if (!visibleRowIndexes) return span

    const mountedSpan = getMountedRowSpan(rowIndex, span, visibleRowIndexes)
    return mountedSpan > 1 ? mountedSpan : undefined
  }

  if (span === 0) {
    if (!visibleRowIndexes) return 0

    const origin = findRowSpanOrigin(rowSpanMap, rowIndex, columnId)
    if (!origin || !visibleRowIndexes.has(origin.rowIndex)) return undefined

    const mountedSpan = getMountedRowSpan(origin.rowIndex, origin.span, visibleRowIndexes)
    return rowIndex < origin.rowIndex + mountedSpan ? 0 : undefined
  }

  return undefined
}

function findRowSpanOrigin(
  rowSpanMap: RowSpanMap,
  rowIndex: number,
  columnId: string,
): { rowIndex: number; span: number } | undefined {
  for (let candidate = rowIndex - 1; candidate >= 0; candidate--) {
    const span = getRowSpan(rowSpanMap, candidate, columnId)
    if (span && span > 1 && candidate + span > rowIndex) {
      return { rowIndex: candidate, span }
    }
  }

  return undefined
}

function getMountedRowSpan(rowIndex: number, span: number, visibleRowIndexes: Set<number>): number {
  let mountedSpan = 0

  for (let offset = 0; offset < span; offset++) {
    if (!visibleRowIndexes.has(rowIndex + offset)) break
    mountedSpan++
  }

  return mountedSpan
}

function getRowsById<TData extends RowData>(
  rowIds: string[],
  rowsById: Record<string, Row<TData>>,
): Row<TData>[] {
  return rowIds
    .map((id) => rowsById[id])
    .filter((row: Row<TData> | undefined): row is Row<TData> => row !== undefined)
}

function getUnpinnedRows<TData extends RowData>(
  rows: Row<TData>[],
  pinnedTopRowIds: string[],
  pinnedBottomRowIds: string[],
): Row<TData>[] {
  const pinned = new Set([...pinnedTopRowIds, ...pinnedBottomRowIds])
  return rows.filter((row) => !pinned.has(row.id))
}

function getPendingValuesKey(values: Record<string, unknown> | undefined): string {
  if (!values) return ''
  return Object.keys(values)
    .sort()
    .map((key) => `${key}:${String(values[key])}`)
    .join('|')
}

function isInteractiveClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('input, textarea, select, button, a[href], [contenteditable="true"]'),
  )
}
