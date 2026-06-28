// @zvndev/yable-react — Table Body Component

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Column, RowData, Table, Row } from '@zvndev/yable-core'
import { TableCell } from './TableCell'
import { CellErrorBoundary } from './ErrorBoundary'
import { MasterDetail } from './MasterDetail'
import { useVirtualization } from '../hooks/useVirtualization'

interface TableBodyProps<TData extends RowData> {
  table: Table<TData>
  clickableRows?: boolean
  colgroup?: React.ReactNode
}

export function TableBody<TData extends RowData>({
  table,
  clickableRows,
  colgroup,
}: TableBodyProps<TData>) {
  const rows = table.getRowModel().rows
  const visibleColumns = table.getVisibleLeafColumns()
  const activeCell = table.getState().editing.activeCell
  const focusedCell = table.getFocusedCell()
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

  const { virtualRows, totalHeight } = useVirtualization({
    containerRef: scrollContainerRef,
    totalRows: rows.length,
    rowHeight,
    overscan,
    estimateRowHeight,
    pretextHeights,
    pretextPrefixSums,
    columnSizingHash,
  })

  const cellSelectionKey = cellSelection.range
    ? `${cellSelection.range.start.rowIndex}:${cellSelection.range.start.columnIndex}:${cellSelection.range.end.rowIndex}:${cellSelection.range.end.columnIndex}:${cellSelection.isDragging ? 'dragging' : 'idle'}`
    : `none:${cellSelection.isDragging ? 'dragging' : 'idle'}`

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

  const renderRow = (row: Row<TData>, rowIndex: number, pinnedPosition?: 'top' | 'bottom') => (
    <MemoizedTableRow
      key={row.id}
      row={row}
      table={table}
      rowIndex={rowIndex}
      visibleColumns={visibleColumns}
      isSelected={row.getIsSelected()}
      isExpanded={row.getIsExpanded()}
      activeColumnId={activeCell?.rowId === row.id ? activeCell.columnId : undefined}
      focusedColumnIndex={focusedCell?.rowIndex === rowIndex ? focusedCell.columnIndex : null}
      hasFocusedCell={focusedCell !== null}
      cellSelectionKey={cellSelectionKey}
      pendingValuesKey={getPendingValuesKey(pendingValues[row.id])}
      clickable={clickableRows}
      pinnedPosition={pinnedPosition}
    />
  )

  if (!enableVirtualization) {
    // When no rows are pinned, getCenterRows() === the full row set, so we keep
    // the original full-row render to guarantee identical output. Only split
    // into top/center/bottom sections once row pinning is actually in use.
    const rowPinning = table.getState().rowPinning
    const hasPinnedRows = (rowPinning.top?.length ?? 0) > 0 || (rowPinning.bottom?.length ?? 0) > 0

    if (hasPinnedRows) {
      const topRows = table.getTopRows()
      const centerRows = table.getCenterRows()
      const bottomRows = table.getBottomRows()
      let visualIndex = 0
      return (
        <tbody className="yable-tbody">
          {topRows.map((row) => renderRow(row, visualIndex++, 'top'))}
          {centerRows.map((row) => renderRow(row, visualIndex++))}
          {bottomRows.map((row) => renderRow(row, visualIndex++, 'bottom'))}
        </tbody>
      )
    }

    // Non-virtualized: render all rows directly
    return (
      <tbody className="yable-tbody">{rows.map((row, rowIndex) => renderRow(row, rowIndex))}</tbody>
    )
  }

  // Virtualized rendering
  const hasPretextData = !!(pretextHeights && pretextPrefixSums)
  const fixedRowHeight = typeof rowHeight === 'number' && !hasPretextData ? rowHeight : undefined
  const containerHeight = hasPretextData
    ? Math.min(totalHeight, 800) // Pretext: use real total, cap at 800px viewport
    : fixedRowHeight
      ? Math.min(totalHeight, fixedRowHeight * 20) // Default visible area ~20 rows
      : 600 // Fallback for variable heights

  return (
    <tbody className="yable-tbody">
      <tr style={{ height: 0, padding: 0, border: 'none' }}>
        <td style={{ height: 0, padding: 0, border: 'none' }} colSpan={visibleColumns.length}>
          <div
            ref={scrollContainerRef}
            className="yable-virtual-scroll-container"
            style={{
              overflowY: 'auto',
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
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                }}
              >
                {colgroup}
                <tbody>
                  {virtualRows.map((vRow) => {
                    const row = rows[vRow.index]
                    if (!row) return null
                    return (
                      <MemoizedTableRow
                        key={row.id}
                        row={row}
                        table={table}
                        rowIndex={vRow.index}
                        visibleColumns={visibleColumns}
                        isSelected={row.getIsSelected()}
                        isExpanded={row.getIsExpanded()}
                        activeColumnId={
                          activeCell?.rowId === row.id ? activeCell.columnId : undefined
                        }
                        focusedColumnIndex={
                          focusedCell?.rowIndex === vRow.index ? focusedCell.columnIndex : null
                        }
                        hasFocusedCell={focusedCell !== null}
                        cellSelectionKey={cellSelectionKey}
                        pendingValuesKey={getPendingValuesKey(pendingValues[row.id])}
                        clickable={clickableRows}
                        virtualStyle={{
                          position: 'absolute' as const,
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: vRow.size,
                          transform: `translateY(${vRow.start}px)`,
                        }}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </td>
      </tr>
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
  visibleColumns: Column<TData, unknown>[]
  isSelected: boolean
  isExpanded: boolean
  activeColumnId?: string
  focusedColumnIndex: number | null
  hasFocusedCell: boolean
  cellSelectionKey: string
  pendingValuesKey: string
  clickable?: boolean
  pinnedPosition?: 'top' | 'bottom'
  virtualStyle?: React.CSSProperties
}

function TableRowInner<TData extends RowData>({
  row,
  table,
  rowIndex,
  visibleColumns,
  isSelected,
  isExpanded,
  activeColumnId,
  focusedColumnIndex,
  hasFocusedCell,
  cellSelectionKey: _cellSelectionKey,
  pendingValuesKey: _pendingValuesKey,
  clickable,
  pinnedPosition,
  virtualStyle,
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

  // Visible columns or ordering changed
  if (prev.visibleColumns !== next.visibleColumns) return false

  // Data reference changed — re-render
  if (prev.row.original !== next.row.original) return false

  // Selection state
  if (prev.isSelected !== next.isSelected) return false

  // Expansion state
  if (prev.isExpanded !== next.isExpanded) return false

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
