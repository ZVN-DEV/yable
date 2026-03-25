// @yable/react — Table Header Component

import React from 'react'
import type { RowData, Table, Header as HeaderType } from '@yable/core'
import { SortIndicator } from './SortIndicator'

interface TableHeaderProps<TData extends RowData> {
  table: Table<TData>
}

export function TableHeader<TData extends RowData>({
  table,
}: TableHeaderProps<TData>) {
  const headerGroups = table.getHeaderGroups()

  return (
    <thead className="yable-thead">
      {headerGroups.map((headerGroup) => (
        <tr key={headerGroup.id} className="yable-header-row">
          {headerGroup.headers.map((header) => (
            <HeaderCell key={header.id} header={header} />
          ))}
        </tr>
      ))}
    </thead>
  )
}

function HeaderCell<TData extends RowData>({
  header,
}: {
  header: HeaderType<TData, unknown>
}) {
  const column = header.column
  const canSort = column.getCanSort()
  const sortDirection = column.getIsSorted()
  const sortIndex = column.getSortIndex()
  const canResize = column.getCanResize()

  const headerContent =
    header.isPlaceholder
      ? null
      : typeof column.columnDef.header === 'function'
        ? (column.columnDef.header as Function)(header.getContext())
        : column.columnDef.header ?? header.id

  const style: React.CSSProperties = {
    width: header.getSize(),
    minWidth: column.columnDef.minSize,
    maxWidth: column.columnDef.maxSize,
  }

  // Column pinning offset
  const pinned = column.getIsPinned()
  if (pinned) {
    style.position = 'sticky'
    if (pinned === 'left') {
      style.left = header.getStart('left')
    } else {
      style.right = header.getStart('right')
    }
  }

  return (
    <th
      className="yable-th"
      style={style}
      data-sortable={canSort || undefined}
      data-pinned={pinned || undefined}
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
      onClick={canSort ? column.getToggleSortingHandler() : undefined}
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
          onMouseDown={header.getResizeHandler() as any}
          onTouchStart={header.getResizeHandler() as any}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </th>
  )
}
