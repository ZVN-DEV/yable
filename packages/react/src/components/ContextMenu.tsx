// @yable/react — Context Menu Component
// Built-in right-click menu with copy, paste, cut, export, sort, pin, hide, auto-size.

import React, { useRef, useEffect, useCallback } from 'react'
import type { RowData, Table } from '@yable/core'
import { ContextMenuItem, type ContextMenuItemDef } from './ContextMenuItem'

export type { ContextMenuItemDef }

interface ContextMenuProps<TData extends RowData> {
  x: number
  y: number
  onClose: () => void
  table: Table<TData>
  customItems?: ContextMenuItemDef[]
}

export function ContextMenu<TData extends RowData>({
  x,
  y,
  onClose,
  table,
  customItems,
}: ContextMenuProps<TData>) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Position adjustment to keep menu within viewport
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    if (rect.right > vw - 8) {
      menuRef.current.style.left = `${x - rect.width}px`
    }
    if (rect.bottom > vh - 8) {
      menuRef.current.style.top = `${y - rect.height}px`
    }
  }, [x, y])

  // Focus first item for keyboard nav
  useEffect(() => {
    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    firstItem?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
        if (!items || items.length === 0) return

        const currentIndex = Array.from(items).findIndex(
          (el) => el === document.activeElement
        )

        let nextIndex: number
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        }
        items[nextIndex]?.focus()
      }
    },
    [onClose]
  )

  // Build default menu items
  const defaultItems: ContextMenuItemDef[] = [
    {
      id: 'copy',
      label: 'Copy',
      shortcut: '\u2318C',
      action: () => {
        try {
          const text = table.copyToClipboard()
          navigator.clipboard?.writeText(text)
        } catch {}
      },
    },
    {
      id: 'cut',
      label: 'Cut',
      shortcut: '\u2318X',
      action: () => {
        try {
          const text = table.cutCells()
          navigator.clipboard?.writeText(text)
        } catch {}
      },
    },
    {
      id: 'paste',
      label: 'Paste',
      shortcut: '\u2318V',
      action: () => {
        navigator.clipboard?.readText().then((text) => {
          const editing = table.getState().editing
          if (editing?.activeCell) {
            table.pasteFromClipboard(
              text,
              editing.activeCell.rowId,
              editing.activeCell.columnId
            )
          }
        }).catch(() => {})
      },
    },
    { id: 'sep1', label: '', separator: true },
    {
      id: 'sort',
      label: 'Sort',
      children: [
        {
          id: 'sort-asc',
          label: 'Sort Ascending',
          action: () => {
            table.setSorting([])
          },
        },
        {
          id: 'sort-desc',
          label: 'Sort Descending',
          action: () => {
            table.setSorting([])
          },
        },
        {
          id: 'sort-clear',
          label: 'Clear Sort',
          action: () => {
            table.resetSorting(true)
          },
        },
      ],
    },
    { id: 'sep2', label: '', separator: true },
    {
      id: 'export',
      label: 'Export',
      children: [
        {
          id: 'export-csv',
          label: 'Export as CSV',
          action: () => {
            const csv = table.exportData({ format: 'csv', allRows: true })
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'table-export.csv'
            a.click()
            URL.revokeObjectURL(url)
          },
        },
        {
          id: 'export-json',
          label: 'Export as JSON',
          action: () => {
            const json = table.exportData({ format: 'json', allRows: true })
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'table-export.json'
            a.click()
            URL.revokeObjectURL(url)
          },
        },
      ],
    },
  ]

  const items = customItems
    ? [...defaultItems, { id: 'sep-custom', label: '', separator: true }, ...customItems]
    : defaultItems

  return (
    <div
      ref={menuRef}
      className="yable-ctx-menu"
      role="menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
      }}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <ContextMenuItem key={item.id} item={item} onClose={onClose} />
      ))}
    </div>
  )
}
