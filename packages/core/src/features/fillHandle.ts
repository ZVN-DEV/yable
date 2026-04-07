// @zvndev/yable-core — Fill Handle Feature
// Drag corner to auto-fill cells with pattern detection.

import type { RowData, Table, Row, Column } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FillPattern =
  | { type: 'constant'; value: unknown }
  | { type: 'sequence'; start: number; step: number }
  | { type: 'date-sequence'; startMs: number; stepMs: number }
  | { type: 'repeat'; values: unknown[] }

// ---------------------------------------------------------------------------
// Pattern Detection
// ---------------------------------------------------------------------------

/**
 * Detects the fill pattern from a list of source values.
 * Supports: sequential numbers, dates, repeating values, constant.
 */
export function detectPattern(values: unknown[]): FillPattern {
  if (values.length === 0) {
    return { type: 'constant', value: '' }
  }

  if (values.length === 1) {
    const v = values[0]
    // Single number: increment by 1
    if (typeof v === 'number') {
      return { type: 'sequence', start: v, step: 1 }
    }
    // Single date: increment by 1 day
    if (v instanceof Date) {
      return { type: 'date-sequence', startMs: v.getTime(), stepMs: 86400000 }
    }
    return { type: 'constant', value: v }
  }

  // Check if all values are numbers
  const allNumbers = values.every((v) => typeof v === 'number' && !isNaN(v as number))
  if (allNumbers) {
    const nums = values as number[]
    // Check for constant step
    const step = nums[1]! - nums[0]!
    const isArithmetic = nums.every((n, i) => {
      if (i === 0) return true
      return Math.abs(n - nums[i - 1]! - step) < 1e-10
    })

    if (isArithmetic) {
      return { type: 'sequence', start: nums[0]!, step }
    }
  }

  // Check if all values are numeric strings
  const allNumericStrings = values.every(
    (v) => typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))
  )
  if (allNumericStrings) {
    const nums = values.map((v) => Number(v))
    const step = nums[1]! - nums[0]!
    const isArithmetic = nums.every((n, i) => {
      if (i === 0) return true
      return Math.abs(n - nums[i - 1]! - step) < 1e-10
    })

    if (isArithmetic) {
      return { type: 'sequence', start: nums[0]!, step }
    }
  }

  // Check if all values are dates
  const allDates = values.every((v) => v instanceof Date && !isNaN(v.getTime()))
  if (allDates) {
    const dates = values as Date[]
    const stepMs = dates[1]!.getTime() - dates[0]!.getTime()
    const isDateSequence = dates.every((d, i) => {
      if (i === 0) return true
      return Math.abs(d.getTime() - dates[i - 1]!.getTime() - stepMs) < 1000
    })

    if (isDateSequence) {
      return { type: 'date-sequence', startMs: dates[0]!.getTime(), stepMs }
    }
  }

  // Check if all values are date strings (YYYY-MM-DD)
  const allDateStrings = values.every(
    (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)
  )
  if (allDateStrings) {
    const dates = (values as string[]).map((v) => new Date(v))
    if (dates.every((d) => !isNaN(d.getTime())) && dates.length >= 2) {
      const stepMs = dates[1]!.getTime() - dates[0]!.getTime()
      return { type: 'date-sequence', startMs: dates[0]!.getTime(), stepMs }
    }
  }

  // Check for repeating pattern
  if (values.length >= 2) {
    // Try pattern lengths from 1 to half the array
    for (let patternLen = 1; patternLen <= Math.floor(values.length / 2); patternLen++) {
      const pattern = values.slice(0, patternLen)
      const isRepeating = values.every((v, i) => {
        const expected = pattern[i % patternLen]
        return String(v) === String(expected)
      })

      if (isRepeating) {
        return { type: 'repeat', values: pattern }
      }
    }
  }

  // Default: repeat all values as a pattern
  return { type: 'repeat', values: [...values] }
}

// ---------------------------------------------------------------------------
// Generate Fill Values
// ---------------------------------------------------------------------------

/**
 * Generates fill values based on a detected pattern.
 *
 * @param pattern - The detected pattern
 * @param count - Number of values to generate
 * @param sourceLength - Number of source values used to detect the pattern
 */
export function generateFillValues(
  pattern: FillPattern,
  count: number,
  sourceLength: number
): unknown[] {
  const result: unknown[] = []

  for (let i = 0; i < count; i++) {
    switch (pattern.type) {
      case 'constant':
        result.push(pattern.value)
        break

      case 'sequence':
        result.push(pattern.start + pattern.step * (sourceLength + i))
        break

      case 'date-sequence': {
        const ms = pattern.startMs + pattern.stepMs * (sourceLength + i)
        result.push(new Date(ms))
        break
      }

      case 'repeat':
        result.push(pattern.values[(sourceLength + i) % pattern.values.length])
        break
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Fill Range Integration
// ---------------------------------------------------------------------------

/**
 * Fills a target range based on values in the source range, using pattern
 * detection. Returns the list of filled cells.
 */
export function detectAndFill<TData extends RowData>(
  table: Table<TData>,
  sourceRange: { startRow: number; startCol: number; endRow: number; endCol: number },
  targetRange: { startRow: number; startCol: number; endRow: number; endCol: number },
  rows: Row<TData>[],
  columns: Column<TData, unknown>[]
): { rowId: string; columnId: string; value: unknown }[] {
  const filledCells: { rowId: string; columnId: string; value: unknown }[] = []

  // Process each column in the range
  const colStart = Math.min(sourceRange.startCol, targetRange.startCol)
  const colEnd = Math.max(sourceRange.endCol, targetRange.endCol)

  for (let colIdx = colStart; colIdx <= colEnd; colIdx++) {
    if (colIdx >= columns.length) break
    const column = columns[colIdx]!

    // Check if column is editable
    const editable = (column.columnDef as any).editable
    if (editable === false) continue

    // Gather source values for this column
    const sourceValues: unknown[] = []
    for (let rowIdx = sourceRange.startRow; rowIdx <= sourceRange.endRow; rowIdx++) {
      if (rowIdx >= rows.length) break
      sourceValues.push(rows[rowIdx]!.getValue(column.id))
    }

    if (sourceValues.length === 0) continue

    // Detect pattern
    const pattern = detectPattern(sourceValues)

    // Determine target rows (the rows NOT in the source range)
    const targetRows: number[] = []
    for (let rowIdx = targetRange.startRow; rowIdx <= targetRange.endRow; rowIdx++) {
      if (rowIdx < sourceRange.startRow || rowIdx > sourceRange.endRow) {
        targetRows.push(rowIdx)
      }
    }

    if (targetRows.length === 0) continue

    // Generate fill values
    const fillValues = generateFillValues(pattern, targetRows.length, sourceValues.length)

    // Apply values
    for (let i = 0; i < targetRows.length; i++) {
      const rowIdx = targetRows[i]!
      if (rowIdx >= rows.length) break

      const row = rows[rowIdx]!
      let value = fillValues[i]

      // Format dates back to string if source was string dates
      if (value instanceof Date && typeof sourceValues[0] === 'string') {
        value = value.toISOString().split('T')[0]
      }

      table.setPendingValue(row.id, column.id, value)
      filledCells.push({ rowId: row.id, columnId: column.id, value })
    }
  }

  return filledCells
}
