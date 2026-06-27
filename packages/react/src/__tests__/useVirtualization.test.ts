// @zvndev/yable-react — useVirtualization hook tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVirtualization } from '../hooks/useVirtualization'
import type { UseVirtualizationOptions } from '../hooks/useVirtualization'

// ---------------------------------------------------------------------------
// Mock rAF so scroll handlers fire synchronously
// ---------------------------------------------------------------------------

const originalRaf = globalThis.requestAnimationFrame
const originalCancelRaf = globalThis.cancelAnimationFrame

beforeEach(() => {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  }
  globalThis.cancelAnimationFrame = () => {}
})

afterEach(() => {
  globalThis.requestAnimationFrame = originalRaf
  globalThis.cancelAnimationFrame = originalCancelRaf
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a fake container element with configurable scroll/size properties.
 */
function createMockContainer(opts: { clientHeight: number; scrollTop?: number }) {
  const el = document.createElement('div')

  let _scrollTop = opts.scrollTop ?? 0

  Object.defineProperty(el, 'clientHeight', {
    configurable: true,
    get: () => opts.clientHeight,
  })

  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => _scrollTop,
    set: (v: number) => {
      _scrollTop = v
    },
  })

  return {
    el,
    getScrollTop: () => _scrollTop,
    setScrollTop: (v: number) => {
      _scrollTop = v
    },
  }
}

/**
 * Renders the hook with a mock container already wired up.
 */
function renderVirtualization(
  overrides: Partial<UseVirtualizationOptions> & {
    clientHeight?: number
    scrollTop?: number
  } = {},
) {
  const { clientHeight = 400, scrollTop = 0, ...rest } = overrides
  const mock = createMockContainer({ clientHeight, scrollTop })
  const ref = { current: mock.el }

  const opts: UseVirtualizationOptions = {
    containerRef: ref,
    totalRows: 100,
    rowHeight: 40,
    overscan: 5,
    ...rest,
  }

  const hookResult = renderHook((props: UseVirtualizationOptions) => useVirtualization(props), {
    initialProps: opts,
  })

  return { ...hookResult, mock, ref, opts }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useVirtualization', () => {
  // ---- Fixed height mode ----

  describe('fixed-height mode', () => {
    it('returns correct virtualRows for a basic fixed-height setup', () => {
      // 100 rows, 40px each, container 400px high -> 10 visible rows
      // With overscan 5, we should see rows 0-14 (start 0, overscan pushes end to 14)
      const { result } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
        clientHeight: 400,
        overscan: 5,
      })

      // Should have visible rows plus overscan
      expect(result.current.virtualRows.length).toBeGreaterThan(0)
      // First row should start at index 0
      expect(result.current.virtualRows[0]!.index).toBe(0)
      // Each row should be 40px
      for (const vr of result.current.virtualRows) {
        expect(vr.size).toBe(40)
        expect(vr.start).toBe(vr.index * 40)
      }
    })

    it('returns correct totalHeight (totalRows * rowHeight)', () => {
      const { result } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
      })
      expect(result.current.totalHeight).toBe(4000) // 100 * 40
    })

    it('overscan adds extra rows above and below visible range', () => {
      const { result } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
        clientHeight: 400,
        overscan: 3,
      })

      // With scrollTop 0: visible is rows 0-9, overscan adds 3 below -> 0-12
      // overscan above is clamped at 0
      const firstIndex = result.current.virtualRows[0]!.index
      const lastIndex = result.current.virtualRows[result.current.virtualRows.length - 1]!.index

      expect(firstIndex).toBe(0)
      // visible end = ceil((0 + 400) / 40) - 1 = 9, plus overscan 3 = 12
      expect(lastIndex).toBe(12)
    })

    it('returns correct startIndex and endIndex including overscan', () => {
      const { result } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
        clientHeight: 400,
        overscan: 5,
      })

      expect(result.current.startIndex).toBe(0)
      // visible end = 9, + overscan 5 = 14
      expect(result.current.endIndex).toBe(14)
    })

    it('scrollTo sets the container scrollTop for fixed-height rows', () => {
      const { result, mock } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
      })

      act(() => {
        result.current.scrollTo(10)
      })

      expect(mock.getScrollTop()).toBe(400) // 10 * 40
    })

    it('scrollTo clamps to valid range', () => {
      const { result, mock } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
      })

      act(() => {
        result.current.scrollTo(-5)
      })
      expect(mock.getScrollTop()).toBe(0)

      act(() => {
        result.current.scrollTo(999)
      })
      expect(mock.getScrollTop()).toBe(99 * 40) // clamps to totalRows - 1
    })
  })

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('handles 0 rows — returns empty virtualRows and totalHeight 0', () => {
      const { result } = renderVirtualization({ totalRows: 0 })

      expect(result.current.virtualRows).toEqual([])
      expect(result.current.totalHeight).toBe(0)
      expect(result.current.startIndex).toBe(0)
      expect(result.current.endIndex).toBe(0)
    })

    it('measures the container when rows arrive after an empty initial render', () => {
      const { result, rerender, ref } = renderVirtualization({
        totalRows: 0,
        rowHeight: 42,
        clientHeight: 420,
        overscan: 2,
      })

      expect(result.current.virtualRows).toEqual([])

      rerender({
        containerRef: ref,
        totalRows: 100,
        rowHeight: 42,
        overscan: 2,
      })

      expect(result.current.virtualRows.length).toBeGreaterThan(0)
      expect(result.current.virtualRows[0]!.index).toBe(0)
    })

    it('handles 1 row', () => {
      const { result } = renderVirtualization({
        totalRows: 1,
        rowHeight: 40,
        clientHeight: 400,
        overscan: 5,
      })

      expect(result.current.virtualRows.length).toBe(1)
      expect(result.current.virtualRows[0]).toEqual({
        index: 0,
        start: 0,
        size: 40,
      })
      expect(result.current.totalHeight).toBe(40)
    })

    it('handles container not yet measured (clientHeight 0) — returns empty virtualRows', () => {
      const { result } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
        clientHeight: 0,
      })

      expect(result.current.virtualRows).toEqual([])
      expect(result.current.totalHeight).toBe(4000) // totalHeight is still computed
      expect(result.current.startIndex).toBe(0)
      expect(result.current.endIndex).toBe(0)
    })

    it('handles null containerRef', () => {
      const ref = { current: null }
      const { result } = renderHook(() =>
        useVirtualization({
          containerRef: ref,
          totalRows: 100,
          rowHeight: 40,
        }),
      )

      // With no container, containerHeight is 0 — so empty virtualRows
      expect(result.current.virtualRows).toEqual([])
      expect(result.current.totalHeight).toBe(4000)
    })

    it('scrollTo with 0 rows does nothing', () => {
      const { result, mock } = renderVirtualization({ totalRows: 0 })

      act(() => {
        result.current.scrollTo(5)
      })
      // Should not throw
      expect(mock.getScrollTop()).toBe(0)
    })
  })

  // ---- Scroll position changes ----

  describe('scroll position changes', () => {
    it('updates virtualRows when scroll position changes', () => {
      const { result, mock, ref } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
        clientHeight: 400,
        overscan: 0,
      })

      // Initially at scrollTop 0: rows 0-9
      expect(result.current.virtualRows[0]!.index).toBe(0)

      // Scroll down to row 20
      act(() => {
        mock.setScrollTop(800) // 20 * 40
        ref.current!.dispatchEvent(new Event('scroll'))
      })

      // With scroll at 800, visible rows: floor(800/40)=20 to ceil(1200/40)-1=29
      expect(result.current.virtualRows[0]!.index).toBe(20)
      expect(result.current.virtualRows[result.current.virtualRows.length - 1]!.index).toBe(29)
    })

    it('overscan works correctly with scrolled position', () => {
      const { result, mock, ref } = renderVirtualization({
        totalRows: 100,
        rowHeight: 40,
        clientHeight: 400,
        overscan: 3,
      })

      // Scroll to row 20
      act(() => {
        mock.setScrollTop(800)
        ref.current!.dispatchEvent(new Event('scroll'))
      })

      // visible: 20-29, overscan 3: 17-32
      expect(result.current.startIndex).toBe(17)
      expect(result.current.endIndex).toBe(32)
    })

    it('overscan is clamped at boundaries', () => {
      const { result } = renderVirtualization({
        totalRows: 10,
        rowHeight: 40,
        clientHeight: 400,
        overscan: 20,
      })

      // All 10 rows visible, overscan 20 is clamped to [0, 9]
      expect(result.current.startIndex).toBe(0)
      expect(result.current.endIndex).toBe(9)
    })
  })

  // ---- Variable height mode ----

  describe('variable-height mode (function rowHeight)', () => {
    it('computes totalHeight from variable row heights', () => {
      // Even rows 30px, odd rows 50px
      const rowHeightFn = (index: number) => (index % 2 === 0 ? 30 : 50)

      const { result } = renderVirtualization({
        totalRows: 10,
        rowHeight: rowHeightFn,
        clientHeight: 200,
        overscan: 0,
      })

      // 5 even (30) + 5 odd (50) = 150 + 250 = 400
      expect(result.current.totalHeight).toBe(400)
    })

    it('returns correct virtualRows with variable heights', () => {
      const rowHeightFn = (index: number) => (index % 2 === 0 ? 30 : 50)

      const { result } = renderVirtualization({
        totalRows: 10,
        rowHeight: rowHeightFn,
        clientHeight: 200,
        overscan: 0,
      })

      // Verify row positions: 0->0, 1->30, 2->80, 3->110, 4->160, 5->210, ...
      const rows = result.current.virtualRows
      expect(rows.length).toBeGreaterThan(0)

      // Check first few rows
      const row0 = rows.find((r) => r.index === 0)
      const row1 = rows.find((r) => r.index === 1)
      const row2 = rows.find((r) => r.index === 2)

      if (row0) {
        expect(row0.start).toBe(0)
        expect(row0.size).toBe(30)
      }
      if (row1) {
        expect(row1.start).toBe(30)
        expect(row1.size).toBe(50)
      }
      if (row2) {
        expect(row2.start).toBe(80)
        expect(row2.size).toBe(30)
      }
    })

    it('scrollTo accumulates variable heights', () => {
      const rowHeightFn = (index: number) => (index % 2 === 0 ? 30 : 50)

      const { result, mock } = renderVirtualization({
        totalRows: 10,
        rowHeight: rowHeightFn,
      })

      act(() => {
        result.current.scrollTo(3)
      })

      // offset = 30 + 50 + 30 = 110
      expect(mock.getScrollTop()).toBe(110)
    })
  })

  // ---- Pretext heights mode ----

  describe('pretext heights mode', () => {
    it('uses pretext heights for totalHeight', () => {
      // 5 rows with heights [20, 30, 40, 50, 60]
      const pretextHeights = new Float64Array([20, 30, 40, 50, 60])
      // Prefix sums: [0, 20, 50, 90, 140, 200]
      const pretextPrefixSums = new Float64Array([0, 20, 50, 90, 140, 200])

      const { result } = renderVirtualization({
        totalRows: 5,
        pretextHeights,
        pretextPrefixSums,
        clientHeight: 100,
        overscan: 0,
      })

      expect(result.current.totalHeight).toBe(200) // prefixSums[5]
    })

    it('uses binary search to find visible rows from pretext prefix sums', () => {
      // 10 rows, each 40px
      const heights = new Float64Array(10).fill(40)
      const prefixSums = new Float64Array(11)
      for (let i = 0; i < 10; i++) {
        prefixSums[i + 1] = prefixSums[i]! + heights[i]!
      }

      const { result } = renderVirtualization({
        totalRows: 10,
        pretextHeights: heights,
        pretextPrefixSums: prefixSums,
        clientHeight: 160, // shows 4 rows
        overscan: 0,
      })

      expect(result.current.virtualRows.length).toBeGreaterThanOrEqual(4)
      expect(result.current.virtualRows[0]!.index).toBe(0)
    })

    it('returns correct virtual row positions from pretext data', () => {
      const pretextHeights = new Float64Array([20, 30, 40, 50, 60])
      const pretextPrefixSums = new Float64Array([0, 20, 50, 90, 140, 200])

      const { result } = renderVirtualization({
        totalRows: 5,
        pretextHeights,
        pretextPrefixSums,
        clientHeight: 200,
        overscan: 0,
      })

      // All rows should be visible since container (200) == totalHeight (200)
      for (const vr of result.current.virtualRows) {
        expect(vr.start).toBe(pretextPrefixSums[vr.index])
        expect(vr.size).toBe(pretextHeights[vr.index])
      }
    })

    it('scrollTo uses prefix sums for instant offset', () => {
      const pretextHeights = new Float64Array([20, 30, 40, 50, 60])
      const pretextPrefixSums = new Float64Array([0, 20, 50, 90, 140, 200])

      const { result, mock } = renderVirtualization({
        totalRows: 5,
        pretextHeights,
        pretextPrefixSums,
      })

      act(() => {
        result.current.scrollTo(3)
      })

      expect(mock.getScrollTop()).toBe(90) // prefixSums[3]
    })

    it('ignores pretext heights when array is too short for totalRows', () => {
      // Only 3 heights but 5 rows — should fall back to fixed height
      const pretextHeights = new Float64Array([20, 30, 40])
      const pretextPrefixSums = new Float64Array([0, 20, 50, 90])

      const { result } = renderVirtualization({
        totalRows: 5,
        rowHeight: 40,
        pretextHeights,
        pretextPrefixSums,
        clientHeight: 400,
      })

      // Should use fixed height fallback: 5 * 40 = 200
      expect(result.current.totalHeight).toBe(200)
    })
  })

  // ---- ResizeObserver ----

  describe('ResizeObserver integration', () => {
    it('observes the container for resize', () => {
      const observeSpy = vi.fn()
      const disconnectSpy = vi.fn()

      vi.stubGlobal(
        'ResizeObserver',
        class MockResizeObserver {
          constructor(public callback: ResizeObserverCallback) {}
          observe = observeSpy
          unobserve = vi.fn()
          disconnect = disconnectSpy
        },
      )

      const { unmount, ref } = renderVirtualization()

      expect(observeSpy).toHaveBeenCalledWith(ref.current)

      unmount()

      expect(disconnectSpy).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })
  })
})
