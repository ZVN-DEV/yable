import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Column, RowData } from '@zvndev/yable-core'

export interface VirtualColumn<TData extends RowData> {
  column: Column<TData, unknown>
  index: number
  start: number
  size: number
}

export interface UseColumnVirtualizationOptions<TData extends RowData> {
  containerRef: React.RefObject<HTMLElement | null>
  columns: Column<TData, unknown>[]
  overscan?: number
  enabled?: boolean
  sizingKey?: string
}

export interface UseColumnVirtualizationResult<TData extends RowData> {
  virtualColumns: VirtualColumn<TData>[]
  startOffset: number
  endOffset: number
  totalWidth: number
  visibleWidth: number
  startIndex: number
  endIndex: number
  isVirtualized: boolean
  scrollToIndex: (index: number) => void
}

function binarySearchOffsets(offsets: number[], target: number): number {
  let low = 0
  let high = offsets.length - 1

  while (low < high) {
    const mid = (low + high) >>> 1
    if (offsets[mid + 1]! <= target) {
      low = mid + 1
    } else {
      high = mid
    }
  }

  return low
}

export function useColumnVirtualization<TData extends RowData>({
  containerRef,
  columns,
  overscan = 2,
  enabled = true,
  sizingKey,
}: UseColumnVirtualizationOptions<TData>): UseColumnVirtualizationResult<TData> {
  const [scrollState, setScrollState] = useState({
    scrollLeft: 0,
    containerWidth: 0,
  })
  const rafRef = useRef<number | null>(null)

  const sizes = useMemo(
    () => columns.map((column) => column.getSize()),
    // `sizingKey` is an explicit invalidation hook for stable Column objects whose getSize value changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, sizingKey],
  )

  const offsets = useMemo(() => {
    const next = new Array<number>(columns.length + 1)
    next[0] = 0
    for (let i = 0; i < columns.length; i++) {
      next[i + 1] = next[i]! + (sizes[i] ?? 0)
    }
    return next
  }, [columns.length, sizes])

  const totalWidth = offsets[offsets.length - 1] ?? 0

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setScrollState({
      scrollLeft: container.scrollLeft,
      containerWidth: container.clientWidth,
    })

    const handleScroll = () => {
      if (rafRef.current !== null) return

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const el = containerRef.current
        if (!el) return
        setScrollState({
          scrollLeft: el.scrollLeft,
          containerWidth: el.clientWidth,
        })
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        const el = containerRef.current
        if (!el) return
        setScrollState((prev) => {
          const nextWidth = el.clientWidth
          if (prev.containerWidth === nextWidth && prev.scrollLeft === el.scrollLeft) {
            return prev
          }
          return {
            scrollLeft: el.scrollLeft,
            containerWidth: nextWidth,
          }
        })
      })
      resizeObserver.observe(container)
    }

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      resizeObserver?.disconnect()
    }
  }, [containerRef])

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current
      if (!container || columns.length === 0) return
      const clampedIndex = Math.max(0, Math.min(index, columns.length - 1))
      container.scrollLeft = offsets[clampedIndex] ?? 0
    },
    [columns.length, containerRef, offsets],
  )

  if (!enabled || columns.length === 0) {
    return {
      virtualColumns: columns.map((column, index) => ({
        column,
        index,
        start: offsets[index] ?? 0,
        size: sizes[index] ?? 0,
      })),
      startOffset: 0,
      endOffset: 0,
      totalWidth,
      visibleWidth: totalWidth,
      startIndex: 0,
      endIndex: Math.max(columns.length - 1, 0),
      isVirtualized: false,
      scrollToIndex,
    }
  }

  const { scrollLeft, containerWidth } = scrollState

  if (containerWidth <= 0 || totalWidth <= containerWidth) {
    return {
      virtualColumns: columns.map((column, index) => ({
        column,
        index,
        start: offsets[index] ?? 0,
        size: sizes[index] ?? 0,
      })),
      startOffset: 0,
      endOffset: 0,
      totalWidth,
      visibleWidth: totalWidth,
      startIndex: 0,
      endIndex: Math.max(columns.length - 1, 0),
      isVirtualized: false,
      scrollToIndex,
    }
  }

  const startIndex = binarySearchOffsets(offsets, scrollLeft)
  const endBoundary = scrollLeft + containerWidth
  const endIndex = binarySearchOffsets(offsets, Math.max(scrollLeft, endBoundary - 1))

  const overscanStart = Math.max(0, startIndex - overscan)
  const overscanEnd = Math.min(columns.length - 1, endIndex + overscan)

  const virtualColumns: VirtualColumn<TData>[] = []
  for (let i = overscanStart; i <= overscanEnd; i++) {
    virtualColumns.push({
      column: columns[i]!,
      index: i,
      start: offsets[i] ?? 0,
      size: sizes[i] ?? 0,
    })
  }

  const startOffset = offsets[overscanStart] ?? 0
  const visibleWidth = (offsets[overscanEnd + 1] ?? totalWidth) - startOffset
  const endOffset = totalWidth - (offsets[overscanEnd + 1] ?? totalWidth)

  return {
    virtualColumns,
    startOffset,
    endOffset,
    totalWidth,
    visibleWidth,
    startIndex: overscanStart,
    endIndex: overscanEnd,
    isVirtualized: true,
    scrollToIndex,
  }
}
