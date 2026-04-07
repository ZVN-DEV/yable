// @zvndev/yable-core — Formula Tokenizer & AST Builder
// Parses formula strings like "=SUM(A1:A10) + B2 * 3" into an AST.

// ---------------------------------------------------------------------------
// Token Types
// ---------------------------------------------------------------------------

export type TokenType =
  | 'number'
  | 'string'
  | 'cellRef'
  | 'rangeRef'
  | 'function'
  | 'operator'
  | 'paren_open'
  | 'paren_close'
  | 'comma'
  | 'boolean'

export interface Token {
  type: TokenType
  value: string
  position: number
}

// ---------------------------------------------------------------------------
// AST Node Types
// ---------------------------------------------------------------------------

export type ASTNode =
  | NumberNode
  | StringNode
  | BooleanNode
  | CellRefNode
  | RangeRefNode
  | BinaryOpNode
  | UnaryOpNode
  | FunctionCallNode

export interface NumberNode {
  type: 'number'
  value: number
}

export interface StringNode {
  type: 'string'
  value: string
}

export interface BooleanNode {
  type: 'boolean'
  value: boolean
}

export interface CellRefNode {
  type: 'cellRef'
  ref: string // e.g., 'A1'
}

export interface RangeRefNode {
  type: 'rangeRef'
  ref: string // e.g., 'A1:A10'
}

export interface BinaryOpNode {
  type: 'binaryOp'
  operator: string
  left: ASTNode
  right: ASTNode
}

export interface UnaryOpNode {
  type: 'unaryOp'
  operator: string
  operand: ASTNode
}

export interface FunctionCallNode {
  type: 'functionCall'
  name: string
  args: ASTNode[]
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const OPERATORS = new Set(['+', '-', '*', '/', '^', '%', '>', '<', '=', '!', '&'])
const CELL_REF_PATTERN = /^[A-Za-z]+\d+/
const RANGE_PATTERN = /^[A-Za-z]+\d+:[A-Za-z]+\d+/
const NUMBER_PATTERN = /^\d+\.?\d*/
const STRING_PATTERN = /^"([^"]*(?:""[^"]*)*)"/
const FUNCTION_PATTERN = /^[A-Za-z_]\w*(?=\()/
const BOOLEAN_PATTERN = /^(TRUE|FALSE)\b/i
const COMPARISON_OPERATORS = ['>=', '<=', '<>', '!=', '>', '<', '=']

export function tokenize(formula: string): Token[] {
  const tokens: Token[] = []

  // Remove leading '=' if present
  let input = formula.startsWith('=') ? formula.slice(1) : formula
  let position = formula.startsWith('=') ? 1 : 0

  while (input.length > 0) {
    // Skip whitespace
    const wsMatch = input.match(/^\s+/)
    if (wsMatch) {
      input = input.slice(wsMatch[0].length)
      position += wsMatch[0].length
      continue
    }

    // Boolean
    const boolMatch = input.match(BOOLEAN_PATTERN)
    if (boolMatch) {
      tokens.push({ type: 'boolean', value: boolMatch[0].toUpperCase(), position })
      input = input.slice(boolMatch[0].length)
      position += boolMatch[0].length
      continue
    }

    // Function name (must come before cell ref since they overlap)
    const funcMatch = input.match(FUNCTION_PATTERN)
    if (funcMatch) {
      tokens.push({ type: 'function', value: funcMatch[0].toUpperCase(), position })
      input = input.slice(funcMatch[0].length)
      position += funcMatch[0].length
      continue
    }

    // Range reference (must come before cell ref since range includes cell ref)
    const rangeMatch = input.match(RANGE_PATTERN)
    if (rangeMatch) {
      tokens.push({ type: 'rangeRef', value: rangeMatch[0].toUpperCase(), position })
      input = input.slice(rangeMatch[0].length)
      position += rangeMatch[0].length
      continue
    }

    // Cell reference
    const cellMatch = input.match(CELL_REF_PATTERN)
    if (cellMatch) {
      tokens.push({ type: 'cellRef', value: cellMatch[0].toUpperCase(), position })
      input = input.slice(cellMatch[0].length)
      position += cellMatch[0].length
      continue
    }

    // Number
    const numMatch = input.match(NUMBER_PATTERN)
    if (numMatch) {
      tokens.push({ type: 'number', value: numMatch[0], position })
      input = input.slice(numMatch[0].length)
      position += numMatch[0].length
      continue
    }

    // String literal
    const strMatch = input.match(STRING_PATTERN)
    if (strMatch) {
      const raw = strMatch[1]!.replace(/""/g, '"')
      tokens.push({ type: 'string', value: raw, position })
      input = input.slice(strMatch[0].length)
      position += strMatch[0].length
      continue
    }

    // Multi-character comparison operators
    let foundComparison = false
    for (const op of COMPARISON_OPERATORS) {
      if (input.startsWith(op)) {
        tokens.push({ type: 'operator', value: op, position })
        input = input.slice(op.length)
        position += op.length
        foundComparison = true
        break
      }
    }
    if (foundComparison) continue

    // Single character operators
    const char = input[0]!
    if (OPERATORS.has(char)) {
      tokens.push({ type: 'operator', value: char, position })
      input = input.slice(1)
      position++
      continue
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'paren_open', value: '(', position })
      input = input.slice(1)
      position++
      continue
    }

    if (char === ')') {
      tokens.push({ type: 'paren_close', value: ')', position })
      input = input.slice(1)
      position++
      continue
    }

    // Comma
    if (char === ',') {
      tokens.push({ type: 'comma', value: ',', position })
      input = input.slice(1)
      position++
      continue
    }

    // Unknown character
    throw new FormulaError(`Unexpected character '${char}' at position ${position}`)
  }

  return tokens
}

// ---------------------------------------------------------------------------
// Parser (Recursive Descent)
// ---------------------------------------------------------------------------

// Operator precedence (lower number = lower precedence)
const PRECEDENCE: Record<string, number> = {
  '=': 1,
  '<>': 1,
  '!=': 1,
  '<': 2,
  '>': 2,
  '<=': 2,
  '>=': 2,
  '&': 3, // String concatenation
  '+': 4,
  '-': 4,
  '*': 5,
  '/': 5,
  '%': 5,
  '^': 6,
}

const MAX_PARSE_DEPTH = 100

export class FormulaParser {
  private tokens: Token[]
  private pos: number
  private depth: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
    this.depth = 0
  }

  parse(): ASTNode {
    const node = this.parseExpression(0)

    if (this.pos < this.tokens.length) {
      throw new FormulaError(
        `Unexpected token '${this.tokens[this.pos]!.value}' at position ${this.tokens[this.pos]!.position}`
      )
    }

    return node
  }

  private guardDepth(): void {
    this.depth++
    if (this.depth > MAX_PARSE_DEPTH) {
      throw new FormulaError(
        `Formula exceeds maximum nesting depth of ${MAX_PARSE_DEPTH}. Simplify the expression.`
      )
    }
  }

  private parseExpression(minPrec: number): ASTNode {
    this.guardDepth()
    let left = this.parseUnary()

    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos]!

      if (token.type !== 'operator') break

      const prec = PRECEDENCE[token.value]
      if (prec === undefined || prec < minPrec) break

      this.pos++
      const right = this.parseExpression(prec + 1)

      left = {
        type: 'binaryOp',
        operator: token.value,
        left,
        right,
      }
    }

    return left
  }

  private parseUnary(): ASTNode {
    const token = this.tokens[this.pos]

    // Unary minus or plus
    if (token && token.type === 'operator' && (token.value === '-' || token.value === '+')) {
      this.pos++
      const operand = this.parseUnary()
      return {
        type: 'unaryOp',
        operator: token.value,
        operand,
      }
    }

    return this.parsePrimary()
  }

  private parsePrimary(): ASTNode {
    const token = this.tokens[this.pos]

    if (!token) {
      throw new FormulaError('Unexpected end of formula')
    }

    // Number
    if (token.type === 'number') {
      this.pos++
      return { type: 'number', value: parseFloat(token.value) }
    }

    // String
    if (token.type === 'string') {
      this.pos++
      return { type: 'string', value: token.value }
    }

    // Boolean
    if (token.type === 'boolean') {
      this.pos++
      return { type: 'boolean', value: token.value === 'TRUE' }
    }

    // Function call
    if (token.type === 'function') {
      return this.parseFunctionCall()
    }

    // Range reference
    if (token.type === 'rangeRef') {
      this.pos++
      return { type: 'rangeRef', ref: token.value }
    }

    // Cell reference
    if (token.type === 'cellRef') {
      this.pos++
      return { type: 'cellRef', ref: token.value }
    }

    // Parenthesized expression
    if (token.type === 'paren_open') {
      this.pos++
      const expr = this.parseExpression(0)

      const closeToken = this.tokens[this.pos]
      if (!closeToken || closeToken.type !== 'paren_close') {
        throw new FormulaError('Missing closing parenthesis')
      }
      this.pos++

      return expr
    }

    throw new FormulaError(
      `Unexpected token '${token.value}' at position ${token.position}`
    )
  }

  private parseFunctionCall(): FunctionCallNode {
    const nameToken = this.tokens[this.pos]!
    this.pos++

    // Expect open paren
    const openParen = this.tokens[this.pos]
    if (!openParen || openParen.type !== 'paren_open') {
      throw new FormulaError(`Expected '(' after function '${nameToken.value}'`)
    }
    this.pos++

    // Parse arguments
    const args: ASTNode[] = []

    // Check for empty function call
    if (this.pos < this.tokens.length && this.tokens[this.pos]!.type === 'paren_close') {
      this.pos++
      return { type: 'functionCall', name: nameToken.value, args }
    }

    // Parse first argument
    args.push(this.parseExpression(0))

    // Parse remaining arguments separated by commas
    while (this.pos < this.tokens.length && this.tokens[this.pos]!.type === 'comma') {
      this.pos++ // Skip comma
      args.push(this.parseExpression(0))
    }

    // Expect close paren
    const closeParen = this.tokens[this.pos]
    if (!closeParen || closeParen.type !== 'paren_close') {
      throw new FormulaError(`Expected ')' after function arguments in '${nameToken.value}'`)
    }
    this.pos++

    return { type: 'functionCall', name: nameToken.value, args }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a formula string into an AST.
 * Formula should start with '=' (which will be stripped).
 */
export function parseFormula(formula: string): ASTNode {
  const tokens = tokenize(formula)
  const parser = new FormulaParser(tokens)
  return parser.parse()
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class FormulaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FormulaError'
  }
}
