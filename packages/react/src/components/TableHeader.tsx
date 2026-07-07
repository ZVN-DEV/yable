// @zvndev/yable-react — Table Header Component

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  RowData,
  Table,
  Header as HeaderType,
  Column as ColumnType,
  ColumnOrderState,
  HeaderContext,
  HeaderClickEvent,
} from '@zvndev/yable-core'
import { SortIndicator } from './SortIndicator'
import { FloatingFilter } from './FloatingFilter'

interface TableHeaderProps<TData extends RowData> {
  table: Table<TData>
  floatingFilters?: boolean
}

interface ColumnDragState {
  columnId: string
  fromIndex: number
  /** Insertion index among visible leaf columns (0..n). */
  toIndex: number
  /** Live pointer x in viewport coordinates. */
  pointerX: number
  /** pointerX − draggedColumnLeft at grab time, so the ghost tracks the grab point. */
  grabOffsetX: number
  /** Dragged column width (px) — the distance other columns slide to make room. */
  width: number
  /** Top/height of the header row (viewport coords) for the floating ghost. */
  top: number
  height: number
  /** Snapshot of each visible leaf column's left/width at drag start. */
  layout: { id: string; left: number; width: number }[]
}

const REORDER_TRANSITION = 'transform 180ms cubic-bezier(0.2, 0, 0, 1)'

/**
 * The slide offset (px) for the column at visible index `i` during a reorder:
 * columns between the source and the insertion point shift by ±draggedWidth to
 * open a gap; the source stays put (it rides in the floating ghost).
 */
function transformAt(i: number, d: ColumnDragState): number {
  if (i === d.fromIndex) return 0
  if (d.toIndex > d.fromIndex) return i > d.fromIndex && i < d.toIndex ? -d.width : 0
  return i >= d.toIndex && i < d.fromIndex ? d.width : 0
}

export function TableHeader<TData extends RowData>({
  table,
  floatingFilters = false,
}: TableHeaderProps<TData>) {
  const headerGroups = table.getHeaderGroups()
  const visibleColumns = table.getVisibleLeafColumns()
  const theadRef = useRef<HTMLTableSectionElement>(null)
  // Set on every reorder end; used to suppress the click-to-sort that fires
  // right after a pointer drag releases.
  const reorderEndRef = useRef(0)

  const [drag, setDrag] = useState<ColumnDragState | null>(null)

  const commitReorder = useCallback(
    (d: ColumnDragState) => {
      // No visible movement → nothing to commit.
      if (d.toIndex === d.fromIndex || d.toIndex === d.fromIndex + 1) return

      const order = table.getState().columnOrder
      const base = order && order.length > 0 ? [...order] : d.layout.map((l) => l.id)
      const targetId = d.toIndex < d.layout.length ? d.layout[d.toIndex]!.id : null
      const next = base.filter((id) => id !== d.columnId)
      let insertAt = targetId ? next.indexOf(targetId) : next.length
      if (insertAt === -1) insertAt = next.length
      next.splice(insertAt, 0, d.columnId)
      table.setColumnOrder(next as ColumnOrderState)
    },
    [table],
  )

  const beginReorder = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, columnId: string) => {
      // Left button / primary pointer only.
      if (e.button !== 0) return
      const thead = theadRef.current
      if (!thead) return

      const startX = e.clientX
      const startY = e.clientY

      // Snapshot the leaf-column layout from the live DOM.
      const layout: { id: string; left: number; width: number }[] = []
      let top = 0
      let height = 0
      for (const c of visibleColumns) {
        const th = thead.querySelector<HTMLElement>(`th[data-column-id="${CSS.escape(c.id)}"]`)
        if (!th) return
        const r = th.getBoundingClientRect()
        layout.push({ id: c.id, left: r.left, width: r.width })
        if (c.id === columnId) {
          top = r.top
          height = r.height
        }
      }
      const fromIndex = layout.findIndex((l) => l.id === columnId)
      if (fromIndex < 0) return
      const src = layout[fromIndex]!

      // Body cells slide in lockstep with the header. We drive them imperatively
      // (no per-frame React re-render of the virtualized body); TableCell never
      // sets transform/transition/opacity, so these are safe to add and clear.
      const bodyRoot = thead.closest('table')
      const applyBody = (d: ColumnDragState) => {
        if (!bodyRoot) return
        visibleColumns.forEach((col, i) => {
          if (col.getIsPinned()) return // sticky cells can't be transformed
          const tx = transformAt(i, d)
          bodyRoot
            .querySelectorAll<HTMLElement>(`td[data-column-id="${CSS.escape(col.id)}"]`)
            .forEach((td) => {
              td.style.transition = REORDER_TRANSITION
              td.style.opacity = i === d.fromIndex ? '0' : ''
              td.style.transform = i !== d.fromIndex && tx ? `translateX(${tx}px)` : ''
            })
        })
      }
      const clearBody = () => {
        bodyRoot?.querySelectorAll<HTMLElement>('td[data-column-id]').forEach((td) => {
          td.style.transform = ''
          td.style.transition = ''
          td.style.opacity = ''
        })
      }

      let started = false
      let latest: ColumnDragState = {
        columnId,
        fromIndex,
        toIndex: fromIndex,
        pointerX: startX,
        grabOffsetX: startX - src.left,
        width: src.width,
        top,
        height,
        layout,
      }

      const computeToIndex = (x: number) => {
        let t = layout.findIndex((l) => x < l.left + l.width / 2)
        if (t === -1) t = layout.length
        return t
      }

      const onMove = (ev: PointerEvent) => {
        if (!started) {
          if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) return
          started = true
          table.setColumnDragActive(true)
          document.body.style.userSelect = 'none'
          document.body.style.cursor = 'grabbing'
        }
        latest = { ...latest, pointerX: ev.clientX, toIndex: computeToIndex(ev.clientX) }
        setDrag(latest)
        applyBody(latest)
      }

      const finish = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', finish)
        if (started) {
          commitReorder(latest)
          reorderEndRef.current = Date.now()
          table.setColumnDragActive(false)
          document.body.style.userSelect = ''
          document.body.style.cursor = ''
          clearBody()
        }
        setDrag(null)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', finish)
    },
    [visibleColumns, table, commitReorder],
  )

  const transformFor = useCallback(
    (columnId: string): number => {
      if (!drag) return 0
      const i = visibleColumns.findIndex((c) => c.id === columnId)
      if (i < 0) return 0
      return transformAt(i, drag)
    },
    [drag, visibleColumns],
  )

  const dragColumn = drag ? visibleColumns.find((c) => c.id === drag.columnId) : null

  return (
    <thead className="yable-thead" ref={theadRef}>
      {headerGroups.map((headerGroup) => (
        <tr key={headerGroup.id} className="yable-header-row">
          {headerGroup.headers.map((header) => (
            <HeaderCell
              key={header.id}
              header={header}
              table={table}
              onReorderPointerDown={beginReorder}
              dragTransform={transformFor(header.column.id)}
              isDragSource={drag?.columnId === header.column.id}
              dragActive={drag !== null}
              reorderEndRef={reorderEndRef}
            />
          ))}
        </tr>
      ))}

      {floatingFilters && visibleColumns.length > 0 && (
        <tr className="yable-header-row yable-header-row--filters">
          {visibleColumns.map((column) => (
            <FloatingFilterCell key={`${column.id}-filter`} column={column} />
          ))}
        </tr>
      )}

      {drag &&
        dragColumn &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="yable-col-drag-ghost"
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: drag.top,
              left: drag.pointerX - drag.grabOffsetX,
              width: drag.width,
              height: drag.height,
            }}
          >
            {typeof dragColumn.columnDef.header === 'string'
              ? dragColumn.columnDef.header
              : dragColumn.id}
          </div>,
          document.body,
        )}
    </thead>
  )
}

function FloatingFilterCell<TData extends RowData>({
  column,
}: {
  column: ColumnType<TData, unknown>
}) {
  const style = useMemo((): React.CSSProperties => {
    const next: React.CSSProperties = {
      width: column.getSize(),
      minWidth: column.columnDef.minSize,
      maxWidth: column.columnDef.maxSize,
      padding: 6,
      verticalAlign: 'top',
    }

    const pinned = column.getIsPinned()
    if (pinned) {
      next.position = 'sticky'
      if (pinned === 'left') {
        next.left = column.getStart('left')
      } else {
        next.right = column.getStart('right')
      }
    }

    return next
  }, [column])

  return (
    <th className="yable-th yable-th--filter" role="columnheader" style={style}>
      <FloatingFilter column={column} />
    </th>
  )
}

function HeaderCell<TData extends RowData>({
  header,
  table,
  onReorderPointerDown,
  dragTransform,
  isDragSource,
  dragActive,
  reorderEndRef,
}: {
  header: HeaderType<TData, unknown>
  table: Table<TData>
  onReorderPointerDown: (e: React.PointerEvent<HTMLDivElement>, columnId: string) => void
  dragTransform: number
  isDragSource: boolean
  dragActive: boolean
  reorderEndRef: React.MutableRefObject<number>
}) {
  const column = header.column
  const canSort = column.getCanSort()
  const sortDirection = column.getIsSorted()
  const sortIndex = column.getSortIndex()
  const canResize = column.getCanResize()
  const canReorder = column.getCanReorder() && !header.isPlaceholder
  const pinned = column.getIsPinned()
  type HeaderRenderer = (ctx: HeaderContext<TData, unknown>) => React.ReactNode

  const headerContent = header.isPlaceholder
    ? null
    : typeof column.columnDef.header === 'function'
      ? (column.columnDef.header as HeaderRenderer)(header.getContext())
      : (column.columnDef.header ?? header.id)

  // Mirror TableCell's cellClassName: a column may style its header th with a
  // static class or a function of the header context.
  const headerClassNameDef = column.columnDef.headerClassName
  const userHeaderClassName =
    typeof headerClassNameDef === 'function'
      ? headerClassNameDef(header.getContext())
      : headerClassNameDef
  const thClassName = ['yable-th', userHeaderClassName].filter(Boolean).join(' ')

  const style = useMemo((): React.CSSProperties => {
    const s: React.CSSProperties = {
      width: header.getSize(),
      minWidth: column.columnDef.minSize,
      maxWidth: column.columnDef.maxSize,
    }

    if (pinned) {
      s.position = 'sticky'
      if (pinned === 'left') {
        s.left = header.getStart('left')
      } else {
        s.right = header.getStart('right')
      }
    }

    // Live reorder animation. Pinned columns are excluded (they own `position`).
    // The source slot is held open (styled via [data-drag-source]); its content
    // rides in the floating ghost. Other columns slide to make room (the
    // transition is applied via the [data-reordering] CSS rule).
    if (!pinned && !isDragSource && dragTransform !== 0) {
      s.transform = `translateX(${dragTransform}px)`
    }

    return s
  }, [header, column, pinned, isDragSource, dragTransform])

  const lastResizeEndRef = useRef(0)

  const startResize = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation()

      const onEnd = () => {
        lastResizeEndRef.current = Date.now()
        document.removeEventListener('mouseup', onEnd, true)
        document.removeEventListener('touchend', onEnd, true)
      }
      document.addEventListener('mouseup', onEnd, true)
      document.addEventListener('touchend', onEnd, true)

      const handler = header.getResizeHandler()
      if (handler) (handler as (ev: unknown) => void)(e.nativeEvent)
    },
    [header],
  )

  const handleResizeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleContentPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canReorder || pinned) return
      onReorderPointerDown(e, column.id)
    },
    [canReorder, pinned, onReorderPointerDown, column.id],
  )

  const handleHeaderClick = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement>) => {
      table.events.emit('header:click', {
        column,
        header,
        originalEvent: e,
      } satisfies HeaderClickEvent<TData>)
      if (!canSort) return
      // Swallow the click that ends a resize or a reorder drag.
      if (Date.now() - lastResizeEndRef.current < 250) return
      if (Date.now() - reorderEndRef.current < 250) return
      const handler = column.getToggleSortingHandler()
      if (handler) handler(e)
    },
    [canSort, column, header, table.events, reorderEndRef],
  )

  const handleHeaderContextMenu = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement>) => {
      table.events.emit('header:contextmenu', {
        column,
        header,
        originalEvent: e,
      } satisfies HeaderClickEvent<TData>)
    },
    [column, header, table.events],
  )

  return (
    <th
      className={thClassName}
      style={style}
      data-column-id={column.id}
      data-sortable={canSort || undefined}
      data-pinned={pinned || undefined}
      data-reorderable={(canReorder && !pinned) || undefined}
      data-reordering={(dragActive && !pinned) || undefined}
      data-drag-source={isDragSource || undefined}
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : canSort
              ? 'none'
              : undefined
      }
      role="columnheader"
      colSpan={header.colSpan}
      onClick={handleHeaderClick}
      onContextMenu={handleHeaderContextMenu}
    >
      <div
        className="yable-th-content"
        onPointerDown={canReorder && !pinned ? handleContentPointerDown : undefined}
      >
        <span>{headerContent}</span>
        {canSort && (
          <SortIndicator direction={sortDirection} index={sortIndex > 0 ? sortIndex : undefined} />
        )}
      </div>

      {canResize && (
        <div
          className="yable-resize-handle"
          data-resizing={column.getIsResizing() || undefined}
          onMouseDown={startResize}
          onTouchStart={startResize}
          onClick={handleResizeClick}
        />
      )}
    </th>
  )
}
