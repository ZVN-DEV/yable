// @zvndev/yable-react — useColumnVirtualization hook tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnVirtualization } from '../hooks/useColumnVirtualization'
import type {
  UseColumnVirtualizationOptions,
  UseColumnVirtualizationResult,
} from '../hooks/useColumnVirtualization'
import type { Column, RowData } from '@zvndev/yable-core'

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

type TestRow = Record<string, unknown>

/** Creates a minimal Column mock with just `id` and `getSize`. */
function mockColumn(id: string, size: number): Column<TestRow, unknown> {
  return {
    id,
    getSize: () => size,
    columnDef: { header: id },
  } as unknown as Column<TestRow, unknown>
}

/** Creates a mock container element with configurable scroll/size props. */
function createMockContainer(opts: { clientWidth: number; scrollLeft?: number }) {
  const el = document.createElement('div')
  let _scrollLeft = opts.scrollLeft ?? 0

  Object.defineProperty(el, 'clientWidth', {
    configurable: true,
    get: () => opts.clientWidth,
  })

  Object.defineProperty(el, 'scrollLeft', {
    configurable: true,
    get: () => _scrollLeft,
    set: (v: number) => {
      _scrollLeft = v
    },
  })

  return {
    el,
    getScrollLeft: () => _scrollLeft,
    setScrollLeft: (v: number) => {
      _scrollLeft = v
    },
  }
}

function renderColumnVirtualization(
  overrides: Partial<UseColumnVirtualizationOptions<TestRow>> & {
    clientWidth?: number
    scrollLeft?: number
    columnCount?: number
    columnSize?: number
  } = {},
) {
  const {
    clientWidth = 300,
    scrollLeft = 0,
    columnCount = 12,
    columnSize = 120,
    ...rest
  } = overrides

  const mock = createMockContainer({ clientWidth, scrollLeft })
  const ref = { current: mock.el }
  const columns =
    rest.columns ??
    Array.from({ length: columnCount }, (_, i) => mockColumn(`col-${i}`, columnSize))

  const opts: UseColumnVirtualizationOptions<TestRow> = {
    containerRef: ref,
    columns,
    overscan: 2,
    enabled: true,
    ...rest,
  }

  const hookResult = renderHook(
    (props: UseColumnVirtualizationOptions<TestRow>) => useColumnVirtualization(props),
    { initialProps: opts },
  )

  return { ...hookResult, mock, ref, columns, opts }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useColumnVirtualization', () => {
  describe('basic virtualization', () => {
    it('returns visible columns for a given scroll position', () => {
      // 12 columns x 120px = 1440px total. Container 300px wide.
      // At scrollLeft 0: visible cols 0-2, overscan 2 -> cols 0-4
      const { result } = renderColumnVirtualization()

      // Trigger scroll to initialize
      act(() => {
        // Already at scrollLeft 0 — just trigger the scroll event
      })

      expect(result.current.isVirtualized).toBe(true)
      expect(result.current.totalWidth).toBe(1440) // 12 * 120

      // All virtual columns should have correct start offsets
      for (const vc of result.current.virtualColumns) {
        expect(vc.start).toBe(vc.index * 120)
        expect(vc.size).toBe(120)
      }
    })

    it('computes totalWidth correctly', () => {
      const columns = [mockColumn('a', 100), mockColumn('b', 150), mockColumn('c', 200)]

      const { result } = renderColumnVirtualization({
        columns,
        clientWidth: 300,
      })

      expect(result.current.totalWidth).toBe(450) // 100 + 150 + 200
    })

    it('includes overscan columns on both sides', () => {
      // 12 cols x 120px, container 300px, overscan 2
      const { result, mock, ref } = renderColumnVirtualization({
        overscan: 2,
        clientWidth: 300,
      })

      // Scroll to the middle so overscan applies on both sides
      act(() => {
        mock.setScrollLeft(480) // col 4 starts here
        ref.current!.dispatchEvent(new Event('scroll'))
      })

      // Visible: cols 4-6 (480 to 780), overscan 2 each side: 2-8
      const indices = result.current.virtualColumns.map((vc) => vc.index)
      expect(indices[0]).toBeLessThanOrEqual(4) // overscan before
      expect(indices[indices.length - 1]!).toBeGreaterThanOrEqual(6) // overscan after
    })

    it('clamps overscan at boundaries', () => {
      const { result } = renderColumnVirtualization({
        overscan: 50,
        columnCount: 5,
        columnSize: 120,
        clientWidth: 300,
      })

      // All 5 columns should be included — overscan clamped to [0, 4]
      expect(result.current.virtualColumns.length).toBe(5)
      expect(result.current.startIndex).toBe(0)
      expect(result.current.endIndex).toBe(4)
    })
  })

  describe('disabled mode', () => {
    it('returns all columns when enabled is false', () => {
      const { result } = renderColumnVirtualization({
        enabled: false,
        columnCount: 12,
      })

      expect(result.current.isVirtualized).toBe(false)
      expect(result.current.virtualColumns.length).toBe(12)
      expect(result.current.startIndex).toBe(0)
      expect(result.current.endIndex).toBe(11)
    })
  })

  describe('edge cases', () => {
    it('handles 0 columns', () => {
      const { result } = renderColumnVirtualization({
        columns: [],
      })

      expect(result.current.virtualColumns).toEqual([])
      expect(result.current.totalWidth).toBe(0)
      expect(result.current.isVirtualized).toBe(false)
    })

    it('handles 1 column', () => {
      const columns = [mockColumn('only', 120)]
      const { result } = renderColumnVirtualization({
        columns,
        clientWidth: 300,
      })

      expect(result.current.virtualColumns.length).toBe(1)
      expect(result.current.virtualColumns[0]!.column.id).toBe('only')
      expect(result.current.totalWidth).toBe(120)
    })

    it('does not virtualize when total width fits in container', () => {
      // 3 cols x 80px = 240px total, container 300px — no need to virtualize
      const { result } = renderColumnVirtualization({
        columnCount: 3,
        columnSize: 80,
        clientWidth: 300,
      })

      expect(result.current.isVirtualized).toBe(false)
      expect(result.current.virtualColumns.length).toBe(3)
    })

    it('does not virtualize when containerWidth is 0', () => {
      const { result } = renderColumnVirtualization({
        clientWidth: 0,
        columnCount: 12,
      })

      // containerWidth 0 => returns all columns, not virtualized
      expect(result.current.isVirtualized).toBe(false)
      expect(result.current.virtualColumns.length).toBe(12)
    })
  })

  describe('scrollToIndex', () => {
    it('sets scrollLeft to the column offset', () => {
      const { result, mock } = renderColumnVirtualization({
        columnCount: 10,
        columnSize: 100,
        clientWidth: 300,
      })

      act(() => {
        result.current.scrollToIndex(5)
      })

      expect(mock.getScrollLeft()).toBe(500) // 5 * 100
    })

    it('clamps to valid column range', () => {
      const { result, mock } = renderColumnVirtualization({
        columnCount: 10,
        columnSize: 100,
        clientWidth: 300,
      })

      act(() => {
        result.current.scrollToIndex(-3)
      })
      expect(mock.getScrollLeft()).toBe(0)

      act(() => {
        result.current.scrollToIndex(999)
      })
      expect(mock.getScrollLeft()).toBe(900) // last column offset: 9 * 100
    })

    it('does nothing with empty columns', () => {
      const { result, mock } = renderColumnVirtualization({
        columns: [],
      })

      act(() => {
        result.current.scrollToIndex(5)
      })
      expect(mock.getScrollLeft()).toBe(0)
    })
  })

  describe('variable column widths', () => {
    it('handles columns with different widths correctly', () => {
      const columns = [
        mockColumn('narrow', 50),
        mockColumn('medium', 120),
        mockColumn('wide', 300),
        mockColumn('small', 80),
        mockColumn('large', 250),
      ]

      const { result } = renderColumnVirtualization({
        columns,
        clientWidth: 200,
      })

      expect(result.current.totalWidth).toBe(800) // 50 + 120 + 300 + 80 + 250

      // Verify start offsets are cumulative
      const offsets = result.current.virtualColumns.map((vc) => vc.start)
      const expectedOffsets = [0, 50, 170, 470, 550]

      for (const vc of result.current.virtualColumns) {
        expect(vc.start).toBe(expectedOffsets[vc.index])
      }
    })
  })

  describe('scroll updates', () => {
    it('updates visible columns after scroll', () => {
      const { result, mock, ref } = renderColumnVirtualization({
        columnCount: 20,
        columnSize: 100,
        clientWidth: 300,
        overscan: 0,
      })

      // Scroll to column 10
      act(() => {
        mock.setScrollLeft(1000)
        ref.current!.dispatchEvent(new Event('scroll'))
      })

      // Visible columns should be around index 10-12
      const indices = result.current.virtualColumns.map((vc) => vc.index)
      expect(indices).toContain(10)
      expect(indices).toContain(11)
      expect(indices).toContain(12)
      expect(indices).not.toContain(0) // should not include first column
    })
  })

  describe('offset calculations', () => {
    it('returns correct startOffset and endOffset for spacer rendering', () => {
      const { result, mock, ref } = renderColumnVirtualization({
        columnCount: 20,
        columnSize: 100,
        clientWidth: 300,
        overscan: 1,
      })

      // Scroll to middle
      act(() => {
        mock.setScrollLeft(800)
        ref.current!.dispatchEvent(new Event('scroll'))
      })

      // startOffset should be the left edge of the first virtual column
      // endOffset should be totalWidth minus the right edge of the last virtual column
      const firstVC = result.current.virtualColumns[0]!
      const lastVC = result.current.virtualColumns[result.current.virtualColumns.length - 1]!

      expect(result.current.startOffset).toBe(firstVC.start)
      expect(result.current.endOffset).toBe(
        result.current.totalWidth - (lastVC.start + lastVC.size),
      )
    })
  })
})
