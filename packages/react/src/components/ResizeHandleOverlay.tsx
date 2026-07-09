// @zvndev/yable-react — Column Resize Handle Overlay
//
// Why an overlay layer instead of a handle inside each `th`:
// Under sticky headers (the `stickyHeader` prop AND the row-virtualization
// surface, which pins header `th` unconditionally) every header cell gets
// `position: sticky; z-index: var(--yable-z-header)`. Equal-z sibling `th`
// elements each form their own stacking context, so a later `th` paints on top
// of the previous cell's OVERHANGING resize handle — the half of the hit zone
// that straddles into the next column is covered, and a user can only grab the
// divider from its inner (left) side. No z-index on the in-`th` handle can
// escape its own cell's stacking context.
//
// This layer lives OUTSIDE every `th` (a child of `.yable-main`), so it paints
// above all header cells with a single z-index and its hit zones straddle each
// divider symmetrically. Handle positions are MEASURED from the real header
// cell rects (relative to this layer), so the layer is correct in every mode —
// sticky/non-sticky headers, pinned columns, row/column virtualization,
// horizontal scroll, and RTL — because it simply mirrors where the browser
// actually painted each column boundary. Positions are refreshed on scroll
// (rAF-throttled), container resize, and whenever the column size/order
// signature changes (which also tracks a live drag-resize).

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { RowData, Table, Header as HeaderType } from '@zvndev/yable-core'
import { markResizeEnd } from './resizeGuard'

interface ResizeHandleOverlayProps<TData extends RowData> {
  table: Table<TData>
  /** The scrolling/positioned ancestor the layer is a child of. */
  mainRef: React.RefObject<HTMLDivElement | null>
  isRtl: boolean
  /**
   * Changes whenever visible column ids or sizes change (incl. per-frame during
   * a live drag-resize), driving a re-measure so handles track the divider.
   */
  signature: string
}

interface HandleEntry<TData extends RowData> {
  id: string
  header: HeaderType<TData, unknown>
  /** The rightmost (LTR) / leftmost (RTL) boundary is the grid edge: keep the
   *  hit zone flush inside so its overhang can't inflate the grid scrollWidth. */
  edge: boolean
}

export function ResizeHandleOverlay<TData extends RowData>({
  table,
  mainRef,
  isRtl,
  signature,
}: ResizeHandleOverlayProps<TData>) {
  const layerRef = useRef<HTMLDivElement>(null)

  const leafColumns = table.getVisibleLeafColumns()
  const leafHeaders = table.getHeaderGroups().at(-1)?.headers ?? []
  const headerById = new Map(leafHeaders.map((h) => [h.column.id, h]))

  const handles: HandleEntry<TData>[] = []
  leafColumns.forEach((column, i) => {
    if (!column.getCanResize()) return
    const header = headerById.get(column.id)
    if (!header) return
    // The grid's outer boundary is the last leaf in LTR, the first in RTL.
    const edge = isRtl ? i === 0 : i === leafColumns.length - 1
    handles.push({ id: column.id, header, edge })
  })

  const reposition = useCallback(() => {
    const layer = layerRef.current
    if (!layer) return
    const layerRect = layer.getBoundingClientRect()
    for (const node of Array.from(layer.children) as HTMLElement[]) {
      const colId = node.dataset.columnId
      if (!colId) continue
      const th = mainRef.current?.querySelector<HTMLElement>(
        `thead th[data-column-id="${CSS.escape(colId)}"]`,
      )
      if (!th) {
        node.style.display = 'none'
        continue
      }
      const r = th.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) {
        node.style.display = 'none'
        continue
      }
      // The divider is the cell's trailing edge: right in LTR, left in RTL.
      const boundary = (isRtl ? r.left : r.right) - layerRect.left
      node.style.display = ''
      node.style.left = `${boundary}px`
      node.style.top = `${r.top - layerRect.top}px`
      node.style.height = `${r.height}px`
    }
  }, [mainRef, isRtl])

  // Measure after every layout-affecting render (mount, resize-drag frame,
  // reorder, virtualization window change) before the browser paints.
  useLayoutEffect(() => {
    reposition()
  }, [reposition, signature])

  useEffect(() => {
    const main = mainRef.current
    if (!main) return
    let raf = 0
    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        reposition()
      })
    }
    // Capture: scroll doesn't bubble, but the real scroller may be a nested
    // horizontal/virtual container inside `.yable-main`.
    main.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    ro?.observe(main)
    return () => {
      main.removeEventListener('scroll', schedule, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', schedule)
      ro?.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mainRef, reposition])

  const startResize = useCallback(
    (header: HeaderType<TData, unknown>) => (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation()
      const handler = header.getResizeHandler()
      if (!handler) return
      ;(handler as (ev: unknown) => void)(e.nativeEvent)
      // Stamp resize-end so the trailing click can't toggle sort on a th.
      const onEnd = () => {
        markResizeEnd(table)
        document.removeEventListener('mouseup', onEnd, true)
        document.removeEventListener('touchend', onEnd, true)
      }
      document.addEventListener('mouseup', onEnd, true)
      document.addEventListener('touchend', onEnd, true)
    },
    [table],
  )

  const swallowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  if (handles.length === 0) return null

  return (
    <div className="yable-resize-overlay" aria-hidden="true" ref={layerRef}>
      {handles.map(({ id, header, edge }) => (
        <div
          key={id}
          className="yable-resize-overlay-handle"
          data-column-id={id}
          data-edge={edge || undefined}
          data-resizing={header.column.getIsResizing() || undefined}
          onMouseDown={startResize(header)}
          onTouchStart={startResize(header)}
          onClick={swallowClick}
        />
      ))}
    </div>
  )
}
