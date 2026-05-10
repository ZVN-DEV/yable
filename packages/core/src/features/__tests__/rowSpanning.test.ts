// @zvndev/yable-core — Row Spanning Tests

import { describe, it, expect, vi } from 'vitest'
import { resolveRowSpans, getRowSpan, isCellSpanned } from '../rowSpanning'
import type { RowSpanMap, RowSpanFn } from '../rowSpanning'
import type { RowData, Row, ColumnDef } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create minimal mock rows */
function mockRows(count: number): Row<RowData>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `row_${i}`,
    index: i,
    getValue: () => `val_${i}`,
  })) as unknown as Row<RowData>[]
}

type ColDefWithSpan = ColumnDef<RowData, unknown> & { rowSpan?: RowSpanFn<RowData> }

// ===========================================================================
// resolveRowSpans
// ===========================================================================

describe('resolveRowSpans', () => {
  it('should create span map with rowSpan > 1', () => {
    const rows = mockRows(4)
    const colDefs = [
      {
        id: 'name',
        rowSpan: (_row: Row<RowData>, _rows: Row<RowData>[], rowIndex: number) =>
          rowIndex === 0 ? 2 : 1,
      },
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])

    // Row 0 should span 2
    expect(getRowSpan(map, 0, 'name')).toBe(2)
    // Row 1 should be consumed (0 = skip)
    expect(getRowSpan(map, 1, 'name')).toBe(0)
    // Row 2 should have no entry (normal)
    expect(getRowSpan(map, 2, 'name')).toBeUndefined()
  })

  it('should clamp span to remaining rows', () => {
    const rows = mockRows(3)
    const colDefs = [
      {
        id: 'name',
        // Try to span 10 starting from row 1 — only 2 rows remain
        rowSpan: (_row: Row<RowData>, _rows: Row<RowData>[], rowIndex: number) =>
          rowIndex === 1 ? 10 : 1,
      },
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])

    // Should be clamped to 2 (rows 1 and 2)
    expect(getRowSpan(map, 1, 'name')).toBe(2)
    expect(getRowSpan(map, 2, 'name')).toBe(0)
  })

  it('should treat span of 1 as normal (no map entry)', () => {
    const rows = mockRows(3)
    const colDefs = [
      {
        id: 'name',
        rowSpan: () => 1,
      },
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])
    expect(map.size).toBe(0)
  })

  it('should treat span of 0 or negative as 1 (clamped)', () => {
    const rows = mockRows(3)
    const colDefs = [
      {
        id: 'name',
        rowSpan: (_row: Row<RowData>, _rows: Row<RowData>[], rowIndex: number) =>
          rowIndex === 0 ? 0 : -1,
      },
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])
    // 0 and -1 both clamp to 1, so no span entries
    expect(map.size).toBe(0)
  })

  it('should handle multiple columns with different spans', () => {
    const rows = mockRows(4)
    const colDefs = [
      {
        id: 'col_a',
        rowSpan: (_row: Row<RowData>, _rows: Row<RowData>[], rowIndex: number) =>
          rowIndex === 0 ? 2 : 1,
      },
      {
        id: 'col_b',
        rowSpan: (_row: Row<RowData>, _rows: Row<RowData>[], rowIndex: number) =>
          rowIndex === 0 ? 3 : 1,
      },
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])

    expect(getRowSpan(map, 0, 'col_a')).toBe(2)
    expect(getRowSpan(map, 1, 'col_a')).toBe(0)
    expect(getRowSpan(map, 2, 'col_a')).toBeUndefined()

    expect(getRowSpan(map, 0, 'col_b')).toBe(3)
    expect(getRowSpan(map, 1, 'col_b')).toBe(0)
    expect(getRowSpan(map, 2, 'col_b')).toBe(0)
    expect(getRowSpan(map, 3, 'col_b')).toBeUndefined()
  })

  it('should handle empty rows array', () => {
    const colDefs = [
      {
        id: 'name',
        rowSpan: () => 2,
      },
    ]

    const map = resolveRowSpans([], colDefs as ColDefWithSpan[])
    expect(map.size).toBe(0)
  })

  it('should skip columns without rowSpan callback', () => {
    const rows = mockRows(3)
    const colDefs = [
      { id: 'name' }, // No rowSpan
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])
    expect(map.size).toBe(0)
  })

  it('should use accessorKey as fallback column id', () => {
    const rows = mockRows(3)
    const colDefs = [
      {
        accessorKey: 'status',
        rowSpan: (_row: Row<RowData>, _rows: Row<RowData>[], rowIndex: number) =>
          rowIndex === 0 ? 2 : 1,
      },
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])
    expect(getRowSpan(map, 0, 'status')).toBe(2)
  })

  it('should recover safely when rowSpan callback throws', () => {
    const rows = mockRows(2)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const colDefs = [
      {
        id: 'name',
        rowSpan: () => {
          throw new Error('boom')
        },
      },
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])

    expect(map.size).toBe(0)
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })
})

// ===========================================================================
// Query Helpers
// ===========================================================================

describe('isCellSpanned', () => {
  it('should return true for consumed cells (span = 0)', () => {
    const rows = mockRows(3)
    const colDefs = [
      {
        id: 'name',
        rowSpan: (_row: Row<RowData>, _rows: Row<RowData>[], rowIndex: number) =>
          rowIndex === 0 ? 3 : 1,
      },
    ]

    const map = resolveRowSpans(rows, colDefs as ColDefWithSpan[])

    expect(isCellSpanned(map, 0, 'name')).toBe(false) // span origin
    expect(isCellSpanned(map, 1, 'name')).toBe(true) // consumed
    expect(isCellSpanned(map, 2, 'name')).toBe(true) // consumed
  })

  it('should return false for cells without span entries', () => {
    const map: RowSpanMap = new Map()
    expect(isCellSpanned(map, 0, 'name')).toBe(false)
  })
})
