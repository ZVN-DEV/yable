// The fit target must be the scroll container's clientWidth when provided:
// classic (space-consuming) scrollbars render inside the scroller, so fitting
// to the outer element's width overflows by exactly the scrollbar width and
// shows a phantom horizontal scrollbar on tables that otherwise fit.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutoColumnSizing } from '../useAutoColumnSizing'
import { createTable } from '@zvndev/yable-core'
import type { Table, Column, ColumnDef } from '@zvndev/yable-core'

function stubCanvas() {
  const ctx = {
    measureText: (text: string) => ({ width: text.length * 8 }),
    font: '',
  } as unknown as CanvasRenderingContext2D
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
}

interface DataRow {
  id: number
  name: string
  amount: string
}

const columns: ColumnDef<DataRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'amount', header: 'Amount' },
]

const data: DataRow[] = [
  { id: 1, name: 'Alpha', amount: '$100.00' },
  { id: 2, name: 'Beta', amount: '$200.00' },
]

function makeNode(width: number): { current: HTMLElement } {
  const node = document.createElement('div')
  Object.defineProperty(node, 'clientWidth', { value: width, configurable: true })
  return { current: node }
}

function makeTable(): Table<DataRow> {
  return createTable<DataRow>({ data, columns, getRowId: (r) => String(r.id) })
}

function totalWidth(table: Table<DataRow>): number {
  return table.getVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)
}

describe('useAutoColumnSizing — scrollRegionRef fit target', () => {
  beforeEach(() => stubCanvas())
  afterEach(() => vi.restoreAllMocks())

  function renderSizing(
    table: Table<DataRow>,
    measureRef: { current: HTMLElement },
    scrollRegionRef?: { current: HTMLElement },
  ) {
    return renderHook(() =>
      useAutoColumnSizing({
        table,
        columns: table.getVisibleLeafColumns() as Column<DataRow, unknown>[],
        measureRef,
        scrollRegionRef,
        enabled: true,
        config: { underflow: 'stretch' },
        isVirtualized: false,
        signature: 'name,amount|2',
      }),
    )
  }

  it('fills to the scroll region clientWidth, not the outer element', () => {
    const table = makeTable()
    // Outer 1510, scroller 1499 (11px classic scrollbar / reserved gutter).
    renderSizing(table, makeNode(1510), makeNode(1499))
    expect(totalWidth(table)).toBe(1499)
  })

  it('resolves the row-virtualization scroller by class when no ref is passed', () => {
    const table = makeTable()
    // The surface scroller mounts inside the measured node with a private ref
    // (TableBody), so the hook must find `.yable-virtual-scroll-container`.
    const measureRef = makeNode(1510)
    const scroller = document.createElement('div')
    scroller.className = 'yable-virtual-scroll-container'
    Object.defineProperty(scroller, 'clientWidth', { value: 1499, configurable: true })
    measureRef.current.appendChild(scroller)
    renderSizing(table, measureRef)
    expect(totalWidth(table)).toBe(1499)
  })

  it('falls back to measureRef when no scroll region exists', () => {
    const table = makeTable()
    renderSizing(table, makeNode(1510))
    expect(totalWidth(table)).toBe(1510)
  })
})
