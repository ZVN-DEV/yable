// @yable/core — Formula AST Evaluator
// Evaluates an AST node, resolving cell references against the table.

import type { ASTNode } from './parser'
import { FormulaError } from './parser'
import { builtInFunctions } from './functions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Cell value resolver: given a cell reference string (e.g., 'A1'),
 * returns the cell's computed value.
 */
export type CellValueResolver = (ref: string) => unknown

/**
 * Range value resolver: given a range reference string (e.g., 'A1:A10'),
 * returns an array of cell values.
 */
export type RangeValueResolver = (rangeRef: string) => unknown[]

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluates a formula AST node, resolving cell references using the provided
 * resolver functions.
 */
export function evaluate(
  node: ASTNode,
  getCellValue: CellValueResolver,
  getRangeValues: RangeValueResolver
): unknown {
  switch (node.type) {
    case 'number':
      return node.value

    case 'string':
      return node.value

    case 'boolean':
      return node.value

    case 'cellRef':
      return getCellValue(node.ref)

    case 'rangeRef':
      return getRangeValues(node.ref)

    case 'unaryOp':
      return evaluateUnaryOp(node.operator, node.operand, getCellValue, getRangeValues)

    case 'binaryOp':
      return evaluateBinaryOp(
        node.operator,
        node.left,
        node.right,
        getCellValue,
        getRangeValues
      )

    case 'functionCall':
      return evaluateFunctionCall(
        node.name,
        node.args,
        getCellValue,
        getRangeValues
      )

    default:
      throw new FormulaError(`Unknown AST node type: ${(node as any).type}`)
  }
}

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

function evaluateUnaryOp(
  operator: string,
  operand: ASTNode,
  getCellValue: CellValueResolver,
  getRangeValues: RangeValueResolver
): unknown {
  const value = evaluate(operand, getCellValue, getRangeValues)

  switch (operator) {
    case '-':
      return -toNum(value)
    case '+':
      return +toNum(value)
    default:
      throw new FormulaError(`Unknown unary operator: ${operator}`)
  }
}

function evaluateBinaryOp(
  operator: string,
  left: ASTNode,
  right: ASTNode,
  getCellValue: CellValueResolver,
  getRangeValues: RangeValueResolver
): unknown {
  const leftVal = evaluate(left, getCellValue, getRangeValues)
  const rightVal = evaluate(right, getCellValue, getRangeValues)

  switch (operator) {
    case '+':
      return toNum(leftVal) + toNum(rightVal)
    case '-':
      return toNum(leftVal) - toNum(rightVal)
    case '*':
      return toNum(leftVal) * toNum(rightVal)
    case '/': {
      const divisor = toNum(rightVal)
      if (divisor === 0) throw new FormulaError('#DIV/0!')
      return toNum(leftVal) / divisor
    }
    case '^':
      return Math.pow(toNum(leftVal), toNum(rightVal))
    case '%':
      return toNum(leftVal) % toNum(rightVal)
    case '&':
      return String(leftVal ?? '') + String(rightVal ?? '')

    // Comparison operators
    case '=':
      return leftVal === rightVal || toNum(leftVal) === toNum(rightVal)
    case '<>':
    case '!=':
      return leftVal !== rightVal && toNum(leftVal) !== toNum(rightVal)
    case '>':
      return toNum(leftVal) > toNum(rightVal)
    case '<':
      return toNum(leftVal) < toNum(rightVal)
    case '>=':
      return toNum(leftVal) >= toNum(rightVal)
    case '<=':
      return toNum(leftVal) <= toNum(rightVal)

    default:
      throw new FormulaError(`Unknown operator: ${operator}`)
  }
}

function evaluateFunctionCall(
  name: string,
  args: ASTNode[],
  getCellValue: CellValueResolver,
  getRangeValues: RangeValueResolver
): unknown {
  const fn = builtInFunctions[name]

  if (!fn) {
    throw new FormulaError(`Unknown function: ${name}`)
  }

  // Evaluate each argument
  const evaluatedArgs = args.map((arg) =>
    evaluate(arg, getCellValue, getRangeValues)
  )

  return fn(evaluatedArgs)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    if (value.trim() === '') return 0
    const n = Number(value)
    return isNaN(n) ? 0 : n
  }
  return 0
}
