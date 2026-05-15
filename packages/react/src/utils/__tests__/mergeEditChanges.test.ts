import { describe, it, expect } from 'vitest'
import { mergeEditChanges } from '../mergeEditChanges'

interface TestRow {
  id: string
  name: string
  age: number
}

const baseData: TestRow[] = [
  { id: 'a', name: 'Alice', age: 30 },
  { id: 'b', name: 'Bob', age: 25 },
  { id: 'c', name: 'Carol', age: 40 },
]

describe('mergeEditChanges', () => {
  it('merges changes using index-based IDs (default)', () => {
    const changes: Record<string, Partial<TestRow>> = {
      '1': { name: 'Bobby' },
    }

    const result = mergeEditChanges(baseData, changes)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ id: 'a', name: 'Alice', age: 30 })
    expect(result[1]).toEqual({ id: 'b', name: 'Bobby', age: 25 })
    expect(result[2]).toEqual({ id: 'c', name: 'Carol', age: 40 })
  })

  it('merges changes using a custom getRowId', () => {
    const changes: Record<string, Partial<TestRow>> = {
      b: { age: 26 },
      c: { name: 'Caroline', age: 41 },
    }

    const result = mergeEditChanges(baseData, changes, (row) => row.id)

    expect(result[0]).toEqual({ id: 'a', name: 'Alice', age: 30 })
    expect(result[1]).toEqual({ id: 'b', name: 'Bob', age: 26 })
    expect(result[2]).toEqual({ id: 'c', name: 'Caroline', age: 41 })
  })

  it('returns same references for rows without matching changes', () => {
    const changes: Record<string, Partial<TestRow>> = {
      '0': { name: 'Alicia' },
    }

    const result = mergeEditChanges(baseData, changes)

    // Changed row gets a new reference
    expect(result[0]).not.toBe(baseData[0])
    expect(result[0]).toEqual({ id: 'a', name: 'Alicia', age: 30 })

    // Unchanged rows keep the same reference
    expect(result[1]).toBe(baseData[1])
    expect(result[2]).toBe(baseData[2])
  })

  it('returns the original array when changes is empty', () => {
    const result = mergeEditChanges(baseData, {})

    expect(result).toBe(baseData)
  })
})
