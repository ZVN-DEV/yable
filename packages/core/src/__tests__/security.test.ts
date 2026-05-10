// @zvndev/yable-core — Security hardening tests

import { describe, it, expect } from 'vitest'
import { getDeepValue } from '../utils'
import { tokenize, MAX_FORMULA_LENGTH, FormulaError } from '../features/formulas/parser'

// ---------------------------------------------------------------------------
// Prototype pollution guard — getDeepValue
// ---------------------------------------------------------------------------

describe('getDeepValue — prototype pollution guard', () => {
  const obj = {
    address: { city: 'Portland' },
    constructor: { name: 'safe' },
    nested: { __proto__: { evil: true } },
  }

  it('returns undefined for __proto__ path segments', () => {
    const result = getDeepValue(obj as any, '__proto__.polluted' as any)
    expect(result).toBeUndefined()
  })

  it('returns undefined for constructor path segments', () => {
    const result = getDeepValue(obj as any, 'constructor.name' as any)
    expect(result).toBeUndefined()
  })

  it('returns undefined for prototype path segments', () => {
    const result = getDeepValue(obj as any, 'prototype.toString' as any)
    expect(result).toBeUndefined()
  })

  it('still works for normal nested access', () => {
    const result = getDeepValue(obj as any, 'address.city' as any)
    expect(result).toBe('Portland')
  })
})

// ---------------------------------------------------------------------------
// Formula length guard — tokenize
// ---------------------------------------------------------------------------

describe('tokenize — formula length guard', () => {
  it('throws on strings longer than MAX_FORMULA_LENGTH', () => {
    const longFormula = '=' + 'A1+'.repeat(MAX_FORMULA_LENGTH)
    expect(() => tokenize(longFormula)).toThrow(FormulaError)
    expect(() => tokenize(longFormula)).toThrow(
      `Formula exceeds maximum length of ${MAX_FORMULA_LENGTH} characters`,
    )
  })

  it('accepts strings at exactly MAX_FORMULA_LENGTH', () => {
    // Build a valid formula that is exactly MAX_FORMULA_LENGTH characters
    const base = '=1+'
    const padding = '1'.repeat(MAX_FORMULA_LENGTH - base.length)
    const formula = base + padding
    expect(formula.length).toBe(MAX_FORMULA_LENGTH)
    expect(() => tokenize(formula)).not.toThrow()
  })
})
