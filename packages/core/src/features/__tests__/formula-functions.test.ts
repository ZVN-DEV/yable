// @zvndev/yable-core — Formula Built-in Functions Tests

import { describe, it, expect } from 'vitest'
import { builtInFunctions } from '../formulas/functions'
import { FormulaError } from '../formulas/parser'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function call(name: string, ...args: unknown[]): unknown {
  const fn = builtInFunctions[name]
  if (!fn) throw new Error(`Function ${name} not found in registry`)
  return fn(args)
}

// ===========================================================================
// MATH FUNCTIONS
// ===========================================================================

describe('Math Functions', () => {
  describe('SUM', () => {
    it('should sum numbers', () => {
      expect(call('SUM', 1, 2, 3)).toBe(6)
    })

    it('should handle a single number', () => {
      expect(call('SUM', 42)).toBe(42)
    })

    it('should ignore non-numeric values', () => {
      expect(call('SUM', 1, 'abc', 2)).toBe(3)
    })

    it('should handle empty args', () => {
      expect(call('SUM')).toBe(0)
    })

    it('should flatten nested arrays (from ranges)', () => {
      expect(builtInFunctions.SUM([[1, 2], [3, 4]])).toBe(10)
    })

    it('should treat boolean TRUE as 1', () => {
      expect(call('SUM', 1, true, false)).toBe(2)
    })
  })

  describe('AVERAGE / AVG', () => {
    it('should compute average of numbers', () => {
      expect(call('AVERAGE', 10, 20, 30)).toBe(20)
    })

    it('should return 0 for empty input', () => {
      expect(call('AVG')).toBe(0)
    })

    it('should ignore non-numeric values', () => {
      expect(call('AVG', 10, 'abc', 20)).toBe(15)
    })

    it('should be aliased as both AVG and AVERAGE', () => {
      expect(builtInFunctions.AVG).toBe(builtInFunctions.AVERAGE)
    })
  })

  describe('MIN', () => {
    it('should return minimum value', () => {
      expect(call('MIN', 5, 3, 8, 1)).toBe(1)
    })

    it('should return 0 for empty input', () => {
      expect(call('MIN')).toBe(0)
    })

    it('should handle negative numbers', () => {
      expect(call('MIN', -5, -3, -8)).toBe(-8)
    })
  })

  describe('MAX', () => {
    it('should return maximum value', () => {
      expect(call('MAX', 5, 3, 8, 1)).toBe(8)
    })

    it('should return 0 for empty input', () => {
      expect(call('MAX')).toBe(0)
    })

    it('should handle negative numbers', () => {
      expect(call('MAX', -5, -3, -8)).toBe(-3)
    })
  })

  describe('ABS', () => {
    it('should return absolute value of positive', () => {
      expect(call('ABS', 5)).toBe(5)
    })

    it('should return absolute value of negative', () => {
      expect(call('ABS', -5)).toBe(5)
    })

    it('should return 0 for 0', () => {
      expect(call('ABS', 0)).toBe(0)
    })

    it('should throw if no arguments', () => {
      expect(() => call('ABS')).toThrow(FormulaError)
    })
  })

  describe('ROUND', () => {
    it('should round to 0 decimal places by default', () => {
      expect(call('ROUND', 3.7)).toBe(4)
    })

    it('should round to specified decimal places', () => {
      expect(call('ROUND', 3.14159, 2)).toBe(3.14)
    })

    it('should throw if no arguments', () => {
      expect(() => call('ROUND')).toThrow(FormulaError)
    })
  })

  describe('FLOOR', () => {
    it('should round down', () => {
      expect(call('FLOOR', 3.9)).toBe(3)
    })

    it('should round negative numbers toward negative infinity', () => {
      expect(call('FLOOR', -3.1)).toBe(-4)
    })

    it('should throw if no arguments', () => {
      expect(() => call('FLOOR')).toThrow(FormulaError)
    })
  })

  describe('CEILING / CEIL', () => {
    it('should round up', () => {
      expect(call('CEILING', 3.1)).toBe(4)
    })

    it('should be aliased as CEIL', () => {
      expect(builtInFunctions.CEIL).toBe(builtInFunctions.CEILING)
    })

    it('should throw if no arguments', () => {
      expect(() => call('CEIL')).toThrow(FormulaError)
    })
  })

  describe('POWER / POW', () => {
    it('should compute base^exponent', () => {
      expect(call('POWER', 2, 10)).toBe(1024)
    })

    it('should compute fractional exponents', () => {
      expect(call('POWER', 9, 0.5)).toBe(3)
    })

    it('should be aliased as POW', () => {
      expect(builtInFunctions.POW).toBe(builtInFunctions.POWER)
    })

    it('should throw if fewer than 2 arguments', () => {
      expect(() => call('POWER', 2)).toThrow(FormulaError)
    })
  })

  describe('SQRT', () => {
    it('should compute square root', () => {
      expect(call('SQRT', 25)).toBe(5)
    })

    it('should return 0 for 0', () => {
      expect(call('SQRT', 0)).toBe(0)
    })

    it('should throw for negative numbers', () => {
      expect(() => call('SQRT', -4)).toThrow(FormulaError)
    })

    it('should throw if no arguments', () => {
      expect(() => call('SQRT')).toThrow(FormulaError)
    })
  })
})

// ===========================================================================
// TEXT FUNCTIONS
// ===========================================================================

describe('Text Functions', () => {
  describe('CONCAT / CONCATENATE', () => {
    it('should concatenate strings', () => {
      expect(call('CONCAT', 'hello', ' ', 'world')).toBe('hello world')
    })

    it('should coerce numbers to strings', () => {
      expect(call('CONCAT', 'val=', 42)).toBe('val=42')
    })

    it('should handle null/undefined as empty string', () => {
      expect(call('CONCATENATE', 'a', null, 'b')).toBe('ab')
    })

    it('should be aliased as CONCATENATE', () => {
      expect(builtInFunctions.CONCATENATE).toBe(builtInFunctions.CONCAT)
    })

    it('should flatten nested arrays from ranges', () => {
      expect(builtInFunctions.CONCAT([['a', 'b'], ['c']])).toBe('abc')
    })
  })

  describe('LEN', () => {
    it('should return string length', () => {
      expect(call('LEN', 'hello')).toBe(5)
    })

    it('should return 0 for empty string', () => {
      expect(call('LEN', '')).toBe(0)
    })

    it('should coerce number to string', () => {
      expect(call('LEN', 123)).toBe(3)
    })

    it('should throw if no arguments', () => {
      expect(() => call('LEN')).toThrow(FormulaError)
    })
  })

  describe('UPPER', () => {
    it('should convert to uppercase', () => {
      expect(call('UPPER', 'hello')).toBe('HELLO')
    })

    it('should handle mixed case', () => {
      expect(call('UPPER', 'Hello World')).toBe('HELLO WORLD')
    })

    it('should throw if no arguments', () => {
      expect(() => call('UPPER')).toThrow(FormulaError)
    })
  })

  describe('LOWER', () => {
    it('should convert to lowercase', () => {
      expect(call('LOWER', 'HELLO')).toBe('hello')
    })

    it('should handle mixed case', () => {
      expect(call('LOWER', 'Hello World')).toBe('hello world')
    })

    it('should throw if no arguments', () => {
      expect(() => call('LOWER')).toThrow(FormulaError)
    })
  })
})

// ===========================================================================
// LOGICAL FUNCTIONS
// ===========================================================================

describe('Logical Functions', () => {
  describe('IF', () => {
    it('should return trueValue when condition is true', () => {
      expect(call('IF', true, 'yes', 'no')).toBe('yes')
    })

    it('should return falseValue when condition is false', () => {
      expect(call('IF', false, 'yes', 'no')).toBe('no')
    })

    it('should return false when falseValue is omitted and condition is false', () => {
      expect(call('IF', false, 'yes')).toBe(false)
    })

    it('should treat truthy number as true', () => {
      expect(call('IF', 1, 'yes', 'no')).toBe('yes')
      expect(call('IF', 0, 'yes', 'no')).toBe('no')
    })

    it('should treat non-empty string as true', () => {
      expect(call('IF', 'text', 'yes', 'no')).toBe('yes')
      expect(call('IF', '', 'yes', 'no')).toBe('no')
    })

    it('should throw if fewer than 2 arguments', () => {
      expect(() => call('IF', true)).toThrow(FormulaError)
    })
  })
})

// ===========================================================================
// STATISTICAL FUNCTIONS
// ===========================================================================

describe('Statistical Functions', () => {
  describe('COUNT', () => {
    it('should count numeric values', () => {
      expect(call('COUNT', 1, 'abc', 2, null, 3)).toBe(3)
    })

    it('should not count empty strings', () => {
      expect(call('COUNT', '', 1)).toBe(1)
    })

    it('should not count null/undefined', () => {
      expect(call('COUNT', null, undefined)).toBe(0)
    })

    it('should return 0 for no numeric values', () => {
      expect(call('COUNT', 'abc', 'def')).toBe(0)
    })
  })

  describe('COUNTA', () => {
    it('should count non-empty values', () => {
      expect(call('COUNTA', 1, 'abc', true, null, '')).toBe(3)
    })

    it('should count booleans', () => {
      expect(call('COUNTA', true, false)).toBe(2)
    })

    it('should return 0 for all empty', () => {
      expect(call('COUNTA', null, '', undefined)).toBe(0)
    })
  })
})

// ===========================================================================
// FUNCTION REGISTRY
// ===========================================================================

describe('Function Registry', () => {
  it('should have all expected function names', () => {
    const expected = [
      'SUM', 'AVG', 'AVERAGE', 'COUNT', 'COUNTA',
      'MIN', 'MAX', 'IF', 'CONCAT', 'CONCATENATE',
      'ROUND', 'ABS', 'FLOOR', 'CEILING', 'CEIL',
      'POWER', 'POW', 'SQRT', 'LEN', 'UPPER', 'LOWER',
    ]
    for (const name of expected) {
      expect(builtInFunctions).toHaveProperty(name)
      expect(typeof builtInFunctions[name]).toBe('function')
    }
  })
})
