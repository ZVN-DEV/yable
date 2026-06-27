// @zvndev/yable-react — Row virtualization hook

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
  /** Pre-computed row heights from Pretext measurement (Float64Array indexed by row) */
  pretextHeights?: Float64Array | null
  /** Pre-computed prefix sums for O(log n) scroll lookups */
  pretextPrefixSums?: Float64Array | null
  /**
   * Opaque key that changes when column widths change.
   * When this value changes the height cache is invalidated because column
   * resizing can affect text wrapping and therefore row heights.
   */
  columnSizingHash?: string | number
}

export interface UseVirtualizationResult {
  virtualRows: VirtualRow[]
  totalHeight: number
  startIndex: number
  endIndex: number
  scrollTo: (index: number) => void
  /**
   * Manually clear the row-height cache and force recalculation.
   * Call this when cell content changes (data mutations, font-size changes, etc.)
   * that may affect row heights.
   */
  invalidateRowHeights: () => void
}

const EMPTY_RESULT: Omit<UseVirtualizationResult, 'scrollTo' | 'invalidateRowHeights'> = {
  virtualRows: [],
  totalHeight: 0,
  startIndex: 0,
  endIndex: 0,
}

/**
 * Computes which rows are visible in a scrollable container and returns
 * positioning data so only those rows (plus an overscan buffer) are rendered.
 *
 * Returns `{ virtualRows, totalHeight, startIndex, endIndex, scrollTo, invalidateRowHeights }`.
 * Re-renders are triggered by scroll (rAF-throttled) and ResizeObserver
 * container resize. Supports fixed, variable, and Pretext-pre-measured heights.
 *
 * The height cache is automatically invalidated when `totalRows`, `isFixedHeight`,
 * or `columnSizingHash` changes. For manual invalidation (e.g. after data mutations
 * or font-size changes), call `invalidateRowHeights()`.
 */
export function useVirtualization({
  containerRef,
  totalRows,
  rowHeight = 40,
  overscan = 5,
  estimateRowHeight: _estimateRowHeight,
  pretextHeights,
  pretextPrefixSums,
  columnSizingHash,
}: UseVirtualizationOptions): UseVirtualizationResult {
  const hasPretextHeights = !!(
    pretextHeights &&
    pretextPrefixSums &&
    pretextHeights.length >= totalRows
  )
  const isFixedHeight = typeof rowHeight === 'number' && !hasPretextHeights

  // Cache for variable row heights (index -> measured or estimated size)
  const heightCacheRef = useRef<Map<number, number>>(new Map())

  // Monotonic version counter — incremented on every cache invalidation to
  // force dependents (totalHeight, virtualRows) to recompute.
  const heightCacheVersionRef = useRef(0)
  const [heightCacheVersion, setHeightCacheVersion] = useState(0)

  const getRowHeight = useCallback(
    (index: number): number => {
      // Pretext heights take priority — exact pixel values.
      // Safe: hasPretextHeights verified pretextHeights.length >= totalRows and index < totalRows
      if (hasPretextHeights) return pretextHeights![index]!
      if (isFixedHeight) return rowHeight as number
      // Check cache first
      const cached = heightCacheRef.current.get(index)
      if (cached !== undefined) return cached
      // Use the rowHeight function if provided
      const height = (rowHeight as (index: number) => number)(index)
      heightCacheRef.current.set(index, height)
      return height
    },
    // heightCacheVersion forces a new callback identity after cache invalidation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowHeight, isFixedHeight, hasPretextHeights, pretextHeights, heightCacheVersion],
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
  }, [containerRef, totalRows])

  // Clear height cache when totalRows changes significantly
  useEffect(() => {
    if (!isFixedHeight) {
      heightCacheRef.current.clear()
    }
  }, [totalRows, isFixedHeight])

  // Clear height cache when column sizing changes (text wrapping may change row heights)
  useEffect(() => {
    if (!isFixedHeight && columnSizingHash !== undefined) {
      heightCacheRef.current.clear()
      heightCacheVersionRef.current += 1
      setHeightCacheVersion(heightCacheVersionRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSizingHash])

  // Imperative cache invalidation for consumers
  const invalidateRowHeights = useCallback(() => {
    heightCacheRef.current.clear()
    heightCacheVersionRef.current += 1
    setHeightCacheVersion(heightCacheVersionRef.current)
  }, [])

  // scrollTo must be declared before any early returns (rules of hooks)
  const scrollTo = useCallback(
    (index: number) => {
      const container = containerRef.current
      if (!container || totalRows === 0) return
      const clampedIndex = Math.max(0, Math.min(index, totalRows - 1))

      if (hasPretextHeights && pretextPrefixSums!) {
        // Instant: prefix sums give us the exact offset.
        // Safe: hasPretextHeights verified length, clampedIndex < totalRows <= pretextPrefixSums.length
        container.scrollTop = pretextPrefixSums![clampedIndex]!
      } else if (isFixedHeight) {
        container.scrollTop = clampedIndex * (rowHeight as number)
      } else {
        let offset = 0
        for (let i = 0; i < clampedIndex; i++) {
          offset += getRowHeight(i)
        }
        container.scrollTop = offset
      }
    },
    [
      containerRef,
      totalRows,
      rowHeight,
      isFixedHeight,
      getRowHeight,
      hasPretextHeights,
      pretextPrefixSums,
    ],
  )

  // Compute total height — pretext prefix sums give us this for free
  const totalHeight = useMemo(() => {
    if (totalRows === 0) return 0
    // Safe: prefixSums has length data.length + 1, totalRows === data.length, so [totalRows] exists
    if (hasPretextHeights && pretextPrefixSums!) return pretextPrefixSums![totalRows]!
    if (isFixedHeight) return totalRows * (rowHeight as number)
    let total = 0
    for (let i = 0; i < totalRows; i++) {
      total += getRowHeight(i)
    }
    return total
    // heightCacheVersion ensures totalHeight recalculates after cache invalidation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    totalRows,
    rowHeight,
    isFixedHeight,
    getRowHeight,
    hasPretextHeights,
    pretextPrefixSums,
    heightCacheVersion,
  ])

  const { scrollTop, containerHeight } = scrollState

  // Edge case: no rows
  if (totalRows === 0) {
    return { ...EMPTY_RESULT, scrollTo, invalidateRowHeights }
  }

  // Edge case: container not yet measured
  if (containerHeight === 0) {
    return {
      virtualRows: [],
      totalHeight,
      startIndex: 0,
      endIndex: 0,
      scrollTo,
      invalidateRowHeights,
    }
  }

  // Find visible range
  let startIndex = 0
  let endIndex = 0

  if (hasPretextHeights && pretextPrefixSums!) {
    // O(log n) binary search using pre-computed prefix sums
    // Find first row whose bottom edge is past scrollTop
    let lo = 0
    let hi = totalRows - 1
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      // Safe: mid + 1 <= hi + 1 <= totalRows < prefixSums.length (length is data.length + 1)
      if (pretextPrefixSums![mid + 1]! <= scrollTop) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    startIndex = lo

    // Find last row whose top edge is before scrollTop + containerHeight
    const bottomEdge = scrollTop + containerHeight
    lo = startIndex
    hi = totalRows - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1
      // Safe: mid <= hi < totalRows < prefixSums.length
      if (pretextPrefixSums![mid]! < bottomEdge) {
        lo = mid
      } else {
        hi = mid - 1
      }
    }
    endIndex = lo
  } else if (isFixedHeight) {
    const fixedH = rowHeight as number
    startIndex = Math.floor(scrollTop / fixedH)
    endIndex = Math.min(totalRows - 1, Math.ceil((scrollTop + containerHeight) / fixedH) - 1)
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

  if (hasPretextHeights && pretextPrefixSums!) {
    // Fastest path: prefix sums give us start offsets directly.
    // Safe: i in [overscanStart, overscanEnd] ⊆ [0, totalRows - 1] < both arrays' lengths
    for (let i = overscanStart; i <= overscanEnd; i++) {
      virtualRows.push({
        index: i,
        start: pretextPrefixSums![i]!,
        size: pretextHeights![i]!,
      })
    }
  } else if (isFixedHeight) {
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
    invalidateRowHeights,
  }
}
