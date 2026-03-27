// @yable/core — Row Dragging Tests

import { describe, it, expect } from 'vitest'
import { moveRow, getInitialRowDragState } from '../rowDragging'

// ===========================================================================
// getInitialRowDragState
// ===========================================================================

describe('getInitialRowDragState', () => {
  it('should return clean initial state', () => {
    const state = getInitialRowDragState()
    expect(state).toEqual({
      draggingRowId: null,
      overRowId: null,
      dropPosition: null,
    })
  })
})

// ===========================================================================
// moveRow
// ===========================================================================

describe('moveRow', () => {
  const data = ['A', 'B', 'C', 'D', 'E']

  it('should move row from index 2 to index 0', () => {
    const result = moveRow(data, 2, 0)
    expect(result).toEqual(['C', 'A', 'B', 'D', 'E'])
  })

  it('should move row from index 0 to last index', () => {
    const result = moveRow(data, 0, 4)
    expect(result).toEqual(['B', 'C', 'D', 'E', 'A'])
  })

  it('should move row from last to first', () => {
    const result = moveRow(data, 4, 0)
    expect(result).toEqual(['E', 'A', 'B', 'C', 'D'])
  })

  it('should return same array when moving to same position', () => {
    const result = moveRow(data, 2, 2)
    expect(result).toBe(data) // Same reference
  })

  it('should not mutate the original array', () => {
    const original = [...data]
    moveRow(data, 0, 3)
    expect(data).toEqual(original)
  })

  it('should return same array for negative fromIndex', () => {
    const result = moveRow(data, -1, 2)
    expect(result).toBe(data)
  })

  it('should return same array for fromIndex out of bounds', () => {
    const result = moveRow(data, 10, 2)
    expect(result).toBe(data)
  })

  it('should return same array for negative toIndex', () => {
    const result = moveRow(data, 2, -1)
    expect(result).toBe(data)
  })

  it('should return same array for toIndex out of bounds', () => {
    const result = moveRow(data, 2, 10)
    expect(result).toBe(data)
  })

  it('should handle single element array', () => {
    const single = ['only']
    const result = moveRow(single, 0, 0)
    expect(result).toBe(single) // Same position = same ref
  })

  it('should handle two element swap', () => {
    const pair = ['first', 'second']
    const result = moveRow(pair, 0, 1)
    expect(result).toEqual(['second', 'first'])
  })

  it('should move adjacent elements correctly', () => {
    const result = moveRow(data, 1, 2)
    expect(result).toEqual(['A', 'C', 'B', 'D', 'E'])
  })
})
