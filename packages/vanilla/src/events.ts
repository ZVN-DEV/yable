// @yable/vanilla — Event Delegation

import type { RowData, Table } from '@yable/core'

export type VanillaEventHandler = (event: {
  type: string
  rowId?: string
  columnId?: string
  originalEvent: Event
  value?: unknown
}) => void

export interface VanillaEventHandlers {
  'cell:click'?: VanillaEventHandler
  'cell:dblclick'?: VanillaEventHandler
  'row:click'?: VanillaEventHandler
  'row:dblclick'?: VanillaEventHandler
  'header:click'?: VanillaEventHandler
  [key: string]: VanillaEventHandler | undefined
}

export function attachEventDelegation<TData extends RowData>(
  root: HTMLElement,
  table: Table<TData>,
  handlers: VanillaEventHandlers,
  onUpdate: () => void
): () => void {
  const abortController = new AbortController()
  const signal = abortController.signal

  // Click delegation
  root.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement

      // Pagination buttons
      const pageBtn = target.closest<HTMLElement>('[data-yable-page]')
      if (pageBtn) {
        const page = pageBtn.dataset.yablePage!
        if (page === 'first') table.setPageIndex(0)
        else if (page === 'last') table.setPageIndex(table.getPageCount() - 1)
        else if (page === 'prev') table.previousPage()
        else if (page === 'next') table.nextPage()
        else table.setPageIndex(Number(page))
        onUpdate()
        return
      }

      // Sort header click
      const th = target.closest<HTMLElement>('[data-yable-sortable="true"]')
      if (th) {
        const columnId = th.dataset.yableColumn!
        const column = table.getColumn(columnId)
        if (column) {
          column.toggleSorting()
          onUpdate()
        }
        handlers['header:click']?.({
          type: 'header:click',
          columnId,
          originalEvent: e,
        })
        return
      }

      // Cell click
      const td = target.closest<HTMLElement>('[data-yable-cell]')
      if (td) {
        const columnId = td.dataset.yableCell!
        const rowId = td.dataset.yableRow!
        handlers['cell:click']?.({
          type: 'cell:click',
          rowId,
          columnId,
          originalEvent: e,
        })
      }

      // Row click
      const tr = target.closest<HTMLElement>('[data-yable-row]')
      if (tr && !target.closest('input, select, button')) {
        const rowId = tr.dataset.yableRow!
        handlers['row:click']?.({
          type: 'row:click',
          rowId,
          originalEvent: e,
        })
      }
    },
    { signal }
  )

  // Double-click delegation
  root.addEventListener(
    'dblclick',
    (e) => {
      const target = e.target as HTMLElement

      const td = target.closest<HTMLElement>('[data-yable-cell]')
      if (td) {
        const columnId = td.dataset.yableCell!
        const rowId = td.dataset.yableRow!
        handlers['cell:dblclick']?.({
          type: 'cell:dblclick',
          rowId,
          columnId,
          originalEvent: e,
        })
      }

      const tr = target.closest<HTMLElement>('[data-yable-row]')
      if (tr) {
        const rowId = tr.dataset.yableRow!
        handlers['row:dblclick']?.({
          type: 'row:dblclick',
          rowId,
          originalEvent: e,
        })
      }
    },
    { signal }
  )

  // Input change delegation (forms in cells)
  root.addEventListener(
    'change',
    (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement
      const columnId = target.dataset.yableInput
      const rowId = target.dataset.yableInputRow
      if (!columnId || !rowId) return

      let value: unknown
      if (target instanceof HTMLInputElement && (target.type === 'checkbox')) {
        value = target.checked
      } else if (target instanceof HTMLInputElement && target.type === 'number') {
        value = Number(target.value)
      } else {
        value = target.value
      }

      table.setPendingValue(rowId, columnId, value)
      onUpdate()
    },
    { signal }
  )

  // Input blur delegation (commit editing)
  root.addEventListener(
    'blur',
    (e) => {
      const target = e.target as HTMLElement
      if (target.dataset.yableInput && target.dataset.yableInputRow) {
        // Only commit if we're in click-to-edit mode (not always-editable)
        const editing = table.getState().editing
        if (editing.activeCell) {
          table.commitEdit()
          onUpdate()
        }
      }
    },
    { signal, capture: true }
  )

  // Page size select
  root.addEventListener(
    'change',
    (e) => {
      const target = e.target as HTMLSelectElement
      if (target.dataset.yablePagesize !== undefined) {
        table.setPageSize(Number(target.value))
        onUpdate()
      }
    },
    { signal }
  )

  // Resize handle delegation
  root.addEventListener(
    'mousedown',
    (e) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('yable-resize-handle')) {
        const columnId = target.dataset.yableResize!
        // Find the header for this column to get the resize handler
        for (const headerGroup of table.getHeaderGroups()) {
          for (const header of headerGroup.headers) {
            if (header.column.id === columnId) {
              const handler = header.getResizeHandler()
              if (handler) {
                handler(e)
                onUpdate()
              }
              break
            }
          }
        }
      }
    },
    { signal }
  )

  return () => abortController.abort()
}
