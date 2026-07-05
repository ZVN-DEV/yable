import {
  canCellEnterEditMode,
  type Cell,
  type Column,
  type Row,
  type RowData,
  type Table,
} from '@zvndev/yable-core'
import type { ReactNode } from 'react'
import type { AdaptiveTableLayoutOptions } from '../types'
import { CellErrorBoundary } from './ErrorBoundary'
import { CellStatusBadge } from './CellStatusBadge'
import { renderCellContent } from './renderCellContent'

interface AdaptiveTableCardsProps<TData extends RowData> {
  table: Table<TData>
  layout: RequiredAdaptiveLayout<TData>
  clickableRows?: boolean
}

export interface RequiredAdaptiveLayout<TData extends RowData> extends Required<
  Pick<AdaptiveTableLayoutOptions<TData>, 'mode' | 'breakpoint' | 'maxSecondaryColumns'>
> {
  primaryColumnId?: string
  secondaryColumnIds?: string[]
  hiddenColumnIds?: string[]
  renderCard?: AdaptiveTableLayoutOptions<TData>['renderCard']
}

export function AdaptiveTableCards<TData extends RowData>({
  table,
  layout,
  clickableRows,
}: AdaptiveTableCardsProps<TData>) {
  const rows = table.getRowModel().rows
  const visibleColumns = table.getVisibleLeafColumns()

  return (
    <div className="yable-adaptive-cards" role="rowgroup">
      {rows.map((row, rowIndex) => (
        <AdaptiveTableCard
          key={row.id}
          row={row}
          table={table}
          rowIndex={rowIndex}
          visibleColumns={visibleColumns}
          layout={layout}
          clickable={clickableRows}
        />
      ))}
    </div>
  )
}

interface AdaptiveTableCardProps<TData extends RowData> {
  row: Row<TData>
  table: Table<TData>
  rowIndex: number
  visibleColumns: Column<TData, unknown>[]
  layout: RequiredAdaptiveLayout<TData>
  clickable?: boolean
}

function AdaptiveTableCard<TData extends RowData>({
  row,
  table,
  rowIndex,
  visibleColumns,
  layout,
  clickable,
}: AdaptiveTableCardProps<TData>) {
  const { cells, primaryCell, secondaryCells } = getAdaptiveCells(row, visibleColumns, layout)
  const detailPanel = getAdaptiveDetailPanel(row, table)

  return (
    <article
      className="yable-adaptive-card"
      role="row"
      data-selected={row.getIsSelected() || undefined}
      data-expanded={row.getIsExpanded() || undefined}
      data-clickable={clickable || undefined}
      data-row-id={row.id}
      data-row-index={rowIndex}
      aria-selected={table.options.enableRowSelection ? row.getIsSelected() : undefined}
      onClick={(e) => {
        if (
          table.options.enableRowClickSelection &&
          row.getCanSelect() &&
          !isInteractiveClickTarget(e.target)
        ) {
          row.toggleSelected()
        }
        if (clickable) emitRowEvent(table, 'row:click', row, e.nativeEvent)
      }}
      onDoubleClick={(e) => emitRowEvent(table, 'row:dblclick', row, e.nativeEvent)}
      onContextMenu={(e) => emitRowEvent(table, 'row:contextmenu', row, e.nativeEvent)}
    >
      {layout.renderCard ? (
        layout.renderCard({
          table,
          row,
          rowIndex,
          cells,
          primaryCell,
          secondaryCells,
          visibleColumns,
        })
      ) : (
        <>
          {primaryCell && (
            <div className="yable-adaptive-card-header">
              <div className="yable-adaptive-card-title">
                <AdaptiveTableCardCell
                  cell={primaryCell}
                  table={table}
                  rowIndex={rowIndex}
                  columnIndex={0}
                  primary
                />
              </div>
            </div>
          )}

          {secondaryCells.length > 0 && (
            <div className="yable-adaptive-card-fields">
              {secondaryCells.map((cell, index) => (
                <AdaptiveTableCardCell
                  key={cell.id}
                  cell={cell}
                  table={table}
                  rowIndex={rowIndex}
                  columnIndex={index + 1}
                />
              ))}
            </div>
          )}
        </>
      )}

      {detailPanel}
    </article>
  )
}

function getAdaptiveDetailPanel<TData extends RowData>(
  row: Row<TData>,
  table: Table<TData>,
): ReactNode {
  if (!row.getIsExpanded()) return null

  const renderer = table.options.renderDetailPanel
  if (!renderer) return null

  const content = renderer(row) as ReactNode
  if (content == null) return null

  return (
    <section
      className="yable-adaptive-card-detail"
      data-detail-for={row.id}
      role="region"
      aria-label={`Details for row ${row.id}`}
    >
      <div className="yable-detail-panel">
        <div className="yable-detail-panel-inner">{content}</div>
      </div>
    </section>
  )
}

type RowEventName = 'row:click' | 'row:dblclick' | 'row:contextmenu'
type CellEventName = 'cell:click' | 'cell:dblclick' | 'cell:contextmenu'

function emitRowEvent<TData extends RowData>(
  table: Table<TData>,
  event: RowEventName,
  row: Row<TData>,
  originalEvent: unknown,
) {
  table.events.emit(event, {
    row,
    cells: row.getAllCells(),
    originalEvent,
  })
}

function emitCellEvent<TData extends RowData>(
  table: Table<TData>,
  event: CellEventName,
  cell: Cell<TData, unknown>,
  originalEvent: unknown,
) {
  table.events.emit(event, {
    cell,
    row: cell.row,
    column: cell.column,
    originalEvent,
  })
}

interface AdaptiveTableCardCellProps<TData extends RowData> {
  cell: Cell<TData, unknown>
  table: Table<TData>
  rowIndex: number
  columnIndex: number
  primary?: boolean
}

function AdaptiveTableCardCell<TData extends RowData>({
  cell,
  table,
  rowIndex,
  columnIndex,
  primary,
}: AdaptiveTableCardCellProps<TData>) {
  const column = cell.column
  const isEditing = cell.getIsEditing()
  const isAlwaysEditable = cell.getIsAlwaysEditable()
  const cellStatus = table.getCellStatus(cell.row.id, column.id)
  const cellErrorMessage = table.getCellErrorMessage(cell.row.id, column.id)
  const cellConflictWith = table.getCellConflictWith(cell.row.id, column.id)
  const content = renderCellContent(cell, table)
  const header = column.columnDef.header
  const label = typeof header === 'string' ? header : column.id

  return (
    <CellErrorBoundary resetKeys={[cell.getValue(), cellStatus]}>
      <div
        className={primary ? 'yable-adaptive-card-primary' : 'yable-adaptive-card-cell'}
        data-column-id={column.id}
        data-cell-status={cellStatus !== 'idle' ? cellStatus : undefined}
        data-row-index={rowIndex}
        data-column-index={columnIndex}
        role="gridcell"
        aria-colindex={columnIndex + 1}
        onClick={(e) => {
          if (cell.row.getIsGrouped()) return
          emitCellEvent(table, 'cell:click', cell, e.nativeEvent)

          if (
            canCellEnterEditMode(table, cell.row, column) &&
            !isAlwaysEditable &&
            !isEditing &&
            !e.shiftKey &&
            !e.metaKey &&
            !e.ctrlKey
          ) {
            table.startEditing(cell.row.id, column.id)
          }
        }}
        onDoubleClick={(e) => emitCellEvent(table, 'cell:dblclick', cell, e.nativeEvent)}
        onContextMenu={(e) => emitCellEvent(table, 'cell:contextmenu', cell, e.nativeEvent)}
      >
        {!primary && <span className="yable-adaptive-card-label">{label}</span>}
        <span className="yable-adaptive-card-value">
          {content}
          {cellStatus === 'error' && (
            <CellStatusBadge
              status="error"
              message={cellErrorMessage}
              onRetry={() => void table.retryCommit(cell.row.id, column.id)}
              onDismiss={() => table.dismissCommit(cell.row.id, column.id)}
            />
          )}
          {cellStatus === 'conflict' && (
            <CellStatusBadge
              status="conflict"
              conflictWith={cellConflictWith}
              onRetry={() => void table.retryCommit(cell.row.id, column.id)}
              onDismiss={() => table.dismissCommit(cell.row.id, column.id)}
            />
          )}
        </span>
      </div>
    </CellErrorBoundary>
  )
}

function getAdaptiveCells<TData extends RowData>(
  row: Row<TData>,
  visibleColumns: Column<TData, unknown>[],
  layout: RequiredAdaptiveLayout<TData>,
) {
  const hidden = new Set(layout.hiddenColumnIds ?? [])
  const allCellsByColumn = new Map(row.getAllCells().map((cell) => [cell.column.id, cell]))
  const visibleCells: Cell<TData, unknown>[] = []

  for (const column of visibleColumns) {
    if (hidden.has(column.id)) continue
    const cell = allCellsByColumn.get(column.id)
    if (cell) visibleCells.push(cell)
  }

  const cellsByColumn = new Map(visibleCells.map((cell) => [cell.column.id, cell]))
  const primaryCell =
    (layout.primaryColumnId ? cellsByColumn.get(layout.primaryColumnId) : undefined) ??
    visibleCells[0]
  const primaryColumnId = primaryCell?.column.id
  let secondaryCells: Cell<TData, unknown>[]

  if (layout.secondaryColumnIds) {
    secondaryCells = []
    for (const columnId of layout.secondaryColumnIds) {
      if (hidden.has(columnId) || columnId === primaryColumnId) continue
      const cell = cellsByColumn.get(columnId)
      if (cell) secondaryCells.push(cell)
    }
  } else {
    secondaryCells = visibleCells.filter((cell) => cell.column.id !== primaryColumnId)
    if (secondaryCells.length > layout.maxSecondaryColumns) {
      secondaryCells = secondaryCells.slice(0, layout.maxSecondaryColumns)
    }
  }

  return {
    cells: visibleCells,
    primaryCell,
    secondaryCells,
  }
}

function isInteractiveClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('input, textarea, select, button, a[href], [contenteditable="true"]'),
  )
}
