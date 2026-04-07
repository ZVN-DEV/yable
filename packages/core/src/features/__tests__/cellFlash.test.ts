// @zvndev/yable-core — Cell Flash Tests

import { describe, it, expect, vi } from 'vitest'
import { detectCellChanges } from '../cellFlash'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StockData {
  id: string
  price: number
  name: string
}

const getRowId = (row: StockData, _index: number) => row.id

const flashColumns = [
  { id: 'price', enableCellFlash: true },
  { id: 'name', enableCellFlash: false },
]

// ===========================================================================
// detectCellChanges
// ===========================================================================

describe('detectCellChanges', () => {
  it('should detect value increase as "up"', () => {
    const oldData: StockData[] = [{ id: '1', price: 100, name: 'AAPL' }]
    const newData: StockData[] = [{ id: '1', price: 150, name: 'AAPL' }]

    const flashes = detectCellChanges(oldData, newData, flashColumns, getRowId)

    expect(flashes.size).toBe(1)
    const flash = flashes.get('1:price')!
    expect(flash.direction).toBe('up')
    expect(flash.previousValue).toBe(100)
    expect(flash.newValue).toBe(150)
  })

  it('should detect value decrease as "down"', () => {
    const oldData: StockData[] = [{ id: '1', price: 150, name: 'AAPL' }]
    const newData: StockData[] = [{ id: '1', price: 100, name: 'AAPL' }]

    const flashes = detectCellChanges(oldData, newData, flashColumns, getRowId)

    expect(flashes.size).toBe(1)
    const flash = flashes.get('1:price')!
    expect(flash.direction).toBe('down')
  })

  it('should not detect flash when value stays the same', () => {
    const oldData: StockData[] = [{ id: '1', price: 100, name: 'AAPL' }]
    const newData: StockData[] = [{ id: '1', price: 100, name: 'AAPL' }]

    const flashes = detectCellChanges(oldData, newData, flashColumns, getRowId)
    expect(flashes.size).toBe(0)
  })

  it('should not flash columns with enableCellFlash=false', () => {
    const oldData: StockData[] = [{ id: '1', price: 100, name: 'AAPL' }]
    const newData: StockData[] = [{ id: '1', price: 100, name: 'GOOG' }]

    const flashes = detectCellChanges(oldData, newData, flashColumns, getRowId)
    expect(flashes.size).toBe(0)
  })

  it('should detect non-numeric change as "change"', () => {
    const allFlashCols = [
      { id: 'price', enableCellFlash: true },
      { id: 'name', enableCellFlash: true },
    ]

    const oldData: StockData[] = [{ id: '1', price: 100, name: 'AAPL' }]
    const newData: StockData[] = [{ id: '1', price: 100, name: 'GOOG' }]

    const flashes = detectCellChanges(oldData, newData, allFlashCols, getRowId)
    const flash = flashes.get('1:name')!
    expect(flash.direction).toBe('change')
  })

  it('should handle multiple rows changing', () => {
    const oldData: StockData[] = [
      { id: '1', price: 100, name: 'AAPL' },
      { id: '2', price: 200, name: 'GOOG' },
    ]
    const newData: StockData[] = [
      { id: '1', price: 110, name: 'AAPL' },
      { id: '2', price: 190, name: 'GOOG' },
    ]

    const flashes = detectCellChanges(oldData, newData, flashColumns, getRowId)
    expect(flashes.size).toBe(2)
    expect(flashes.get('1:price')!.direction).toBe('up')
    expect(flashes.get('2:price')!.direction).toBe('down')
  })

  it('should return empty map for null/undefined data', () => {
    const flashes = detectCellChanges(null as any, null as any, flashColumns, getRowId)
    expect(flashes.size).toBe(0)
  })

  it('should skip rows not present in old data', () => {
    const oldData: StockData[] = [{ id: '1', price: 100, name: 'AAPL' }]
    const newData: StockData[] = [
      { id: '1', price: 100, name: 'AAPL' },
      { id: '2', price: 200, name: 'NEW' }, // New row, no old counterpart
    ]

    const flashes = detectCellChanges(oldData, newData, flashColumns, getRowId)
    expect(flashes.size).toBe(0)
  })

  it('should not flash when old value is undefined', () => {
    const oldData = [{ id: '1', price: undefined, name: 'AAPL' }] as any[]
    const newData = [{ id: '1', price: 100, name: 'AAPL' }] as any[]

    const flashes = detectCellChanges(oldData, newData, flashColumns, getRowId)
    // Old value is undefined, so no flash
    expect(flashes.size).toBe(0)
  })

  it('should include timestamp in flash info', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))

    const oldData: StockData[] = [{ id: '1', price: 100, name: 'AAPL' }]
    const newData: StockData[] = [{ id: '1', price: 200, name: 'AAPL' }]

    const flashes = detectCellChanges(oldData, newData, flashColumns, getRowId)
    const flash = flashes.get('1:price')!
    expect(flash.timestamp).toBe(new Date('2024-06-15T12:00:00Z').getTime())

    vi.useRealTimers()
  })
})
