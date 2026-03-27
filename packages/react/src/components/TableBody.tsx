// @yable/react — Table Body Component

import React, { useCallback, useRef } from 'react'
import type { RowData, Table, Row } from '@yable/core'
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
  const options = table.options
  const enableVirtualization = options.enableVirtualization ?? false
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const rowHeight = options.rowHeight ?? 40
  const overscan = options.overscan ?? 5
  const estimateRowHeight = options.estimateRowHeight

  const { virtualRows, totalHeight } = useVirtualization({
    containerRef: scrollContainerRef,
    totalRows: rows.length,
    rowHeight,
    overscan,
    estimateRowHeight,
  })

  if (!enableVirtualization) {
    // Non-virtualized: render all rows directly
    return (
      <tbody className="yable-tbody">
        {rows.map((row) => (
          <MemoizedTableRow
            key={row.id}
            row={row}
            table={table}
            clickable={clickableRows}
          />
        ))}
      </tbody>
    )
  }

  // Virtualized rendering
  const fixedRowHeight = typeof rowHeight === 'number' ? rowHeight : undefined
  const containerHeight = fixedRowHeight
    ? Math.min(totalHeight, fixedRowHeight * 20) // Default visible area ~20 rows
    : 600 // Fallback for variable heights

  return (
    <tbody className="yable-tbody">
      <tr style={{ height: 0, padding: 0, border: 'none' }}>
        <td
          style={{ height: 0, padding: 0, border: 'none' }}
          colSpan={table.getVisibleLeafColumns().length}
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
  clickable?: boolean
  virtualStyle?: React.CSSProperties
}

function TableRowInner<TData extends RowData>({
  row,
  table,
  clickable,
  virtualStyle,
}: TableRowProps<TData>) {
  const isSelected = row.getIsSelected()
  const isExpanded = row.getIsExpanded()
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
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {visibleCells.map((cell) => (
          <CellErrorBoundary
            key={cell.id}
            resetKeys={[cell.getValue(), cell.getIsEditing()]}
          >
            <TableCell cell={cell} table={table} />
          </CellErrorBoundary>
        ))}
      </tr>

      {isExpanded && (
        <tr className="yable-expand-row">
          <td className="yable-td" colSpan={visibleCells.length}>
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

  // Data reference changed — re-render
  if (prev.row.original !== next.row.original) return false

  // Selection state
  if (prev.row.getIsSelected() !== next.row.getIsSelected()) return false

  // Expansion state
  if (prev.row.getIsExpanded() !== next.row.getIsExpanded()) return false

  // Clickable prop
  if (prev.clickable !== next.clickable) return false

  // Virtual positioning
  if (prev.virtualStyle !== next.virtualStyle) {
    // For virtual rows, compare actual transform values
    if (!prev.virtualStyle || !next.virtualStyle) return false
    if (prev.virtualStyle.transform !== next.virtualStyle.transform) return false
    if (prev.virtualStyle.height !== next.virtualStyle.height) return false
  }

  // Check if any cell is in editing state — editing state changes need re-render
  const prevCells = prev.row.getVisibleCells()
  const nextCells = next.row.getVisibleCells()
  if (prevCells.length !== nextCells.length) return false

  for (let i = 0; i < prevCells.length; i++) {
    if (prevCells[i].getIsEditing() !== nextCells[i].getIsEditing()) return false
  }

  // Table reference changed (e.g., options update)
  if (prev.table !== next.table) return false

  return true
}

const MemoizedTableRow = React.memo(TableRowInner, areRowPropsEqual) as typeof TableRowInner
