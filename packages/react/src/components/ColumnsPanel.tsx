// @yable/react — Columns Panel Component
// Show/hide/reorder columns via drag-and-drop with search, toggle-all actions,
// and a polished drag handle.

import React, { useState, useCallback } from 'react'
import type { RowData, Table } from '@yable/core'

interface ColumnsPanelProps<TData extends RowData> {
  table: Table<TData>
}

/** Search icon for the column search field */
function SearchIcon() {
  return (
    <svg className="yable-sidebar-search-icon" width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6.25" cy="6.25" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Eye icon indicating visibility state */
function VisibilityIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.3" />
      <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

export function ColumnsPanel<TData extends RowData>({
  table,
}: ColumnsPanelProps<TData>) {
  const [search, setSearch] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const columns = table.getAllLeafColumns()
  const visibleCount = columns.filter((c) => c.getIsVisible()).length
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

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
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
      {/* Search input with icon */}
      <div className="yable-sidebar-panel-search">
        <SearchIcon />
        <input
          type="text"
          className="yable-sidebar-search-input"
          placeholder="Search columns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search columns"
        />
      </div>

      {/* Toggle actions with count badge */}
      <div className="yable-sidebar-panel-actions">
        <button
          type="button"
          className="yable-sidebar-action-btn"
          onClick={() => handleToggleAll(true)}
        >
          Show all
        </button>
        <button
          type="button"
          className="yable-sidebar-action-btn"
          onClick={() => handleToggleAll(false)}
        >
          Hide all
        </button>
        <span className="yable-sidebar-column-count" aria-live="polite">
          {visibleCount}/{columns.length}
        </span>
      </div>

      {/* Draggable column list */}
      <div className="yable-sidebar-column-list" role="listbox" aria-label="Columns">
        {filteredColumns.map((column) => {
          const header = typeof column.columnDef.header === 'string'
            ? column.columnDef.header
            : column.id
          const isVisible = column.getIsVisible()

          return (
            <div
              key={column.id}
              className={`yable-sidebar-column-item${draggedId === column.id ? ' yable-sidebar-column-item--dragging' : ''}${!isVisible ? ' yable-sidebar-column-item--hidden' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, column.id)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, column.id)}
              role="option"
              aria-selected={isVisible}
            >
              <span className="yable-sidebar-drag-handle" aria-hidden="true">
                <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
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
                <span className="yable-sidebar-column-name">{header}</span>
              </label>
              <span className="yable-sidebar-column-visibility" aria-hidden="true">
                <VisibilityIcon visible={isVisible} />
              </span>
            </div>
          )
        })}

        {/* Empty state when search yields no results */}
        {filteredColumns.length === 0 && search && (
          <div className="yable-sidebar-empty">
            <span>No columns match &ldquo;{search}&rdquo;</span>
          </div>
        )}
      </div>
    </div>
  )
}
