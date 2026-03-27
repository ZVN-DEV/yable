// @yable/core — Fill Handle Tests

import { describe, it, expect } from 'vitest'
import { detectPattern, generateFillValues } from '../fillHandle'
import type { FillPattern } from '../fillHandle'

// ===========================================================================
// detectPattern
// ===========================================================================

describe('detectPattern', () => {
  it('should return constant for empty array', () => {
    const pattern = detectPattern([])
    expect(pattern.type).toBe('constant')
    expect((pattern as any).value).toBe('')
  })

  it('should detect single number as sequence with step 1', () => {
    const pattern = detectPattern([5])
    expect(pattern.type).toBe('sequence')
    expect((pattern as any).start).toBe(5)
    expect((pattern as any).step).toBe(1)
  })

  it('should detect constant for single string', () => {
    const pattern = detectPattern(['hello'])
    expect(pattern.type).toBe('constant')
    expect((pattern as any).value).toBe('hello')
  })

  it('should detect linear sequence [1,2,3]', () => {
    const pattern = detectPattern([1, 2, 3])
    expect(pattern.type).toBe('sequence')
    expect((pattern as any).start).toBe(1)
    expect((pattern as any).step).toBe(1)
  })

  it('should detect linear sequence with step 2: [2,4,6]', () => {
    const pattern = detectPattern([2, 4, 6])
    expect(pattern.type).toBe('sequence')
    expect((pattern as any).start).toBe(2)
    expect((pattern as any).step).toBe(2)
  })

  it('should detect linear sequence with step 10: [10,20,30]', () => {
    const pattern = detectPattern([10, 20, 30])
    expect(pattern.type).toBe('sequence')
    expect((pattern as any).step).toBe(10)
  })

  it('should detect decreasing sequence [30,20,10]', () => {
    const pattern = detectPattern([30, 20, 10])
    expect(pattern.type).toBe('sequence')
    expect((pattern as any).step).toBe(-10)
  })

  it('should detect constant step 0 for [5,5,5]', () => {
    const pattern = detectPattern([5, 5, 5])
    expect(pattern.type).toBe('sequence')
    expect((pattern as any).step).toBe(0)
  })

  it('should detect repeating pattern ["a","b","a","b"]', () => {
    const pattern = detectPattern(['a', 'b', 'a', 'b'])
    expect(pattern.type).toBe('repeat')
    expect((pattern as any).values).toEqual(['a', 'b'])
  })

  it('should detect repeating pattern of length 1: ["x","x","x"]', () => {
    const pattern = detectPattern(['x', 'x', 'x'])
    expect(pattern.type).toBe('repeat')
    expect((pattern as any).values).toEqual(['x'])
  })

  it('should detect date sequence', () => {
    const d1 = new Date('2024-01-01')
    const d2 = new Date('2024-01-02')
    const d3 = new Date('2024-01-03')
    const pattern = detectPattern([d1, d2, d3])
    expect(pattern.type).toBe('date-sequence')
    expect((pattern as any).stepMs).toBe(86400000) // 1 day
  })

  it('should detect single date as date-sequence with 1 day step', () => {
    const d1 = new Date('2024-06-15')
    const pattern = detectPattern([d1])
    expect(pattern.type).toBe('date-sequence')
    expect((pattern as any).stepMs).toBe(86400000)
  })

  it('should detect date string sequence', () => {
    const pattern = detectPattern(['2024-01-01', '2024-01-02', '2024-01-03'])
    expect(pattern.type).toBe('date-sequence')
  })

  it('should detect numeric string sequence', () => {
    const pattern = detectPattern(['1', '2', '3'])
    expect(pattern.type).toBe('sequence')
    expect((pattern as any).start).toBe(1)
    expect((pattern as any).step).toBe(1)
  })

  it('should fall back to repeat for non-pattern strings', () => {
    const pattern = detectPattern(['apple', 'banana', 'cherry'])
    expect(pattern.type).toBe('repeat')
    expect((pattern as any).values).toEqual(['apple', 'banana', 'cherry'])
  })
})

// ===========================================================================
// generateFillValues
// ===========================================================================

describe('generateFillValues', () => {
  it('should generate constant fill', () => {
    const pattern: FillPattern = { type: 'constant', value: 'hello' }
    const values = generateFillValues(pattern, 3, 1)
    expect(values).toEqual(['hello', 'hello', 'hello'])
  })

  it('should generate sequential fill continuing from source', () => {
    // Source was [1,2,3] (3 items, start=1, step=1)
    const pattern: FillPattern = { type: 'sequence', start: 1, step: 1 }
    const values = generateFillValues(pattern, 3, 3)
    expect(values).toEqual([4, 5, 6])
  })

  it('should generate sequential fill with step 2', () => {
    // Source was [2,4,6] (3 items)
    const pattern: FillPattern = { type: 'sequence', start: 2, step: 2 }
    const values = generateFillValues(pattern, 3, 3)
    expect(values).toEqual([8, 10, 12])
  })

  it('should generate repeating fill continuing from source', () => {
    // Source was ["a","b"] (2 items)
    const pattern: FillPattern = { type: 'repeat', values: ['a', 'b'] }
    const values = generateFillValues(pattern, 4, 2)
    expect(values).toEqual(['a', 'b', 'a', 'b'])
  })

  it('should generate date-sequence fill', () => {
    const startMs = new Date('2024-01-01').getTime()
    const oneDayMs = 86400000
    const pattern: FillPattern = {
      type: 'date-sequence',
      startMs,
      stepMs: oneDayMs,
    }
    const values = generateFillValues(pattern, 3, 3)
    expect(values).toHaveLength(3)
    expect((values[0] as Date).getTime()).toBe(startMs + oneDayMs * 3)
    expect((values[1] as Date).getTime()).toBe(startMs + oneDayMs * 4)
    expect((values[2] as Date).getTime()).toBe(startMs + oneDayMs * 5)
  })

  it('should generate zero values when count is 0', () => {
    const pattern: FillPattern = { type: 'constant', value: 'x' }
    const values = generateFillValues(pattern, 0, 1)
    expect(values).toEqual([])
  })
})

// ===========================================================================
// End-to-end: detect then fill
// ===========================================================================

describe('detectPattern + generateFillValues integration', () => {
  it('should extend [1,2,3] to [4,5,6]', () => {
    const source = [1, 2, 3]
    const pattern = detectPattern(source)
    const fill = generateFillValues(pattern, 3, source.length)
    expect(fill).toEqual([4, 5, 6])
  })

  it('should extend [10,20,30] to [40,50,60]', () => {
    const source = [10, 20, 30]
    const pattern = detectPattern(source)
    const fill = generateFillValues(pattern, 3, source.length)
    expect(fill).toEqual([40, 50, 60])
  })

  it('should repeat [a,b] to [a,b,a,b]', () => {
    const source = ['a', 'b', 'a', 'b']
    const pattern = detectPattern(source)
    const fill = generateFillValues(pattern, 4, source.length)
    // Pattern is ["a","b"], source len 4, so indices 4,5,6,7 => a,b,a,b
    expect(fill).toEqual(['a', 'b', 'a', 'b'])
  })

  it('should fill single string as constant', () => {
    const source = ['hello']
    const pattern = detectPattern(source)
    const fill = generateFillValues(pattern, 3, source.length)
    expect(fill).toEqual(['hello', 'hello', 'hello'])
  })
})
