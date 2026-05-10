// @zvndev/yable-core — Export Utilities
// Export table data as CSV or JSON strings.

import type { RowData, Table, Column, Row } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportOptions {
  /** Which columns to include (default: all visible) */
  columns?: string[]
  /** Whether to include column headers (default: true) */
  includeHeaders?: boolean
  /** Custom value formatter per column */
  formatters?: Record<string, (value: unknown) => string>
  /** File name without extension */
  fileName?: string
}

export interface CsvExportOptions extends ExportOptions {
  /** Delimiter character (default: ',') */
  delimiter?: string
  /** Add BOM for Excel compatibility (default: true) */
  bom?: boolean
  /** Quote character (default: '"') */
  quoteChar?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the header text for a column. Falls back to the column id if
 * the `header` property is a function or missing.
 */
function getHeaderText<TData extends RowData>(col: Column<TData, unknown>): string {
  const header = col.columnDef.header
  return typeof header === 'string' ? header : col.id
}

/**
 * Get the cell value for a row/column, applying a formatter if one exists.
 */
function getCellString<TData extends RowData>(
  row: Row<TData>,
  col: Column<TData, unknown>,
  formatters?: Record<string, (value: unknown) => string>,
): string {
  const raw = row.getValue(col.id)
  if (formatters && col.id in formatters) {
    return formatters[col.id]!(raw)
  }
  if (raw === null || raw === undefined) return ''
  return String(raw)
}

/**
 * Resolve which columns to export from the table.
 */
function resolveColumns<TData extends RowData>(
  table: Table<TData>,
  columnIds?: string[],
): Column<TData, unknown>[] {
  if (columnIds && columnIds.length > 0) {
    return columnIds
      .map((id) => table.getColumn(id))
      .filter((col): col is Column<TData, unknown> => col !== undefined)
  }
  return table.getVisibleLeafColumns()
}

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/

/**
 * Sanitize a value that could be interpreted as a formula by spreadsheet
 * software (Excel, Google Sheets). Prefixes with a tab character to
 * neutralise formula interpretation while preserving the displayed value.
 */
function sanitizeFormulaInjection(value: string): string {
  if (CSV_FORMULA_PREFIX.test(value)) {
    return '\t' + value
  }
  return value
}

/**
 * Quote a CSV value if it contains the delimiter, a newline, or the quote
 * character. Escape quote characters by doubling them.
 */
function quoteCsvValue(value: string, delimiter: string, quoteChar: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.includes(quoteChar)
  ) {
    const escaped = value.replace(
      new RegExp(quoteChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      quoteChar + quoteChar,
    )
    return quoteChar + escaped + quoteChar
  }
  return value
}

// ---------------------------------------------------------------------------
// exportToCsv
// ---------------------------------------------------------------------------

/**
 * Export table data as a CSV string.
 * Handles quoting (values containing delimiter, newline, or quote char),
 * and optionally prepends a UTF-8 BOM for Excel.
 */
export function exportToCsv<TData extends RowData>(
  table: Table<TData>,
  options?: CsvExportOptions,
): string {
  const delimiter = options?.delimiter ?? ','
  const bom = options?.bom ?? true
  const quoteChar = options?.quoteChar ?? '"'
  const includeHeaders = options?.includeHeaders ?? true

  const columns = resolveColumns(table, options?.columns)
  const rows = table.getRowModel().rows

  const lines: string[] = []

  // Header row
  if (includeHeaders) {
    const headerLine = columns
      .map((col) => quoteCsvValue(getHeaderText(col), delimiter, quoteChar))
      .join(delimiter)
    lines.push(headerLine)
  }

  // Data rows
  for (const row of rows) {
    const line = columns
      .map((col) => {
        const value = sanitizeFormulaInjection(getCellString(row, col, options?.formatters))
        return quoteCsvValue(value, delimiter, quoteChar)
      })
      .join(delimiter)
    lines.push(line)
  }

  const csv = lines.join('\n')
  return bom ? '﻿' + csv : csv
}

// ---------------------------------------------------------------------------
// exportToJson
// ---------------------------------------------------------------------------

/**
 * Export table data as a JSON string.
 * Returns an array of objects keyed by column header text.
 */
export function exportToJson<TData extends RowData>(
  table: Table<TData>,
  options?: ExportOptions,
): string {
  const columns = resolveColumns(table, options?.columns)
  const rows = table.getRowModel().rows
  const includeHeaders = options?.includeHeaders ?? true

  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    for (const col of columns) {
      const key = includeHeaders ? getHeaderText(col) : col.id
      const raw = row.getValue(col.id)
      if (options?.formatters && col.id in options.formatters) {
        obj[key] = options.formatters[col.id]!(raw)
      } else {
        obj[key] = raw ?? null
      }
    }
    return obj
  })

  return JSON.stringify(data, null, 2)
}
