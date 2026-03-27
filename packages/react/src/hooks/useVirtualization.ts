// @yable/react — Row virtualization hook

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface VirtualRow {
  index: number
  start: number
  size: number
}

export interface UseVirtualizationOptions {
  containerRef: React.RefObject<HTMLElement | null>
  totalRows: number
  rowHeight?: number | ((index: number) => number)
  overscan?: number
  estimateRowHeight?: number
}

export interface UseVirtualizationResult {
  virtualRows: VirtualRow[]
  totalHeight: number
  startIndex: number
  endIndex: number
  scrollTo: (index: number) => void
}

const EMPTY_RESULT: Omit<UseVirtualizationResult, 'scrollTo'> = {
  virtualRows: [],
  totalHeight: 0,
  startIndex: 0,
  endIndex: 0,
}

/**
 * Computes which rows are visible in a scrollable container and returns
 * positioning data so only those rows (plus an overscan buffer) are rendered.
 *
 * Supports both fixed and variable row heights.
 */
export function useVirtualization({
  containerRef,
  totalRows,
  rowHeight = 40,
  overscan = 5,
  estimateRowHeight: _estimateRowHeight,
}: UseVirtualizationOptions): UseVirtualizationResult {
  const isFixedHeight = typeof rowHeight === 'number'

  // Cache for variable row heights (index -> measured or estimated size)
  const heightCacheRef = useRef<Map<number, number>>(new Map())

  const getRowHeight = useCallback(
    (index: number): number => {
      if (isFixedHeight) return rowHeight as number
      // Check cache first
      const cached = heightCacheRef.current.get(index)
      if (cached !== undefined) return cached
      // Use the rowHeight function if provided
      const height = (rowHeight as (index: number) => number)(index)
      heightCacheRef.current.set(index, height)
      return height
    },
    [rowHeight, isFixedHeight]
  )

  const [scrollState, setScrollState] = useState<{
    scrollTop: number
    containerHeight: number
  }>({ scrollTop: 0, containerHeight: 0 })

  // RAF handle for scroll throttling
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Initialize container dimensions
    setScrollState({
      scrollTop: container.scrollTop,
      containerHeight: container.clientHeight,
    })

    const handleScroll = () => {
      if (rafRef.current !== null) return

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const el = containerRef.current
        if (!el) return
        setScrollState({
          scrollTop: el.scrollTop,
          containerHeight: el.clientHeight,
        })
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    // Handle container resize via ResizeObserver
    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        const el = containerRef.current
        if (!el) return
        setScrollState((prev) => {
          const newHeight = el.clientHeight
          if (prev.containerHeight === newHeight) return prev
          return { ...prev, containerHeight: newHeight }
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
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [containerRef])

  // Clear height cache when totalRows changes significantly
  useEffect(() => {
    if (!isFixedHeight) {
      heightCacheRef.current.clear()
    }
  }, [totalRows, isFixedHeight])

  // scrollTo must be declared before any early returns (rules of hooks)
  const scrollTo = useCallback(
    (index: number) => {
      const container = containerRef.current
      if (!container || totalRows === 0) return
      const clampedIndex = Math.max(0, Math.min(index, totalRows - 1))

      if (isFixedHeight) {
        container.scrollTop = clampedIndex * (rowHeight as number)
      } else {
        let offset = 0
        for (let i = 0; i < clampedIndex; i++) {
          offset += getRowHeight(i)
        }
        container.scrollTop = offset
      }
    },
    [containerRef, totalRows, rowHeight, isFixedHeight, getRowHeight]
  )

  // Compute total height
  const totalHeight = useMemo(() => {
    if (totalRows === 0) return 0
    if (isFixedHeight) return totalRows * (rowHeight as number)
    let total = 0
    for (let i = 0; i < totalRows; i++) {
      total += getRowHeight(i)
    }
    return total
  }, [totalRows, rowHeight, isFixedHeight, getRowHeight])

  const { scrollTop, containerHeight } = scrollState

  // Edge case: no rows
  if (totalRows === 0) {
    return { ...EMPTY_RESULT, scrollTo }
  }

  // Edge case: container not yet measured
  if (containerHeight === 0) {
    return {
      virtualRows: [],
      totalHeight,
      startIndex: 0,
      endIndex: 0,
      scrollTo,
    }
  }

  // Find visible range
  let startIndex = 0
  let endIndex = 0

  if (isFixedHeight) {
    const fixedH = rowHeight as number
    startIndex = Math.floor(scrollTop / fixedH)
    endIndex = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / fixedH) - 1
    )
  } else {
    // Variable heights: walk rows to find the visible range
    let accum = 0
    let foundStart = false

    for (let i = 0; i < totalRows; i++) {
      const h = getRowHeight(i)
      if (!foundStart && accum + h > scrollTop) {
        startIndex = i
        foundStart = true
      }
      if (foundStart && accum >= scrollTop + containerHeight) {
        endIndex = i - 1
        break
      }
      accum += h
      if (i === totalRows - 1) {
        endIndex = i
      }
    }

    if (!foundStart) {
      startIndex = 0
      endIndex = 0
    }
  }

  // Apply overscan
  const overscanStart = Math.max(0, startIndex - overscan)
  const overscanEnd = Math.min(totalRows - 1, endIndex + overscan)

  // Build virtual rows
  const virtualRows: VirtualRow[] = []

  if (isFixedHeight) {
    const fixedH = rowHeight as number
    for (let i = overscanStart; i <= overscanEnd; i++) {
      virtualRows.push({
        index: i,
        start: i * fixedH,
        size: fixedH,
      })
    }
  } else {
    // Compute start offset for overscanStart
    let offset = 0
    for (let i = 0; i < overscanStart; i++) {
      offset += getRowHeight(i)
    }
    for (let i = overscanStart; i <= overscanEnd; i++) {
      const h = getRowHeight(i)
      virtualRows.push({
        index: i,
        start: offset,
        size: h,
      })
      offset += h
    }
  }

  return {
    virtualRows,
    totalHeight,
    startIndex: overscanStart,
    endIndex: overscanEnd,
    scrollTo,
  }
}
