// @yable/react — Table Body Component

import React, { useCallback, useRef } from 'react'
import type { Column, RowData, Table, Row } from '@yable/core'
import { TableCell } from './TableCell'
import { CellErrorBoundary } from './ErrorBoundary'
import { useVirtualization } from '../hooks/useVirtualization'

interface TableBodyProps<TData extends RowData> {
  table: Table<TData>
  clickableRows?: boolean
}

export function TableBody<TData extends RowData>({
  table,
  clickableRows,
}: TableBodyProps<TData>) {
  const rows = table.getRowModel().rows
  const visibleColumns = table.getVisibleLeafColumns()
  const activeCell = table.getState().editing.activeCell
  const focusedCell = table.getFocusedCell()
  const options = table.options
  const enableVirtualization = options.enableVirtualization ?? false
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const rowHeight = options.rowHeight ?? 40
  const overscan = options.overscan ?? 5
  const estimateRowHeight = options.estimateRowHeight
  const pretextHeights = options.pretextHeights ?? null
  const pretextPrefixSums = options.pretextPrefixSums ?? null

  const { virtualRows, totalHeight } = useVirtualization({
    containerRef: scrollContainerRef,
    totalRows: rows.length,
    rowHeight,
    overscan,
    estimateRowHeight,
    pretextHeights,
    pretextPrefixSums,
  })

  if (!enableVirtualization) {
    // Non-virtualized: render all rows directly
    return (
      <tbody className="yable-tbody">
        {rows.map((row, rowIndex) => (
          <MemoizedTableRow
            key={row.id}
            row={row}
            table={table}
            rowIndex={rowIndex}
            visibleColumns={visibleColumns}
            isSelected={row.getIsSelected()}
            isExpanded={row.getIsExpanded()}
            activeColumnId={activeCell?.rowId === row.id ? activeCell.columnId : undefined}
            focusedColumnIndex={
              focusedCell?.rowIndex === rowIndex ? focusedCell.columnIndex : null
            }
            hasFocusedCell={focusedCell !== null}
            clickable={clickableRows}
          />
        ))}
      </tbody>
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
        <td
          style={{ height: 0, padding: 0, border: 'none' }}
          colSpan={visibleColumns.length}
        >
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
                          focusedCell?.rowIndex === vRow.index
                            ? focusedCell.columnIndex
                            : null
                        }
                        hasFocusedCell={focusedCell !== null}
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
  clickable?: boolean
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
  clickable,
  virtualStyle,
}: TableRowProps<TData>) {
  const visibleCells = row.getVisibleCells()

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (clickable) {
        table.events.emit('row:click', {
          row,
          event: e.nativeEvent,
        } as any)
      }
    },
    [clickable, table.events, row]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      table.events.emit('row:dblclick', {
        row,
        event: e.nativeEvent,
      } as any)
    },
    [table.events, row]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      table.events.emit('row:contextmenu', {
        row,
        event: e.nativeEvent,
      } as any)
    },
    [table.events, row]
  )

  return (
    <>
      <tr
        className="yable-tr"
        style={virtualStyle}
        data-selected={isSelected || undefined}
        data-expanded={isExpanded || undefined}
        data-clickable={clickable || undefined}
        data-row-id={row.id}
        data-row-index={rowIndex}
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

      {isExpanded && (
        <tr className="yable-expand-row">
          <td className="yable-td" colSpan={visibleColumns.length}>
            {typeof (row as any)._renderExpanded === 'function'
              ? (row as any)._renderExpanded()
              : null}
          </td>
        </tr>
      )}
    </>
  )
}

// Custom comparison for React.memo: only re-render when meaningful props change.
// We compare by reference for data, and by value for boolean/selection/editing state.
function areRowPropsEqual<TData extends RowData>(
  prev: TableRowProps<TData>,
  next: TableRowProps<TData>
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

  // Focus / edit state for this row
  if (prev.activeColumnId !== next.activeColumnId) return false
  if (prev.focusedColumnIndex !== next.focusedColumnIndex) return false
  if (prev.hasFocusedCell !== next.hasFocusedCell) return false

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
