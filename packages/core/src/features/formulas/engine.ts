// @yable/core — Formula Engine
// Manages formulas, dependency tracking, topological sort, and circular reference detection.

import type { RowData, Table } from '../../types'
import { parseFormula, FormulaError } from './parser'
import { evaluate } from './evaluator'
import {
  parseCellRef,
  parseRangeRef,
  expandRange,
  cellRefToString,
  extractReferences,
} from './cellRef'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormulaEntry {
  formula: string       // Raw formula string (with leading '=')
  cellId: string        // Table cell ID: `${rowId}_${columnId}`
  rowId: string
  columnId: string
  dependencies: string[] // Cell IDs this formula depends on
}

// ---------------------------------------------------------------------------
// FormulaEngine
// ---------------------------------------------------------------------------

export class FormulaEngine<TData extends RowData = any> {
  private table: Table<TData>
  private formulas: Map<string, FormulaEntry> = new Map()
  private computedValues: Map<string, unknown> = new Map()
  private errors: Map<string, string> = new Map()

  constructor(table: Table<TData>) {
    this.table = table
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Sets a formula on a cell. If the value starts with '=', it's treated as
   * a formula; otherwise, it's stored as a regular value.
   */
  setFormula(rowId: string, columnId: string, formula: string): void {
    const cellId = `${rowId}_${columnId}`

    if (!formula.startsWith('=')) {
      // Not a formula — remove any existing formula for this cell
      this.formulas.delete(cellId)
      this.computedValues.delete(cellId)
      this.errors.delete(cellId)
      return
    }

    // Extract dependencies
    const deps = this.extractDependencies(formula)

    const entry: FormulaEntry = {
      formula,
      cellId,
      rowId,
      columnId,
      dependencies: deps,
    }

    this.formulas.set(cellId, entry)

    // Check for circular references
    const circular = this.detectCircular(cellId)
    if (circular) {
      this.errors.set(cellId, '#CIRCULAR!')
      this.computedValues.set(cellId, '#CIRCULAR!')
      return
    }

    // Evaluate the formula
    this.evaluateCell(cellId)
  }

  /**
   * Gets the raw formula string for a cell.
   */
  getFormula(rowId: string, columnId: string): string | undefined {
    const cellId = `${rowId}_${columnId}`
    return this.formulas.get(cellId)?.formula
  }

  /**
   * Gets the computed value for a cell.
   */
  getComputedValue(rowId: string, columnId: string): unknown {
    const cellId = `${rowId}_${columnId}`
    return this.computedValues.get(cellId)
  }

  /**
   * Gets the error message for a cell, if any.
   */
  getError(rowId: string, columnId: string): string | undefined {
    const cellId = `${rowId}_${columnId}`
    return this.errors.get(cellId)
  }

  /**
   * Evaluates all formulas in dependency order.
   */
  evaluateAll(): void {
    // Get evaluation order via topological sort
    const order = this.topologicalSort()

    for (const cellId of order) {
      this.evaluateCell(cellId)
    }
  }

  /**
   * Checks if a cell has a formula.
   */
  hasFormula(rowId: string, columnId: string): boolean {
    return this.formulas.has(`${rowId}_${columnId}`)
  }

  // -----------------------------------------------------------------------
  // Dependency Extraction
  // -----------------------------------------------------------------------

  /**
   * Extracts cell IDs that a formula depends on.
   * Converts A1-style references to table cell IDs using the table's rows/columns.
   */
  private extractDependencies(formula: string): string[] {
    const refs = extractReferences(formula)
    const deps: string[] = []
    const rows = this.table.getCoreRowModel().rows
    const columns = this.table.getVisibleLeafColumns()

    for (const ref of refs) {
      if (ref.row < rows.length && ref.col < columns.length) {
        const row = rows[ref.row]!
        const col = columns[ref.col]!
        deps.push(`${row.id}_${col.id}`)
      }
    }

    return [...new Set(deps)]
  }

  // -----------------------------------------------------------------------
  // Circular Reference Detection
  // -----------------------------------------------------------------------

  /**
   * Detects if adding/updating a formula for `cellId` creates a circular
   * dependency. Uses DFS cycle detection.
   */
  private detectCircular(startCellId: string): boolean {
    const visited = new Set<string>()
    const stack = new Set<string>()

    const hasCycle = (cellId: string): boolean => {
      if (stack.has(cellId)) return true // Back edge = cycle
      if (visited.has(cellId)) return false // Already fully explored

      visited.add(cellId)
      stack.add(cellId)

      const entry = this.formulas.get(cellId)
      if (entry) {
        for (const dep of entry.dependencies) {
          if (hasCycle(dep)) return true
        }
      }

      stack.delete(cellId)
      return false
    }

    return hasCycle(startCellId)
  }

  // -----------------------------------------------------------------------
  // Topological Sort
  // -----------------------------------------------------------------------

  /**
   * Returns cell IDs in topological order (dependencies before dependents).
   * Uses Kahn's algorithm.
   */
  private topologicalSort(): string[] {
    const inDegree = new Map<string, number>()
    const graph = new Map<string, Set<string>>() // dep -> dependents

    // Initialize
    for (const [cellId, entry] of this.formulas) {
      if (!inDegree.has(cellId)) {
        inDegree.set(cellId, 0)
      }

      for (const dep of entry.dependencies) {
        if (!graph.has(dep)) {
          graph.set(dep, new Set())
        }
        graph.get(dep)!.add(cellId)

        inDegree.set(cellId, (inDegree.get(cellId) ?? 0) + 1)
      }
    }

    // Find nodes with no incoming edges
    const queue: string[] = []
    for (const [cellId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(cellId)
      }
    }

    // Also add formula cells that have no tracked in-degree
    for (const cellId of this.formulas.keys()) {
      if (!inDegree.has(cellId) || inDegree.get(cellId) === 0) {
        if (!queue.includes(cellId)) {
          queue.push(cellId)
        }
      }
    }

    const result: string[] = []
    const processed = new Set<string>()

    while (queue.length > 0) {
      const cellId = queue.shift()!
      if (processed.has(cellId)) continue
      processed.add(cellId)

      if (this.formulas.has(cellId)) {
        result.push(cellId)
      }

      const dependents = graph.get(cellId)
      if (dependents) {
        for (const dep of dependents) {
          const newDegree = (inDegree.get(dep) ?? 1) - 1
          inDegree.set(dep, newDegree)
          if (newDegree === 0) {
            queue.push(dep)
          }
        }
      }
    }

    // Any remaining formula cells (e.g., circular) that weren't processed
    for (const cellId of this.formulas.keys()) {
      if (!processed.has(cellId)) {
        result.push(cellId)
      }
    }

    return result
  }

  // -----------------------------------------------------------------------
  // Cell Evaluation
  // -----------------------------------------------------------------------

  /**
   * Evaluates a single formula cell and stores the result.
   */
  private evaluateCell(cellId: string): void {
    const entry = this.formulas.get(cellId)
    if (!entry) return

    // Check if already marked as circular
    if (this.errors.get(cellId) === '#CIRCULAR!') return

    try {
      const ast = parseFormula(entry.formula)

      const getCellValue = (ref: string): unknown => {
        return this.resolveCellRef(ref)
      }

      const getRangeValues = (rangeRef: string): unknown[] => {
        return this.resolveRangeRef(rangeRef)
      }

      const result = evaluate(ast, getCellValue, getRangeValues)

      this.computedValues.set(cellId, result)
      this.errors.delete(cellId)

      // Store computed value as pending value so the table can read it
      this.table.setPendingValue(entry.rowId, entry.columnId, result)
    } catch (error) {
      const message = error instanceof FormulaError
        ? error.message
        : error instanceof Error
          ? `#ERROR! ${error.message}`
          : '#ERROR!'

      this.errors.set(cellId, message)
      this.computedValues.set(cellId, message)
    }
  }

  // -----------------------------------------------------------------------
  // Cell/Range Resolution
  // -----------------------------------------------------------------------

  /**
   * Resolves an A1-style cell reference to the cell's value.
   */
  private resolveCellRef(ref: string): unknown {
    const parsed = parseCellRef(ref)
    if (!parsed) return undefined

    const rows = this.table.getCoreRowModel().rows
    const columns = this.table.getVisibleLeafColumns()

    if (parsed.row >= rows.length || parsed.col >= columns.length) {
      return undefined
    }

    const row = rows[parsed.row]!
    const col = columns[parsed.col]!
    const cellId = `${row.id}_${col.id}`

    // Check if there's a computed formula value for this cell
    if (this.computedValues.has(cellId)) {
      return this.computedValues.get(cellId)
    }

    // Check pending values
    const pendingValue = this.table.getPendingValue(row.id, col.id)
    if (pendingValue !== undefined) {
      return pendingValue
    }

    // Fall back to the raw row value
    return row.getValue(col.id)
  }

  /**
   * Resolves a range reference (e.g., 'A1:A10') to an array of values.
   */
  private resolveRangeRef(rangeRef: string): unknown[] {
    const parsed = parseRangeRef(rangeRef)
    if (!parsed) return []

    const cells = expandRange(parsed)
    return cells.map((cell) => {
      const ref = cellRefToString(cell)
      return this.resolveCellRef(ref)
    })
  }
}
