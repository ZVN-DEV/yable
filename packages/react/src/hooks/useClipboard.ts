// @zvndev/yable-react — useClipboard hook
// Attaches copy/cut/paste keyboard listeners to the table container.

import { useEffect, useCallback } from 'react'
import type { RowData, Table, ClipboardOptions } from '@zvndev/yable-core'

export interface UseClipboardOptions extends ClipboardOptions {
  /** Whether clipboard is enabled. Default: true */
  enabled?: boolean
  /** The container element ref to attach listeners to */
  containerRef?: React.RefObject<HTMLElement | null>
  /** Callback when data is copied */
  onCopy?: (text: string) => void
  /** Callback when data is cut */
  onCut?: (text: string) => void
  /** Callback when data is pasted */
  onPaste?: (text: string) => void
}

/**
 * React hook that attaches Ctrl+C / Ctrl+X / Ctrl+V keyboard listeners
 * to the table container for clipboard operations.
 */
export function useClipboard<TData extends RowData>(
  table: Table<TData>,
  options: UseClipboardOptions = {}
): void {
  const {
    enabled = true,
    containerRef,
    onCopy,
    onCut,
    onPaste,
    ...clipboardOptions
  } = options

  const handleCopy = useCallback(
    (e: ClipboardEvent) => {
      // Don't intercept if user is in a form field
      if (isEditableTarget(e.target as HTMLElement)) return

      e.preventDefault()
      const text = table.copyToClipboard(clipboardOptions)

      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', text)
      }

      onCopy?.(text)
    },
    [table, clipboardOptions, onCopy]
  )

  const handleCut = useCallback(
    (e: ClipboardEvent) => {
      if (isEditableTarget(e.target as HTMLElement)) return

      e.preventDefault()
      const text = table.cutCells(clipboardOptions)

      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', text)
      }

      onCut?.(text)
    },
    [table, clipboardOptions, onCut]
  )

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (isEditableTarget(e.target as HTMLElement)) return

      e.preventDefault()
      const text = e.clipboardData?.getData('text/plain') ?? ''

      if (!text) return

      // Determine target cell for paste (use active editing cell or first selected row + first column)
      const state = table.getState()
      let targetRowId: string | undefined
      let targetColumnId: string | undefined

      if (state.editing?.activeCell) {
        targetRowId = state.editing.activeCell.rowId
        targetColumnId = state.editing.activeCell.columnId
      } else {
        // Use first selected row
        const selectedRowIds = Object.keys(state.rowSelection || {}).filter(
          (id) => state.rowSelection[id]
        )
        if (selectedRowIds.length > 0) {
          targetRowId = selectedRowIds[0]
        } else {
          // Use first visible row
          const rows = table.getRowModel().rows
          if (rows.length > 0) {
            targetRowId = rows[0]!.id
          }
        }

        // Use first visible column
        const columns = table.getVisibleLeafColumns()
        if (columns.length > 0) {
          targetColumnId = columns[0]!.id
        }
      }

      if (targetRowId && targetColumnId) {
        table.pasteFromClipboard(text, targetRowId, targetColumnId, clipboardOptions)
        onPaste?.(text)
      }
    },
    [table, clipboardOptions, onPaste]
  )

  useEffect(() => {
    if (!enabled) return

    const container = containerRef?.current ?? document

    container.addEventListener('copy', handleCopy as EventListener)
    container.addEventListener('cut', handleCut as EventListener)
    container.addEventListener('paste', handlePaste as EventListener)

    return () => {
      container.removeEventListener('copy', handleCopy as EventListener)
      container.removeEventListener('cut', handleCut as EventListener)
      container.removeEventListener('paste', handlePaste as EventListener)
    }
  }, [enabled, containerRef, handleCopy, handleCut, handlePaste])
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the event target is an editable form element (input, textarea,
 * contenteditable), meaning we should NOT intercept clipboard events.
 */
function isEditableTarget(el: HTMLElement | null): boolean {
  if (!el) return false
  const tagName = el.tagName?.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }
  if (el.isContentEditable) return true
  return false
}
