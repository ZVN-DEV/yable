// @yable/react — Table Header Component

import React, { useCallback, useMemo, useRef, useState } from 'react'
import type {
  RowData,
  Table,
  Header as HeaderType,
  ColumnOrderState,
} from '@yable/core'
import { SortIndicator } from './SortIndicator'

interface TableHeaderProps<TData extends RowData> {
  table: Table<TData>
}

const DRAG_MIME = 'application/yable-column'

export function TableHeader<TData extends RowData>({
  table,
}: TableHeaderProps<TData>) {
  const headerGroups = table.getHeaderGroups()

  return (
    <thead className="yable-thead">
      {headerGroups.map((headerGroup) => (
        <tr key={headerGroup.id} className="yable-header-row">
          {headerGroup.headers.map((header) => (
            <HeaderCell key={header.id} header={header} table={table} />
          ))}
        </tr>
      ))}
    </thead>
  )
}

function HeaderCell<TData extends RowData>({
  header,
  table,
}: {
  header: HeaderType<TData, unknown>
  table: Table<TData>
}) {
  const column = header.column
  const canSort = column.getCanSort()
  const sortDirection = column.getIsSorted()
  const sortIndex = column.getSortIndex()
  const canResize = column.getCanResize()
  const canReorder = column.getCanReorder() && !header.isPlaceholder

  const headerContent =
    header.isPlaceholder
      ? null
      : typeof column.columnDef.header === 'function'
        ? (column.columnDef.header as Function)(header.getContext())
        : column.columnDef.header ?? header.id

  const style = useMemo((): React.CSSProperties => {
    const s: React.CSSProperties = {
      width: header.getSize(),
      minWidth: column.columnDef.minSize,
      maxWidth: column.columnDef.maxSize,
    }

    const pinned = column.getIsPinned()
    if (pinned) {
      s.position = 'sticky'
      if (pinned === 'left') {
        s.left = header.getStart('left')
      } else {
        s.right = header.getStart('right')
      }
    }

    return s
  }, [header, column])

  const pinned = column.getIsPinned()

  // ── Resize ─────────────────────────────────────────────────────────────
  // The browser dispatches `click` on the lowest common ancestor of the
  // mousedown/mouseup targets. When the user starts a resize on the handle
  // and releases the mouse anywhere inside the th (which is common during a
  // drag), the click event fires on the <th> itself and the th's onClick
  // would otherwise toggle sorting. We track the time the resize gesture
  // ended and ignore the next click if it lands within a short window.
  const lastResizeEndRef = useRef(0)

  const startResize = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Don't let the th's mousedown/click see the resize gesture.
      e.stopPropagation()

      // Stamp the end time so the upcoming synthetic click can be suppressed.
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
    [header]
  )

  const handleResizeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // ── Reorder (HTML5 drag) ───────────────────────────────────────────────
  const [dragOver, setDragOver] = useState<'left' | 'right' | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLTableCellElement>) => {
      if (!canReorder) return
      // If the gesture started inside the resize handle, cancel — that's a
      // resize, not a reorder.
      const target = e.target as Element | null
      if (target && target.closest('.yable-resize-handle')) {
        e.preventDefault()
        return
      }
      e.stopPropagation()
      e.dataTransfer.effectAllowed = 'move'
      try {
        e.dataTransfer.setData(DRAG_MIME, column.id)
        // text/plain fallback for browsers that whine about empty payloads
        e.dataTransfer.setData('text/plain', column.id)
      } catch {
        /* dataTransfer can throw in older browsers — ignore */
      }
    },
    [canReorder, column.id]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLTableCellElement>) => {
      if (!canReorder) return
      // Only react to a yable column drag — anything else passes through.
      // `types` is `readonly string[]` in modern DOM lib, but legacy browsers
      // expose a DOMStringList with the same iteration semantics.
      const types = e.dataTransfer.types as unknown as ArrayLike<string>
      let isYableDrag = false
      for (let i = 0; i < types.length; i++) {
        if (types[i] === DRAG_MIME) {
          isYableDrag = true
          break
        }
      }
      if (!isYableDrag) return

      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const rect = e.currentTarget.getBoundingClientRect()
      const midpoint = rect.left + rect.width / 2
      setDragOver(e.clientX < midpoint ? 'left' : 'right')
    },
    [canReorder]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLTableCellElement>) => {
      // Only clear if leaving the th itself, not just moving over a child.
      const next = e.relatedTarget as Node | null
      if (next && e.currentTarget.contains(next)) return
      setDragOver(null)
    },
    []
  )

  const handleDragEnd = useCallback(() => {
    setDragOver(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLTableCellElement>) => {
      if (!canReorder) return
      e.preventDefault()
      e.stopPropagation()
      const sourceId = e.dataTransfer.getData(DRAG_MIME)
      // Read the half from the drop event itself — `dragOver` state is
      // captured at render time and may be stale within a single task.
      const rect = e.currentTarget.getBoundingClientRect()
      const insertAfter = e.clientX >= rect.left + rect.width / 2
      setDragOver(null)

      if (!sourceId || sourceId === column.id) return

      // Build the active column order. State may be empty if the user has
      // never reordered before — fall back to the visible leaf order.
      const state = table.getState()
      const allLeafs = table.getAllLeafColumns()
      const baseOrder: ColumnOrderState =
        state.columnOrder && state.columnOrder.length > 0
          ? state.columnOrder
          : allLeafs.map((c) => c.id)

      // Some leaf columns may be missing from the persisted order if it was
      // saved before they existed — splice in any unknowns at their natural
      // position so we never silently drop a column.
      const next: string[] = []
      const seen = new Set<string>()
      for (const id of baseOrder) {
        if (allLeafs.some((c) => c.id === id)) {
          next.push(id)
          seen.add(id)
        }
      }
      for (const c of allLeafs) {
        if (!seen.has(c.id)) {
          next.push(c.id)
          seen.add(c.id)
        }
      }

      const fromIdx = next.indexOf(sourceId)
      if (fromIdx === -1) return
      next.splice(fromIdx, 1)

      let toIdx = next.indexOf(column.id)
      if (toIdx === -1) return
      if (insertAfter) toIdx += 1
      next.splice(toIdx, 0, sourceId)

      table.setColumnOrder(next)
    },
    [canReorder, column.id, table]
  )

  // ── Click → sort, but suppress if it's the tail end of a resize ────────
  const handleHeaderClick = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement>) => {
      if (!canSort) return
      // Suppress the synthetic click that follows a resize-drag-release.
      if (Date.now() - lastResizeEndRef.current < 250) return
      const handler = column.getToggleSortingHandler()
      if (handler) handler(e)
    },
    [canSort, column]
  )

  return (
    <th
      className="yable-th"
      style={style}
      data-sortable={canSort || undefined}
      data-pinned={pinned || undefined}
      data-reorderable={canReorder || undefined}
      data-drag-over={dragOver || undefined}
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
      draggable={canReorder || undefined}
      onClick={handleHeaderClick}
      onDragStart={canReorder ? handleDragStart : undefined}
      onDragOver={canReorder ? handleDragOver : undefined}
      onDragLeave={canReorder ? handleDragLeave : undefined}
      onDragEnd={canReorder ? handleDragEnd : undefined}
      onDrop={canReorder ? handleDrop : undefined}
    >
      <div className="yable-th-content">
        <span>{headerContent}</span>
        {canSort && (
          <SortIndicator
            direction={sortDirection}
            index={sortIndex > 0 ? sortIndex : undefined}
          />
        )}
      </div>

      {canResize && (
        <div
          className="yable-resize-handle"
          data-resizing={column.getIsResizing() || undefined}
          onMouseDown={startResize}
          onTouchStart={startResize}
          onClick={handleResizeClick}
          // Resize handle should never start an HTML5 drag of the th.
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      )}
    </th>
  )
}
