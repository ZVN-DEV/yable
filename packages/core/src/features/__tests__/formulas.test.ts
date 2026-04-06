// @yable/core — Formula Parser & Evaluator Tests

import { describe, it, expect } from 'vitest'
import {
  tokenize,
  parseFormula,
  FormulaError,
} from '../formulas/parser'
import { evaluate } from '../formulas/evaluator'
import type { CellValueResolver, RangeValueResolver } from '../formulas/evaluator'
import {
  parseCellRef,
  parseRangeRef,
  expandRange,
  cellRefToString,
  columnIndexToLetter,
  letterToColumnIndex,
  extractReferences,
} from '../formulas/cellRef'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** No-op resolvers for tests that don't need cell/range resolution */
const noop: CellValueResolver = () => undefined
const noopRange: RangeValueResolver = () => []

/** Parse and evaluate a formula without cell resolution */
function evalFormula(formula: string): unknown {
  const ast = parseFormula(formula)
  return evaluate(ast, noop, noopRange)
}

/** Parse and evaluate a formula with a cell grid */
function evalWithGrid(
  formula: string,
  grid: Record<string, unknown>
): unknown {
  const getCellValue: CellValueResolver = (ref) => grid[ref]
  const getRangeValues: RangeValueResolver = (rangeRef) => {
    const parsed = parseRangeRef(rangeRef)
    if (!parsed) return []
    const cells = expandRange(parsed)
    return cells.map((c) => grid[cellRefToString(c)])
  }
  const ast = parseFormula(formula)
  return evaluate(ast, getCellValue, getRangeValues)
}

// ===========================================================================
// TOKENIZER
// ===========================================================================

describe('Tokenizer', () => {
  it('should tokenize a simple number', () => {
    const tokens = tokenize('=42')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ type: 'number', value: '42' })
  })

  it('should tokenize a decimal number', () => {
    const tokens = tokenize('=3.14')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ type: 'number', value: '3.14' })
  })

  it('should tokenize operators', () => {
    const tokens = tokenize('=1+2')
    expect(tokens).toHaveLength(3)
    expect(tokens[1]).toMatchObject({ type: 'operator', value: '+' })
  })

  it('should tokenize comparison operators >=, <=, <>', () => {
    const tokens = tokenize('=A1>=10')
    const opToken = tokens.find((t) => t.type === 'operator')
    expect(opToken?.value).toBe('>=')
  })

  it('should tokenize cell references', () => {
    const tokens = tokenize('=A1')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ type: 'cellRef', value: 'A1' })
  })

  it('should tokenize range references', () => {
    const tokens = tokenize('=A1:B10')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ type: 'rangeRef', value: 'A1:B10' })
  })

  it('should tokenize function names', () => {
    const tokens = tokenize('=SUM(1)')
    expect(tokens[0]).toMatchObject({ type: 'function', value: 'SUM' })
  })

  it('should tokenize string literals', () => {
    const tokens = tokenize('="hello"')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ type: 'string', value: 'hello' })
  })

  it('should handle escaped quotes in strings', () => {
    const tokens = tokenize('="he said ""hi"""')
    expect(tokens[0]).toMatchObject({ type: 'string', value: 'he said "hi"' })
  })

  it('should tokenize boolean TRUE / FALSE', () => {
    const tokT = tokenize('=TRUE')
    expect(tokT[0]).toMatchObject({ type: 'boolean', value: 'TRUE' })

    const tokF = tokenize('=FALSE')
    expect(tokF[0]).toMatchObject({ type: 'boolean', value: 'FALSE' })
  })

  it('should tokenize parentheses and commas', () => {
    const tokens = tokenize('=SUM(1,2)')
    const types = tokens.map((t) => t.type)
    expect(types).toEqual(['function', 'paren_open', 'number', 'comma', 'number', 'paren_close'])
  })

  it('should skip whitespace', () => {
    const tokens = tokenize('= 1 + 2 ')
    expect(tokens).toHaveLength(3)
  })

  it('should throw on unexpected characters', () => {
    expect(() => tokenize('=1 @ 2')).toThrow(FormulaError)
  })

  it('should tokenize the & operator', () => {
    const tokens = tokenize('="a"&"b"')
    expect(tokens[1]).toMatchObject({ type: 'operator', value: '&' })
  })

  it('should uppercase cell refs and function names', () => {
    const tokens = tokenize('=sum(a1)')
    expect(tokens[0]?.value).toBe('SUM')
    expect(tokens[2]?.value).toBe('A1')
  })
})

// ===========================================================================
// PARSER (AST)
// ===========================================================================

describe('FormulaParser', () => {
  it('should parse a simple number', () => {
    const ast = parseFormula('=42')
    expect(ast).toEqual({ type: 'number', value: 42 })
  })

  it('should parse a string literal', () => {
    const ast = parseFormula('="hello"')
    expect(ast).toEqual({ type: 'string', value: 'hello' })
  })

  it('should parse TRUE and FALSE', () => {
    expect(parseFormula('=TRUE')).toEqual({ type: 'boolean', value: true })
    expect(parseFormula('=FALSE')).toEqual({ type: 'boolean', value: false })
  })

  it('should parse a cell reference', () => {
    const ast = parseFormula('=A1')
    expect(ast).toEqual({ type: 'cellRef', ref: 'A1' })
  })

  it('should parse a range reference', () => {
    const ast = parseFormula('=A1:B10')
    expect(ast).toEqual({ type: 'rangeRef', ref: 'A1:B10' })
  })

  it('should parse binary operators with correct precedence (1+2*3 = 7)', () => {
    const ast = parseFormula('=1+2*3')
    // Should be: 1 + (2*3), i.e., + at top with left=1, right=binaryOp(*)
    expect(ast.type).toBe('binaryOp')
    const binOp = ast as any
    expect(binOp.operator).toBe('+')
    expect(binOp.left).toEqual({ type: 'number', value: 1 })
    expect(binOp.right.type).toBe('binaryOp')
    expect(binOp.right.operator).toBe('*')
  })

  it('should parse parentheses overriding precedence ((1+2)*3)', () => {
    const ast = parseFormula('=(1+2)*3')
    expect(ast.type).toBe('binaryOp')
    const binOp = ast as any
    expect(binOp.operator).toBe('*')
    expect(binOp.left.type).toBe('binaryOp')
    expect(binOp.left.operator).toBe('+')
    expect(binOp.right).toEqual({ type: 'number', value: 3 })
  })

  it('should parse unary minus', () => {
    const ast = parseFormula('=-5')
    expect(ast).toEqual({
      type: 'unaryOp',
      operator: '-',
      operand: { type: 'number', value: 5 },
    })
  })

  it('should parse unary plus', () => {
    const ast = parseFormula('=+5')
    expect(ast).toEqual({
      type: 'unaryOp',
      operator: '+',
      operand: { type: 'number', value: 5 },
    })
  })

  it('should parse function calls with arguments', () => {
    const ast = parseFormula('=SUM(1,2,3)')
    expect(ast.type).toBe('functionCall')
    const fn = ast as any
    expect(fn.name).toBe('SUM')
    expect(fn.args).toHaveLength(3)
  })

  it('should parse nested function calls', () => {
    const ast = parseFormula('=SUM(1,MAX(2,3))')
    expect(ast.type).toBe('functionCall')
    const fn = ast as any
    expect(fn.args[1].type).toBe('functionCall')
    expect(fn.args[1].name).toBe('MAX')
  })

  it('should parse empty function call', () => {
    // e.g., =NOW() — zero args
    const ast = parseFormula('=SUM()')
    expect(ast.type).toBe('functionCall')
    expect((ast as any).args).toHaveLength(0)
  })

  it('should throw on missing closing parenthesis', () => {
    expect(() => parseFormula('=SUM(1,2')).toThrow(FormulaError)
  })

  it('should throw on unexpected end of formula', () => {
    expect(() => parseFormula('=1+')).toThrow(FormulaError)
  })

  it('should throw on empty formula (just =)', () => {
    expect(() => parseFormula('=')).toThrow(FormulaError)
  })

  it('should throw on trailing unexpected tokens', () => {
    expect(() => parseFormula('=1 2')).toThrow(FormulaError)
  })

  it('should parse the ^ exponent operator', () => {
    const ast = parseFormula('=2^3')
    expect(ast.type).toBe('binaryOp')
    expect((ast as any).operator).toBe('^')
  })

  it('should parse the & concatenation operator', () => {
    const ast = parseFormula('="a"&"b"')
    expect(ast.type).toBe('binaryOp')
    expect((ast as any).operator).toBe('&')
  })
})

// ===========================================================================
// EVALUATOR
// ===========================================================================

describe('Evaluator', () => {
  describe('arithmetic operators', () => {
    it('should evaluate addition: =1+2 => 3', () => {
      expect(evalFormula('=1+2')).toBe(3)
    })

    it('should evaluate subtraction: =10-3 => 7', () => {
      expect(evalFormula('=10-3')).toBe(7)
    })

    it('should evaluate multiplication: =4*5 => 20', () => {
      expect(evalFormula('=4*5')).toBe(20)
    })

    it('should evaluate division: =20/4 => 5', () => {
      expect(evalFormula('=20/4')).toBe(5)
    })

    it('should evaluate exponentiation: =2^10 => 1024', () => {
      expect(evalFormula('=2^10')).toBe(1024)
    })

    it('should evaluate modulo: =10%3 => 1', () => {
      expect(evalFormula('=10%3')).toBe(1)
    })

    it('should respect operator precedence: =1+2*3 => 7', () => {
      expect(evalFormula('=1+2*3')).toBe(7)
    })

    it('should respect parentheses: =(1+2)*3 => 9', () => {
      expect(evalFormula('=(1+2)*3')).toBe(9)
    })

    it('should evaluate unary minus: =-5 => -5', () => {
      expect(evalFormula('=-5')).toBe(-5)
    })

    it('should throw on division by zero', () => {
      expect(() => evalFormula('=1/0')).toThrow(FormulaError)
    })
  })

  describe('comparison operators', () => {
    it('should evaluate > operator', () => {
      expect(evalFormula('=5>3')).toBe(true)
      expect(evalFormula('=3>5')).toBe(false)
    })

    it('should evaluate < operator', () => {
      expect(evalFormula('=3<5')).toBe(true)
      expect(evalFormula('=5<3')).toBe(false)
    })

    it('should evaluate >= operator', () => {
      expect(evalFormula('=5>=5')).toBe(true)
      expect(evalFormula('=4>=5')).toBe(false)
    })

    it('should evaluate <= operator', () => {
      expect(evalFormula('=5<=5')).toBe(true)
      expect(evalFormula('=6<=5')).toBe(false)
    })

    it('should evaluate = equality operator', () => {
      expect(evalFormula('=5=5')).toBe(true)
    })

    it('should evaluate <> not-equal operator', () => {
      expect(evalFormula('=5<>3')).toBe(true)
      expect(evalFormula('=5<>5')).toBe(false)
    })
  })

  describe('string concatenation', () => {
    it('should concatenate strings with &', () => {
      expect(evalFormula('="hello"&" "&"world"')).toBe('hello world')
    })

    it('should concatenate number and string with &', () => {
      expect(evalFormula('="count: "&42')).toBe('count: 42')
    })
  })

  describe('boolean values', () => {
    it('should evaluate TRUE as true', () => {
      expect(evalFormula('=TRUE')).toBe(true)
    })

    it('should evaluate FALSE as false', () => {
      expect(evalFormula('=FALSE')).toBe(false)
    })
  })

  describe('type coercion', () => {
    it('should coerce boolean to number in arithmetic (TRUE=1, FALSE=0)', () => {
      expect(evalFormula('=TRUE+1')).toBe(2)
      expect(evalFormula('=FALSE+1')).toBe(1)
    })

    it('should coerce empty string to 0 in arithmetic', () => {
      expect(evalFormula('=""+1')).toBe(1)
    })

    it('should coerce numeric string to number in arithmetic', () => {
      expect(evalFormula('="5"+3')).toBe(8)
    })

    it('should coerce non-numeric string to 0 in arithmetic', () => {
      expect(evalFormula('="abc"+1')).toBe(1)
    })
  })

  describe('cell reference resolution', () => {
    it('should resolve A1 cell reference', () => {
      const result = evalWithGrid('=A1', { A1: 42 })
      expect(result).toBe(42)
    })

    it('should resolve cell references in arithmetic', () => {
      const result = evalWithGrid('=A1+B1', { A1: 10, B1: 20 })
      expect(result).toBe(30)
    })

    it('should resolve range reference in SUM', () => {
      const result = evalWithGrid('=SUM(A1:A3)', {
        A1: 1,
        A2: 2,
        A3: 3,
      })
      expect(result).toBe(6)
    })

    it('should return undefined for missing cell ref', () => {
      const result = evalWithGrid('=A99', {})
      expect(result).toBe(undefined)
    })
  })

  describe('error handling', () => {
    it('should throw FormulaError on unknown function', () => {
      expect(() => evalFormula('=NONEXISTENT(1)')).toThrow(FormulaError)
    })

    it('should throw FormulaError on unknown unary operator', () => {
      // This one is hard to trigger since the parser limits ops,
      // but we can test the evaluator directly
      const ast = { type: 'unaryOp' as const, operator: '~', operand: { type: 'number' as const, value: 1 } }
      expect(() => evaluate(ast, noop, noopRange)).toThrow(FormulaError)
    })

    it('should throw FormulaError on unknown binary operator', () => {
      const ast = {
        type: 'binaryOp' as const,
        operator: '$$',
        left: { type: 'number' as const, value: 1 },
        right: { type: 'number' as const, value: 2 },
      }
      expect(() => evaluate(ast, noop, noopRange)).toThrow(FormulaError)
    })
  })
})

// ===========================================================================
// CELL REFERENCE UTILITIES
// ===========================================================================

describe('Cell Reference Utilities', () => {
  describe('columnIndexToLetter', () => {
    it('should convert 0 to A', () => {
      expect(columnIndexToLetter(0)).toBe('A')
    })

    it('should convert 25 to Z', () => {
      expect(columnIndexToLetter(25)).toBe('Z')
    })

    it('should convert 26 to AA', () => {
      expect(columnIndexToLetter(26)).toBe('AA')
    })

    it('should convert 27 to AB', () => {
      expect(columnIndexToLetter(27)).toBe('AB')
    })
  })

  describe('letterToColumnIndex', () => {
    it('should convert A to 0', () => {
      expect(letterToColumnIndex('A')).toBe(0)
    })

    it('should convert Z to 25', () => {
      expect(letterToColumnIndex('Z')).toBe(25)
    })

    it('should convert AA to 26', () => {
      expect(letterToColumnIndex('AA')).toBe(26)
    })

    it('should be case-insensitive', () => {
      expect(letterToColumnIndex('a')).toBe(0)
      expect(letterToColumnIndex('aa')).toBe(26)
    })
  })

  describe('parseCellRef', () => {
    it('should parse A1 to row=0, col=0', () => {
      expect(parseCellRef('A1')).toEqual({ row: 0, col: 0 })
    })

    it('should parse B2 to row=1, col=1', () => {
      expect(parseCellRef('B2')).toEqual({ row: 1, col: 1 })
    })

    it('should parse Z100 correctly', () => {
      expect(parseCellRef('Z100')).toEqual({ row: 99, col: 25 })
    })

    it('should parse AA1 (column 26) correctly', () => {
      expect(parseCellRef('AA1')).toEqual({ row: 0, col: 26 })
    })

    it('should return null for invalid ref', () => {
      expect(parseCellRef('123')).toBe(null)
      expect(parseCellRef('ABC')).toBe(null)
      expect(parseCellRef('')).toBe(null)
    })

    it('should return null for row 0 (A0 is invalid in A1 notation)', () => {
      expect(parseCellRef('A0')).toBe(null)
    })
  })

  describe('cellRefToString', () => {
    it('should convert {row:0, col:0} to A1', () => {
      expect(cellRefToString({ row: 0, col: 0 })).toBe('A1')
    })

    it('should convert {row:2, col:1} to B3', () => {
      expect(cellRefToString({ row: 2, col: 1 })).toBe('B3')
    })
  })

  describe('parseRangeRef', () => {
    it('should parse A1:B2', () => {
      const range = parseRangeRef('A1:B2')
      expect(range).toEqual({
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 },
      })
    })

    it('should normalize reversed ranges (B2:A1 -> A1:B2)', () => {
      const range = parseRangeRef('B2:A1')
      expect(range!.start.row).toBeLessThanOrEqual(range!.end.row)
      expect(range!.start.col).toBeLessThanOrEqual(range!.end.col)
    })

    it('should return null for invalid ranges', () => {
      expect(parseRangeRef('A1')).toBe(null)
      expect(parseRangeRef('invalid')).toBe(null)
    })
  })

  describe('expandRange', () => {
    it('should expand A1:B2 to 4 cells', () => {
      const range = parseRangeRef('A1:B2')!
      const cells = expandRange(range)
      expect(cells).toHaveLength(4)
      expect(cells).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ])
    })

    it('should expand single cell range A1:A1 to 1 cell', () => {
      const range = parseRangeRef('A1:A1')!
      const cells = expandRange(range)
      expect(cells).toHaveLength(1)
    })

    it('should expand column range A1:A5 to 5 cells', () => {
      const range = parseRangeRef('A1:A5')!
      const cells = expandRange(range)
      expect(cells).toHaveLength(5)
    })
  })

  describe('extractReferences', () => {
    it('should extract cell references from formula', () => {
      const refs = extractReferences('=A1+B2')
      expect(refs).toEqual(
        expect.arrayContaining([
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ])
      )
    })

    it('should extract range references', () => {
      const refs = extractReferences('=SUM(A1:A3)')
      expect(refs.length).toBeGreaterThanOrEqual(3)
    })

    it('should handle formula without = prefix', () => {
      const refs = extractReferences('A1+B1')
      expect(refs.length).toBeGreaterThanOrEqual(2)
    })
  })
})
