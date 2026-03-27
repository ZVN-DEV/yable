// @yable/core — Clipboard Feature
// Copy (Ctrl+C), Cut (Ctrl+X), Paste (Ctrl+V) with configurable delimiters.

import type { RowData, Table, Row, Column } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SerializeOptions {
  /** Column delimiter. Default: '\t' */
  delimiter: string
  /** Row delimiter. Default: '\n' */
  rowDelimiter: string
  /** Include column headers as first row. Default: false */
  includeHeaders: boolean
}

export interface ParseOptions {
  /** Column delimiter. Default: '\t' */
  delimiter: string
  /** Row delimiter. Default: '\n' */
  rowDelimiter: string
}

// ---------------------------------------------------------------------------
// Serialize cells to clipboard text (TSV by default)
// ---------------------------------------------------------------------------

/**
 * Converts rows and columns into a delimited string suitable for clipboard.
 * By default uses tab-separated values for Excel compatibility.
 */
export function serializeCells<TData extends RowData>(
  rows: Row<TData>[],
  columns: Column<TData, unknown>[],
  options: SerializeOptions
): string {
  const { delimiter, rowDelimiter, includeHeaders } = options
  const lines: string[] = []

  // Optional header row
  if (includeHeaders) {
    const headerLine = columns
      .map((col) => {
        const header = typeof col.columnDef.header === 'string'
          ? col.columnDef.header
          : col.id
        return escapeDelimited(header, delimiter)
      })
      .join(delimiter)
    lines.push(headerLine)
  }

  // Data rows
  for (const row of rows) {
    const cellValues = columns.map((col) => {
      const value = row.getValue(col.id)
      return escapeDelimited(formatCellValue(value), delimiter)
    })
    lines.push(cellValues.join(delimiter))
  }

  return lines.join(rowDelimiter)
}

// ---------------------------------------------------------------------------
// Parse clipboard text into 2D array
// ---------------------------------------------------------------------------

/**
 * Parses a delimited text string (typically from clipboard) into a 2D array
 * of string values.
 */
export function parseClipboardText(
  text: string,
  options: ParseOptions
): string[][] {
  const { delimiter, rowDelimiter } = options

  if (!text || text.trim() === '') return []

  const rows = text.split(rowDelimiter)

  // Remove trailing empty row (common with clipboard)
  if (rows.length > 0 && rows[rows.length - 1]!.trim() === '') {
    rows.pop()
  }

  return rows.map((row) => {
    // Handle quoted values (e.g., from Excel)
    const cells: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < row.length; i++) {
      const char = row[i]!

      if (inQuotes) {
        if (char === '"') {
          // Check for escaped quote
          if (i + 1 < row.length && row[i + 1] === '"') {
            current += '"'
            i++ // Skip next quote
          } else {
            inQuotes = false
          }
        } else {
          current += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === delimiter || (delimiter === '\t' && char === '\t')) {
          cells.push(current)
          current = ''
        } else {
          current += char
        }
      }
    }

    cells.push(current)
    return cells
  })
}

// ---------------------------------------------------------------------------
// Apply parsed clipboard data to target cells
// ---------------------------------------------------------------------------

/**
 * Applies a 2D array of values to the table starting from the target cell.
 * Returns the list of affected cells.
 */
export function applyCellPaste<TData extends RowData>(
  table: Table<TData>,
  data: string[][],
  targetRowId: string,
  targetColumnId: string,
  rows: Row<TData>[],
  columns: Column<TData, unknown>[]
): { rowId: string; columnId: string; value: unknown }[] {
  const pastedCells: { rowId: string; columnId: string; value: unknown }[] = []

  // Find the starting position
  const startRowIndex = rows.findIndex((r) => r.id === targetRowId)
  const startColIndex = columns.findIndex((c) => c.id === targetColumnId)

  if (startRowIndex === -1 || startColIndex === -1) return pastedCells

  for (let rowOffset = 0; rowOffset < data.length; rowOffset++) {
    const rowData = data[rowOffset]
    if (!rowData) continue

    const targetRowIndex = startRowIndex + rowOffset
    if (targetRowIndex >= rows.length) break

    const targetRow = rows[targetRowIndex]!

    for (let colOffset = 0; colOffset < rowData.length; colOffset++) {
      const targetColIndex = startColIndex + colOffset
      if (targetColIndex >= columns.length) break

      const targetCol = columns[targetColIndex]!
      const value = rowData[colOffset]!

      // Check if the column is editable
      const editable = (targetCol.columnDef as any).editable
      if (editable === false) continue

      // Parse value based on column edit config
      const editConfig = (targetCol.columnDef as any).editConfig
      let parsedValue: unknown = value

      if (editConfig?.parse) {
        try {
          parsedValue = editConfig.parse(value)
        } catch {
          parsedValue = value
        }
      } else if (editConfig?.type === 'number') {
        const num = Number(value)
        parsedValue = isNaN(num) ? value : num
      }

      table.setPendingValue(targetRow.id, targetCol.id, parsedValue)
      pastedCells.push({
        rowId: targetRow.id,
        columnId: targetCol.id,
        value: parsedValue,
      })
    }
  }

  return pastedCells
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCellValue(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function escapeDelimited(value: string, delimiter: string): string {
  // If the value contains the delimiter, quotes, or newlines, wrap in quotes
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
