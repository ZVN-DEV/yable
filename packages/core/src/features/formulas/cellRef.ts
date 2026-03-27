// @yable/core — Formula Cell Reference Parser
// Converts between A1-style references and {row, col} coordinates.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CellReference {
  row: number // 0-based row index
  col: number // 0-based column index
}

export interface CellRange {
  start: CellReference
  end: CellReference
}

// ---------------------------------------------------------------------------
// Column letter <-> index conversion
// ---------------------------------------------------------------------------

/**
 * Converts a 0-based column index to a column letter (A, B, ..., Z, AA, AB, ...).
 */
export function columnIndexToLetter(index: number): string {
  let result = ''
  let n = index

  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result
    n = Math.floor(n / 26) - 1
  }

  return result
}

/**
 * Converts a column letter (A, B, ..., Z, AA, AB, ...) to a 0-based column index.
 */
export function letterToColumnIndex(letter: string): number {
  let result = 0
  const upper = letter.toUpperCase()

  for (let i = 0; i < upper.length; i++) {
    result = result * 26 + (upper.charCodeAt(i) - 64)
  }

  return result - 1 // Convert to 0-based
}

// ---------------------------------------------------------------------------
// Cell reference parsing
// ---------------------------------------------------------------------------

/**
 * Regex for a single cell reference: column letter(s) + row number.
 * e.g., A1, B3, AA10, ZZ100
 */
const CELL_REF_REGEX = /^([A-Za-z]+)(\d+)$/

/**
 * Parses an A1-style cell reference string into row and column indices.
 * Row numbers in A1 notation are 1-based, but we return 0-based indices.
 *
 * @example parseCellRef('A1') => { row: 0, col: 0 }
 * @example parseCellRef('B3') => { row: 2, col: 1 }
 */
export function parseCellRef(ref: string): CellReference | null {
  const match = ref.match(CELL_REF_REGEX)
  if (!match) return null

  const colLetter = match[1]!
  const rowNum = parseInt(match[2]!, 10)

  if (isNaN(rowNum) || rowNum < 1) return null

  return {
    row: rowNum - 1, // Convert 1-based to 0-based
    col: letterToColumnIndex(colLetter),
  }
}

/**
 * Converts a CellReference back to an A1-style string.
 *
 * @example cellRefToString({ row: 0, col: 0 }) => 'A1'
 * @example cellRefToString({ row: 2, col: 1 }) => 'B3'
 */
export function cellRefToString(ref: CellReference): string {
  return `${columnIndexToLetter(ref.col)}${ref.row + 1}`
}

/**
 * Regex for a range reference: A1:B2
 */
const RANGE_REF_REGEX = /^([A-Za-z]+\d+):([A-Za-z]+\d+)$/

/**
 * Parses a range reference string (e.g., 'A1:B10') into start and end cell references.
 */
export function parseRangeRef(ref: string): CellRange | null {
  const match = ref.match(RANGE_REF_REGEX)
  if (!match) return null

  const start = parseCellRef(match[1]!)
  const end = parseCellRef(match[2]!)

  if (!start || !end) return null

  return {
    start: {
      row: Math.min(start.row, end.row),
      col: Math.min(start.col, end.col),
    },
    end: {
      row: Math.max(start.row, end.row),
      col: Math.max(start.col, end.col),
    },
  }
}

/**
 * Expands a range into an array of individual cell references.
 */
export function expandRange(range: CellRange): CellReference[] {
  const cells: CellReference[] = []

  for (let row = range.start.row; row <= range.end.row; row++) {
    for (let col = range.start.col; col <= range.end.col; col++) {
      cells.push({ row, col })
    }
  }

  return cells
}

/**
 * Extracts all cell references and range references from a formula string.
 * Returns them as CellReference arrays.
 */
export function extractReferences(formula: string): CellReference[] {
  const refs: CellReference[] = []
  // Remove the leading '=' if present
  const expr = formula.startsWith('=') ? formula.slice(1) : formula

  // Match range references first (A1:B2)
  const rangeRegex = /([A-Za-z]+\d+):([A-Za-z]+\d+)/g
  let rangeMatch: RegExpExecArray | null
  const rangeSpans: [number, number][] = []

  while ((rangeMatch = rangeRegex.exec(expr)) !== null) {
    const range = parseRangeRef(rangeMatch[0])
    if (range) {
      refs.push(...expandRange(range))
      rangeSpans.push([rangeMatch.index, rangeMatch.index + rangeMatch[0].length])
    }
  }

  // Match single cell references, skipping those inside ranges
  const cellRegex = /([A-Za-z]+)(\d+)/g
  let cellMatch: RegExpExecArray | null

  while ((cellMatch = cellRegex.exec(expr)) !== null) {
    // Skip if this match is inside a range span
    const pos = cellMatch.index
    const isInRange = rangeSpans.some(
      ([start, end]) => pos >= start && pos < end
    )
    if (isInRange) continue

    // Skip if it looks like a function name (letters only, no digits would mean it's not a cell)
    const full = cellMatch[0]
    const ref = parseCellRef(full)
    if (ref) {
      refs.push(ref)
    }
  }

  return refs
}
