// @yable/core — Built-in Formula Functions
// SUM, AVG, COUNT, MIN, MAX, IF, CONCAT, ROUND, ABS

import { FormulaError } from './parser'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FormulaFunction = (args: unknown[]) => unknown

// ---------------------------------------------------------------------------
// Built-in Functions
// ---------------------------------------------------------------------------

/**
 * SUM(values...) — Adds all numeric values.
 * Ignores non-numeric values.
 */
function SUM(args: unknown[]): number {
  return flattenArgs(args).reduce<number>((sum, v) => {
    const n = toNumber(v)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)
}

/**
 * AVG(values...) / AVERAGE(values...) — Average of numeric values.
 */
function AVG(args: unknown[]): number {
  const flat = flattenArgs(args)
  const nums = flat.map(toNumber).filter((n) => !isNaN(n))
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * COUNT(values...) — Counts numeric values.
 */
function COUNT(args: unknown[]): number {
  return flattenArgs(args).filter((v) => {
    if (v == null || v === '') return false
    return !isNaN(toNumber(v))
  }).length
}

/**
 * COUNTA(values...) — Counts non-empty values.
 */
function COUNTA(args: unknown[]): number {
  return flattenArgs(args).filter((v) => v != null && v !== '').length
}

/**
 * MIN(values...) — Minimum numeric value.
 */
function MIN(args: unknown[]): number {
  const nums = flattenArgs(args).map(toNumber).filter((n) => !isNaN(n))
  if (nums.length === 0) return 0
  return Math.min(...nums)
}

/**
 * MAX(values...) — Maximum numeric value.
 */
function MAX(args: unknown[]): number {
  const nums = flattenArgs(args).map(toNumber).filter((n) => !isNaN(n))
  if (nums.length === 0) return 0
  return Math.max(...nums)
}

/**
 * IF(condition, trueValue, falseValue)
 */
function IF(args: unknown[]): unknown {
  if (args.length < 2) {
    throw new FormulaError('IF requires at least 2 arguments')
  }

  const condition = args[0]
  const trueValue = args[1]
  const falseValue = args.length > 2 ? args[2] : false

  return toBool(condition) ? trueValue : falseValue
}

/**
 * CONCAT(values...) — Concatenates all values as strings.
 */
function CONCAT(args: unknown[]): string {
  return flattenArgs(args).map((v) => String(v ?? '')).join('')
}

/**
 * ROUND(number, [digits])
 */
function ROUND(args: unknown[]): number {
  if (args.length < 1) {
    throw new FormulaError('ROUND requires at least 1 argument')
  }

  const num = toNumber(args[0])
  const digits = args.length > 1 ? toNumber(args[1]) : 0

  if (isNaN(num)) return NaN
  if (isNaN(digits)) return NaN

  const factor = Math.pow(10, Math.floor(digits))
  return Math.round(num * factor) / factor
}

/**
 * ABS(number) — Absolute value.
 */
function ABS(args: unknown[]): number {
  if (args.length < 1) {
    throw new FormulaError('ABS requires 1 argument')
  }

  return Math.abs(toNumber(args[0]))
}

/**
 * FLOOR(number) — Round down.
 */
function FLOOR(args: unknown[]): number {
  if (args.length < 1) {
    throw new FormulaError('FLOOR requires 1 argument')
  }

  return Math.floor(toNumber(args[0]))
}

/**
 * CEILING(number) — Round up.
 */
function CEILING(args: unknown[]): number {
  if (args.length < 1) {
    throw new FormulaError('CEILING requires 1 argument')
  }

  return Math.ceil(toNumber(args[0]))
}

/**
 * POWER(base, exponent) — Raises base to exponent.
 */
function POWER(args: unknown[]): number {
  if (args.length < 2) {
    throw new FormulaError('POWER requires 2 arguments')
  }

  return Math.pow(toNumber(args[0]), toNumber(args[1]))
}

/**
 * SQRT(number) — Square root.
 */
function SQRT(args: unknown[]): number {
  if (args.length < 1) {
    throw new FormulaError('SQRT requires 1 argument')
  }

  const n = toNumber(args[0])
  if (n < 0) throw new FormulaError('SQRT of negative number')
  return Math.sqrt(n)
}

/**
 * LEN(text) — Length of string.
 */
function LEN(args: unknown[]): number {
  if (args.length < 1) {
    throw new FormulaError('LEN requires 1 argument')
  }

  return String(args[0] ?? '').length
}

/**
 * UPPER(text) — Convert to uppercase.
 */
function UPPER(args: unknown[]): string {
  if (args.length < 1) {
    throw new FormulaError('UPPER requires 1 argument')
  }

  return String(args[0] ?? '').toUpperCase()
}

/**
 * LOWER(text) — Convert to lowercase.
 */
function LOWER(args: unknown[]): string {
  if (args.length < 1) {
    throw new FormulaError('LOWER requires 1 argument')
  }

  return String(args[0] ?? '').toLowerCase()
}

// ---------------------------------------------------------------------------
// Function Registry
// ---------------------------------------------------------------------------

export const builtInFunctions: Record<string, FormulaFunction> = {
  SUM,
  AVG,
  AVERAGE: AVG,
  COUNT,
  COUNTA,
  MIN,
  MAX,
  IF,
  CONCAT,
  CONCATENATE: CONCAT,
  ROUND,
  ABS,
  FLOOR,
  CEILING,
  CEIL: CEILING,
  POWER,
  POW: POWER,
  SQRT,
  LEN,
  UPPER,
  LOWER,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    if (value.trim() === '') return 0
    const n = Number(value)
    return n
  }
  return NaN
}

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return value.length > 0
  return !!value
}

/**
 * Flattens nested arrays (from range references) into a single array.
 */
function flattenArgs(args: unknown[]): unknown[] {
  const result: unknown[] = []

  for (const arg of args) {
    if (Array.isArray(arg)) {
      result.push(...flattenArgs(arg))
    } else {
      result.push(arg)
    }
  }

  return result
}
