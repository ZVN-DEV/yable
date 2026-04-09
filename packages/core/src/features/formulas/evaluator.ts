// @zvndev/yable-core — Formula AST Evaluator
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

/** T1-07: Maximum recursion depth for formula evaluation */
const MAX_EVAL_DEPTH = 100

/**
 * Evaluates a formula AST node, resolving cell references using the provided
 * resolver functions.
 *
 * @param node - The AST node to evaluate
 * @param getCellValue - Resolves cell references to values
 * @param getRangeValues - Resolves range references to arrays of values
 * @param _depth - Internal recursion depth counter (do not pass manually)
 */
export function evaluate(
  node: ASTNode,
  getCellValue: CellValueResolver,
  getRangeValues: RangeValueResolver,
  _depth: number = 0,
): unknown {
  if (_depth > MAX_EVAL_DEPTH) {
    throw new FormulaError(
      `[yable E008] Formula evaluation exceeds maximum recursion depth of ${MAX_EVAL_DEPTH}. Check for circular references or overly complex expressions.`,
    )
  }

  const nextDepth = _depth + 1

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
      return evaluateUnaryOp(node.operator, node.operand, getCellValue, getRangeValues, nextDepth)

    case 'binaryOp':
      return evaluateBinaryOp(
        node.operator,
        node.left,
        node.right,
        getCellValue,
        getRangeValues,
        nextDepth,
      )

    case 'functionCall':
      return evaluateFunctionCall(node.name, node.args, getCellValue, getRangeValues, nextDepth)

    default: {
      const exhaustive: never = node
      throw new FormulaError(
        `[yable E013] Unknown AST node type: ${(exhaustive as { type: string }).type}`,
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

function evaluateUnaryOp(
  operator: string,
  operand: ASTNode,
  getCellValue: CellValueResolver,
  getRangeValues: RangeValueResolver,
  depth: number,
): unknown {
  const value = evaluate(operand, getCellValue, getRangeValues, depth)

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
  getRangeValues: RangeValueResolver,
  depth: number,
): unknown {
  const leftVal = evaluate(left, getCellValue, getRangeValues, depth)
  const rightVal = evaluate(right, getCellValue, getRangeValues, depth)

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
  getRangeValues: RangeValueResolver,
  depth: number,
): unknown {
  const fn = builtInFunctions[name]

  if (!fn) {
    throw new FormulaError(`[yable E007] Unknown function: ${name}`)
  }

  // Evaluate each argument
  const evaluatedArgs = args.map((arg) => evaluate(arg, getCellValue, getRangeValues, depth))

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
