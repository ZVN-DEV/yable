// @zvndev/yable-react — Smart column width v3: async re-measure.
//
// Drives the real `useAutoColumnSizing` hook against a real core table, with the
// measurement canvas stubbed (jsdom has no 2D context) so the full trigger →
// measure → write pipeline actually runs. Proves that when the row DATA
// reference changes identity (an async value merge), an auto column re-sizes to
// the wider content, while an externally-set (user/persisted) width is left
// untouched. Also proves `table.remeasureColumns()` forces an immediate pass.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createTable, createColumnHelper } from '@zvndev/yable-core'
import type { Column, Table } from '@zvndev/yable-core'
import { useAutoColumnSizing } from '../useAutoColumnSizing'

interface DataRow {
  id: number
  name: string
  amount: string
}

const columnHelper = createColumnHelper<DataRow>()
const columns = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('amount', { header: 'Amount' }),
]

// Deterministic measurer: 8px per character, font-agnostic.
function stubCanvas(): void {
  const ctx = {
    font: '',
    measureText: (text: string) => ({ width: text.length * 8 }),
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
}

function makeMeasureNode(width: number): { current: HTMLElement } {
  const node = document.createElement('div')
  Object.defineProperty(node, 'clientWidth', { value: width, configurable: true })
  return { current: node }
}

function makeTable(data: DataRow[]): Table<DataRow> {
  return createTable<DataRow>({ data, columns, getRowId: (r) => String(r.id) })
}

function widthOf(table: Table<DataRow>, id: string): number | undefined {
  return table.getState().columnSizing[id]
}

const placeholder: DataRow[] = [
  { id: 1, name: 'A', amount: '-' },
  { id: 2, name: 'B', amount: '-' },
]
// Same rows, wide values merged in later (new array identity).
const merged: DataRow[] = [
  { id: 1, name: 'A', amount: '$1,234,567.00' },
  { id: 2, name: 'B', amount: '$9,999,999.00' },
]

describe('useAutoColumnSizing — async re-measure', () => {
  beforeEach(() => {
    stubCanvas()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function renderSizing(table: Table<DataRow>, measureRef: { current: HTMLElement }) {
    const signature = () => `name,amount|${table.getRowModel().rows.length}`
    return renderHook(
      (props: { sig: string }) =>
        useAutoColumnSizing({
          table,
          columns: table.getVisibleLeafColumns() as Column<DataRow, unknown>[],
          measureRef,
          enabled: true,
          config: { underflow: 'leave' },
          isVirtualized: false,
          signature: props.sig,
        }),
      { initialProps: { sig: signature() } },
    )
  }

  it('re-measures on data-identity change (debounced) and widens the auto column', () => {
    const table = makeTable(placeholder)
    const measureRef = makeMeasureNode(2000)
    const { rerender } = renderSizing(table, measureRef)

    // Initial pass sized `amount` on the '-' placeholder.
    const before = widthOf(table, 'amount')
    expect(before).toBeGreaterThan(0)

    // Async merge: same rows, wider values, NEW array identity.
    act(() => {
      table.setOptions((prev) => ({ ...prev, data: merged }))
    })
    // Rerender so the hook re-reads `table.options.data`, then flush debounce.
    act(() => {
      rerender({ sig: `name,amount|${merged.length}` })
    })
    act(() => {
      vi.advanceTimersByTime(60)
    })

    const after = widthOf(table, 'amount')
    expect(after).toBeGreaterThan(before!)
  })

  it('leaves an externally-set (user/persisted) width untouched across re-measure', () => {
    const table = makeTable(placeholder)
    // Simulate a user-resized / persisted width the hook never wrote.
    act(() => {
      table.setColumnSizing({ name: 400 })
    })
    const measureRef = makeMeasureNode(2000)
    const { rerender } = renderSizing(table, measureRef)

    expect(widthOf(table, 'name')).toBe(400)

    act(() => {
      table.setOptions((prev) => ({ ...prev, data: merged }))
    })
    act(() => {
      rerender({ sig: `name,amount|${merged.length}` })
    })
    act(() => {
      vi.advanceTimersByTime(60)
    })

    // Provenance rule: the externally-set width is never overwritten…
    expect(widthOf(table, 'name')).toBe(400)
    // …while the auto column still re-measured to the wider content.
    expect(widthOf(table, 'amount')).toBeGreaterThan(0)
  })

  it('table.remeasureColumns() forces an immediate re-measure (no debounce needed)', () => {
    const table = makeTable(placeholder)
    const measureRef = makeMeasureNode(2000)
    renderSizing(table, measureRef)

    const before = widthOf(table, 'amount')

    // Merge values WITHOUT changing the data reference the hook watches, then
    // call the explicit escape hatch — it should re-measure right away.
    merged.forEach((row, i) => {
      placeholder[i]!.amount = row.amount
    })
    act(() => {
      table.remeasureColumns('async-merge-done')
    })

    const after = widthOf(table, 'amount')
    expect(after).toBeGreaterThan(before!)

    // Restore shared fixture.
    placeholder[0]!.amount = '-'
    placeholder[1]!.amount = '-'
  })
})
