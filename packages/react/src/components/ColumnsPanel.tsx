// @yable/react — Columns Panel Component
// Show/hide/reorder columns via drag-and-drop.

import React, { useState, useCallback } from 'react'
import type { RowData, Table } from '@yable/core'

interface ColumnsPanelProps<TData extends RowData> {
  table: Table<TData>
}

export function ColumnsPanel<TData extends RowData>({
  table,
}: ColumnsPanelProps<TData>) {
  const [search, setSearch] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const columns = table.getAllLeafColumns()
  const filteredColumns = search
    ? columns.filter((col) => {
        const header = typeof col.columnDef.header === 'string'
          ? col.columnDef.header
          : col.id
        return header.toLowerCase().includes(search.toLowerCase())
      })
    : columns

  const handleToggleAll = useCallback(
    (visible: boolean) => {
      table.toggleAllColumnsVisible(visible)
    },
    [table]
  )

  const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    setDraggedId(columnId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', columnId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!draggedId || draggedId === targetId) return

      const currentOrder = table.getState().columnOrder.length > 0
        ? table.getState().columnOrder
        : columns.map((c) => c.id)

      const fromIndex = currentOrder.indexOf(draggedId)
      const toIndex = currentOrder.indexOf(targetId)

      if (fromIndex === -1 || toIndex === -1) return

      const newOrder = [...currentOrder]
      newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, draggedId)

      table.setColumnOrder(newOrder)
      setDraggedId(null)
    },
    [draggedId, table, columns]
  )

  return (
    <div className="yable-sidebar-panel yable-sidebar-columns">
      <div className="yable-sidebar-panel-search">
        <input
          type="text"
          className="yable-sidebar-search-input"
          placeholder="Search columns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search columns"
        />
      </div>

      <div className="yable-sidebar-panel-actions">
        <button
          className="yable-sidebar-action-btn"
          onClick={() => handleToggleAll(true)}
        >
          Show all
        </button>
        <button
          className="yable-sidebar-action-btn"
          onClick={() => handleToggleAll(false)}
        >
          Hide all
        </button>
      </div>

      <div className="yable-sidebar-column-list" role="listbox">
        {filteredColumns.map((column) => {
          const header = typeof column.columnDef.header === 'string'
            ? column.columnDef.header
            : column.id
          const isVisible = column.getIsVisible()

          return (
            <div
              key={column.id}
              className={`yable-sidebar-column-item ${draggedId === column.id ? 'yable-sidebar-column-item--dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, column.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              role="option"
              aria-selected={isVisible}
            >
              <span className="yable-sidebar-drag-handle" aria-hidden="true">
                <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" opacity="0.3">
                  <circle cx="2" cy="2" r="1.2" />
                  <circle cx="6" cy="2" r="1.2" />
                  <circle cx="2" cy="7" r="1.2" />
                  <circle cx="6" cy="7" r="1.2" />
                  <circle cx="2" cy="12" r="1.2" />
                  <circle cx="6" cy="12" r="1.2" />
                </svg>
              </span>
              <label className="yable-sidebar-column-label">
                <input
                  type="checkbox"
                  className="yable-checkbox"
                  checked={isVisible}
                  onChange={(e) => column.toggleVisibility(e.target.checked)}
                />
                <span>{header}</span>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
