// @zvndev/yable-react — useKeyboardNavigation hook
// Attaches spreadsheet-style keyboard navigation to the table container.

import { useCallback, useEffect } from 'react'
import {
  canCellEnterEditMode,
  getFirstKeyboardCell,
  getResolvedFocusedCell,
  type KeyboardNavigationCell,
  type RowData,
  type Table,
} from '@zvndev/yable-core'

export interface UseKeyboardNavigationOptions {
  /** Whether keyboard navigation is enabled. Default: true */
  enabled?: boolean
  /** The table container element ref */
  containerRef?: React.RefObject<HTMLElement | null>
}

export function useKeyboardNavigation<TData extends RowData>(
  table: Table<TData>,
  options: UseKeyboardNavigationOptions = {}
): void {
  const {
    enabled = true,
    containerRef,
  } = options

  const focusedCell = table.getFocusedCell()
  const activeCell = table.getState().editing.activeCell
  const focusedRowIndex = focusedCell?.rowIndex ?? null
  const focusedColumnIndex = focusedCell?.columnIndex ?? null

  const focusCellElement = useCallback(
    (container: HTMLElement, cell: KeyboardNavigationCell): boolean => {
      const element = getCellElement(container, cell)
      if (!element) return false

      element.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })

      if (document.activeElement !== element) {
        element.focus({ preventScroll: true })
      }

      return true
    },
    []
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || table.options.enableKeyboardNavigation === false) return

      const target = event.target as HTMLElement | null
      if (isEditableTarget(target)) return

      const ctrlKey = event.ctrlKey || event.metaKey
      const currentFocusedCell = table.getFocusedCell() ?? getFirstKeyboardCell(table)

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          table.moveFocus({ type: 'arrow', direction: 'up', ctrlKey })
          return

        case 'ArrowDown':
          event.preventDefault()
          table.moveFocus({ type: 'arrow', direction: 'down', ctrlKey })
          return

        case 'ArrowLeft':
          event.preventDefault()
          table.moveFocus({ type: 'arrow', direction: 'left', ctrlKey })
          return

        case 'ArrowRight':
          event.preventDefault()
          table.moveFocus({ type: 'arrow', direction: 'right', ctrlKey })
          return

        case 'Tab':
          event.preventDefault()
          table.moveFocus({ type: 'tab', shiftKey: event.shiftKey })
          return

        case 'Home':
          event.preventDefault()
          table.moveFocus({ type: 'home', ctrlKey })
          return

        case 'End':
          event.preventDefault()
          table.moveFocus({ type: 'end', ctrlKey })
          return

        case 'PageUp':
          event.preventDefault()
          table.moveFocus({
            type: 'page',
            direction: 'up',
            pageSize: getVisiblePageSize(containerRef?.current, table),
          })
          return

        case 'PageDown':
          event.preventDefault()
          table.moveFocus({
            type: 'page',
            direction: 'down',
            pageSize: getVisiblePageSize(containerRef?.current, table),
          })
          return

        case 'F2': {
          const resolved = getResolvedFocusedCell(table, currentFocusedCell)
          if (!resolved) return
          if (!canCellEnterEditMode(table, resolved.row, resolved.column)) return

          event.preventDefault()
          table.startEditing(resolved.row.id, resolved.column.id)
          return
        }

        case 'Enter':
          if (!activeCell) return
          event.preventDefault()
          table.commitEdit()
          return

        case 'Escape':
          if (!activeCell) return
          event.preventDefault()
          table.cancelEdit()
          return
      }
    },
    [activeCell, containerRef, enabled, table]
  )

  useEffect(() => {
    if (!enabled || table.options.enableKeyboardNavigation === false) return

    const container = containerRef?.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, enabled, handleKeyDown, table.options.enableKeyboardNavigation])

  useEffect(() => {
    if (!enabled || table.options.enableKeyboardNavigation === false) return
    if (focusedRowIndex === null || focusedColumnIndex === null) return
    if (activeCell) return

    const container = containerRef?.current
    if (!container) return

    const nextFocusedCell = {
      rowIndex: focusedRowIndex,
      columnIndex: focusedColumnIndex,
    }

    if (focusCellElement(container, nextFocusedCell)) {
      return
    }

    const virtualContainer = getVirtualScrollContainer(container)
    if (!virtualContainer) return

    scrollVirtualRowIntoView(virtualContainer, table, nextFocusedCell.rowIndex)

    const rafId = requestAnimationFrame(() => {
      focusCellElement(container, nextFocusedCell)
    })

    return () => cancelAnimationFrame(rafId)
  }, [
    activeCell,
    containerRef,
    enabled,
    focusCellElement,
    focusedColumnIndex,
    focusedRowIndex,
    table,
  ])
}

function getCellElement(
  container: HTMLElement,
  cell: KeyboardNavigationCell
): HTMLTableCellElement | null {
  return container.querySelector<HTMLTableCellElement>(
    `[data-row-index="${cell.rowIndex}"][data-column-index="${cell.columnIndex}"]`
  )
}

function getVirtualScrollContainer(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('.yable-virtual-scroll-container')
}

function getEstimatedRowHeight<TData extends RowData>(
  table: Table<TData>,
  rowIndex: number
): number {
  const rowHeight = table.options.rowHeight

  if (typeof rowHeight === 'function') {
    return rowHeight(rowIndex)
  }

  if (typeof rowHeight === 'number') {
    return rowHeight
  }

  return table.options.estimateRowHeight ?? 40
}

function getEstimatedRowOffset<TData extends RowData>(
  table: Table<TData>,
  rowIndex: number
): number {
  const rowHeight = table.options.rowHeight

  if (typeof rowHeight === 'function') {
    let offset = 0
    for (let index = 0; index < rowIndex; index++) {
      offset += rowHeight(index)
    }
    return offset
  }

  const estimatedRowHeight = getEstimatedRowHeight(table, rowIndex)
  return rowIndex * estimatedRowHeight
}

function scrollVirtualRowIntoView<TData extends RowData>(
  container: HTMLElement,
  table: Table<TData>,
  rowIndex: number
): void {
  const rowTop = getEstimatedRowOffset(table, rowIndex)
  const rowHeight = getEstimatedRowHeight(table, rowIndex)
  const rowBottom = rowTop + rowHeight

  if (rowTop < container.scrollTop) {
    container.scrollTop = rowTop
    return
  }

  const viewportBottom = container.scrollTop + container.clientHeight
  if (rowBottom > viewportBottom) {
    container.scrollTop = rowBottom - container.clientHeight
  }
}

function getVisiblePageSize<TData extends RowData>(
  container: HTMLElement | null | undefined,
  table: Table<TData>
): number {
  if (!container) return 10

  const scrollContainer = getVirtualScrollContainer(container) ?? container
  const estimatedRowHeight = getEstimatedRowHeight(
    table,
    table.getFocusedCell()?.rowIndex ?? 0
  )

  if (estimatedRowHeight <= 0) return 10

  return Math.max(1, Math.floor(scrollContainer.clientHeight / estimatedRowHeight))
}

function isEditableTarget(element: HTMLElement | null): boolean {
  if (!element) return false

  const tagName = element.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  return element.isContentEditable
}
