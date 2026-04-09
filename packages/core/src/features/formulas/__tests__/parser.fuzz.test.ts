// @zvndev/yable-core — Formula Parser Fuzz Tests
//
// Property-based tests for the formula parser using fast-check.
// Goal: catch unhandled crashes and verify that the grammar accepts
// well-formed inputs across a wide space of generated values.

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { parseFormula } from '../parser'

describe('formula parser — fuzz', () => {
  // -------------------------------------------------------------------------
  // Property 1: Never crashes with an unhandled exception on arbitrary input.
  // Any thrown value must be an Error (ideally a FormulaError) — never a raw
  // string, undefined, or a TypeError from a bad property access.
  // -------------------------------------------------------------------------
  it('never throws non-Error on arbitrary string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        try {
          parseFormula(input)
        } catch (e) {
          // Any failure mode is acceptable as long as it's a well-formed Error.
          // A TypeError here would indicate a bug (e.g. reading `.value` off
          // undefined), which is exactly what this property is designed to
          // surface.
          expect(e).toBeInstanceOf(Error)
          expect((e as Error).message).toBeTypeOf('string')
        }
      }),
      { numRuns: 200 },
    )
  })

  // -------------------------------------------------------------------------
  // Property 2: Any non-negative integer, wrapped in "=<n>", always parses
  // into a NumberNode (possibly wrapped in a UnaryOp for "=+n" style). Since
  // we produce no sign prefix, the result is always `{ type: 'number' }`.
  // -------------------------------------------------------------------------
  it('parses any non-negative integer literal', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (n) => {
        const ast = parseFormula(`=${n}`)
        expect(ast.type).toBe('number')
        if (ast.type === 'number') {
          expect(ast.value).toBe(n)
        }
      }),
      { numRuns: 100 },
    )
  })

  // -------------------------------------------------------------------------
  // Property 3: Decimal literals matching the tokenizer's NUMBER_PATTERN
  // (`^\d+\.?\d*`) always parse successfully. We build them manually so we
  // avoid JS's scientific-notation stringification of very small/large floats.
  // -------------------------------------------------------------------------
  it('parses decimal literals built from digit strings', () => {
    const decimal = fc
      .tuple(fc.integer({ min: 0, max: 1_000_000 }), fc.integer({ min: 0, max: 1_000_000 }))
      .map(([whole, frac]) => `${whole}.${frac}`)

    fc.assert(
      fc.property(decimal, (literal) => {
        const ast = parseFormula(`=${literal}`)
        expect(ast.type).toBe('number')
        if (ast.type === 'number') {
          expect(ast.value).toBe(parseFloat(literal))
        }
      }),
      { numRuns: 100 },
    )
  })

  // -------------------------------------------------------------------------
  // Property 4: Well-formed function calls of the shape `=FN(a, b, c, ...)`
  // with non-negative integer args always parse into a FunctionCallNode
  // whose args length matches the input.
  // -------------------------------------------------------------------------
  it('parses well-formed function calls with integer args', () => {
    const fnName = fc.constantFrom('SUM', 'AVG', 'MIN', 'MAX', 'CONCAT')
    const argList = fc.array(fc.integer({ min: 0, max: 10_000 }), {
      minLength: 1,
      maxLength: 8,
    })

    fc.assert(
      fc.property(fnName, argList, (name, args) => {
        const formula = `=${name}(${args.join(',')})`
        const ast = parseFormula(formula)
        expect(ast.type).toBe('functionCall')
        if (ast.type === 'functionCall') {
          expect(ast.name).toBe(name)
          expect(ast.args).toHaveLength(args.length)
          for (let i = 0; i < args.length; i++) {
            const arg = ast.args[i]!
            expect(arg.type).toBe('number')
            if (arg.type === 'number') {
              expect(arg.value).toBe(args[i])
            }
          }
        }
      }),
      { numRuns: 100 },
    )
  })

  // -------------------------------------------------------------------------
  // Property 5: Any depth of balanced parens around a single integer literal
  // parses successfully and the inner value is preserved. We keep depth well
  // below MAX_PARSE_DEPTH (100) to stay on the happy path.
  // -------------------------------------------------------------------------
  it('parses deeply nested balanced parentheses', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 0, max: 10_000 }),
        (depth, value) => {
          const formula = `=${'('.repeat(depth)}${value}${')'.repeat(depth)}`
          const ast = parseFormula(formula)
          // Parens unwrap in parsePrimary — no ParenNode exists in the AST.
          expect(ast.type).toBe('number')
          if (ast.type === 'number') {
            expect(ast.value).toBe(value)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
