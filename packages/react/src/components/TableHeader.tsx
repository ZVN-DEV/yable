// @zvndev/yable-react — Table Header Component

import React, { useCallback, useMemo, useRef, useState } from 'react'
import type {
  RowData,
  Table,
  Header as HeaderType,
  Column as ColumnType,
  ColumnOrderState,
  HeaderContext,
} from '@zvndev/yable-core'
import { SortIndicator } from './SortIndicator'
import { FloatingFilter } from './FloatingFilter'

interface TableHeaderProps<TData extends RowData> {
  table: Table<TData>
  floatingFilters?: boolean
}

const DRAG_MIME = 'application/yable-column'

export function TableHeader<TData extends RowData>({
  table,
  floatingFilters = false,
}: TableHeaderProps<TData>) {
  const headerGroups = table.getHeaderGroups()
  const visibleColumns = table.getVisibleLeafColumns()

  return (
    <thead className="yable-thead">
      {headerGroups.map((headerGroup) => (
        <tr key={headerGroup.id} className="yable-header-row">
          {headerGroup.headers.map((header) => (
            <HeaderCell key={header.id} header={header} table={table} />
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
  type HeaderRenderer = (ctx: HeaderContext<TData, unknown>) => React.ReactNode

  const headerContent = header.isPlaceholder
    ? null
    : typeof column.columnDef.header === 'function'
      ? (column.columnDef.header as HeaderRenderer)(header.getContext())
      : (column.columnDef.header ?? header.id)

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

  const [dragOver, setDragOver] = useState<'left' | 'right' | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!canReorder) return
      e.stopPropagation()
      e.dataTransfer.effectAllowed = 'move'
      try {
        e.dataTransfer.setData(DRAG_MIME, column.id)
        e.dataTransfer.setData('text/plain', column.id)
      } catch {
        // Ignore legacy dataTransfer issues.
      }
      table.setColumnDragActive(true)
    },
    [canReorder, column.id, table],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLTableCellElement>) => {
      if (!canReorder) return
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
    [canReorder],
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLTableCellElement>) => {
    const next = e.relatedTarget as Node | null
    if (next && e.currentTarget.contains(next)) return
    setDragOver(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragOver(null)
    table.setColumnDragActive(false)
  }, [table])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLTableCellElement>) => {
      if (!canReorder) return
      e.preventDefault()
      e.stopPropagation()
      const sourceId = e.dataTransfer.getData(DRAG_MIME)
      const rect = e.currentTarget.getBoundingClientRect()
      const insertAfter = e.clientX >= rect.left + rect.width / 2
      setDragOver(null)
      table.setColumnDragActive(false)

      if (!sourceId || sourceId === column.id) return

      const state = table.getState()
      const allLeafs = table.getAllLeafColumns()
      const baseOrder: ColumnOrderState =
        state.columnOrder && state.columnOrder.length > 0
          ? state.columnOrder
          : allLeafs.map((c) => c.id)

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
    [canReorder, column.id, table],
  )

  const handleHeaderClick = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement>) => {
      if (!canSort) return
      if (Date.now() - lastResizeEndRef.current < 250) return
      const handler = column.getToggleSortingHandler()
      if (handler) handler(e)
    },
    [canSort, column],
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
      onClick={handleHeaderClick}
      onDragOver={canReorder ? handleDragOver : undefined}
      onDragLeave={canReorder ? handleDragLeave : undefined}
      onDrop={canReorder ? handleDrop : undefined}
    >
      <div
        className="yable-th-content"
        draggable={canReorder || undefined}
        onDragStart={canReorder ? handleDragStart : undefined}
        onDragEnd={canReorder ? handleDragEnd : undefined}
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
