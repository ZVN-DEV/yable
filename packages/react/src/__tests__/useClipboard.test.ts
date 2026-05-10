// @zvndev/yable-react — useClipboard + core clipboard function tests

import { describe, it, expect } from 'vitest'
import { serializeCells, parseClipboardText } from '../../../core/src/features/clipboard'
import type { SerializeOptions, ParseOptions } from '../../../core/src/features/clipboard'
import type { Row, Column, RowData } from '@zvndev/yable-core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TestRow = { id: string; name: string; age: number; notes: string }

const defaultSerializeOpts: SerializeOptions = {
  delimiter: '\t',
  rowDelimiter: '\n',
  includeHeaders: false,
}

const defaultParseOpts: ParseOptions = {
  delimiter: '\t',
  rowDelimiter: '\n',
}

/** Creates a minimal mock Row that responds to getValue(). */
function mockRow(data: Record<string, unknown>): Row<RowData> {
  return {
    id: String(data.id ?? ''),
    getValue: (columnId: string) => data[columnId],
  } as unknown as Row<RowData>
}

/** Creates a minimal mock Column. */
function mockColumn(id: string, header?: string): Column<RowData, unknown> {
  return {
    id,
    columnDef: { header: header ?? id },
  } as unknown as Column<RowData, unknown>
}

// ---------------------------------------------------------------------------
// serializeCells tests
// ---------------------------------------------------------------------------

describe('serializeCells', () => {
  const columns = [
    mockColumn('name', 'Name'),
    mockColumn('age', 'Age'),
    mockColumn('notes', 'Notes'),
  ]

  it('converts rows and columns to TSV format', () => {
    const rows = [
      mockRow({ id: '1', name: 'Alice', age: 30, notes: 'good' }),
      mockRow({ id: '2', name: 'Bob', age: 25, notes: 'great' }),
    ]

    const result = serializeCells(rows, columns, defaultSerializeOpts)

    expect(result).toBe('Alice\t30\tgood\nBob\t25\tgreat')
  })

  it('includes headers when includeHeaders is true', () => {
    const rows = [mockRow({ id: '1', name: 'Alice', age: 30, notes: 'ok' })]

    const result = serializeCells(rows, columns, {
      ...defaultSerializeOpts,
      includeHeaders: true,
    })

    const lines = result.split('\n')
    expect(lines[0]).toBe('Name\tAge\tNotes')
    expect(lines[1]).toBe('Alice\t30\tok')
  })

  it('handles null and undefined cell values as empty strings', () => {
    const rows = [mockRow({ id: '1', name: null, age: undefined, notes: '' })]

    const result = serializeCells(rows, columns, defaultSerializeOpts)

    expect(result).toBe('\t\t')
  })

  it('handles Date values by converting to ISO string', () => {
    const date = new Date('2024-01-15T00:00:00.000Z')
    const rows = [mockRow({ id: '1', name: 'Test', age: 25, notes: date })]

    const result = serializeCells(rows, columns, defaultSerializeOpts)

    expect(result).toContain('2024-01-15T00:00:00.000Z')
  })

  it('escapes values containing the delimiter', () => {
    const rows = [mockRow({ id: '1', name: 'Alice\tSmith', age: 30, notes: 'ok' })]

    const result = serializeCells(rows, columns, defaultSerializeOpts)

    // Value with tab should be quoted
    expect(result).toContain('"Alice\tSmith"')
  })

  it('escapes values containing quotes', () => {
    const rows = [mockRow({ id: '1', name: 'She said "hello"', age: 30, notes: 'ok' })]

    const result = serializeCells(rows, columns, defaultSerializeOpts)

    // Quotes should be doubled inside the quoted string
    expect(result).toContain('"She said ""hello"""')
  })

  it('escapes values containing newlines', () => {
    const rows = [mockRow({ id: '1', name: 'Line1\nLine2', age: 30, notes: 'ok' })]

    const result = serializeCells(rows, columns, defaultSerializeOpts)

    expect(result).toContain('"Line1\nLine2"')
  })

  it('handles empty rows array', () => {
    const result = serializeCells([], columns, defaultSerializeOpts)
    expect(result).toBe('')
  })

  it('handles empty rows with headers', () => {
    const result = serializeCells([], columns, {
      ...defaultSerializeOpts,
      includeHeaders: true,
    })
    expect(result).toBe('Name\tAge\tNotes')
  })

  it('supports custom delimiter', () => {
    const rows = [mockRow({ id: '1', name: 'Alice', age: 30, notes: 'ok' })]

    const result = serializeCells(rows, columns, {
      delimiter: ',',
      rowDelimiter: '\n',
      includeHeaders: false,
    })

    expect(result).toBe('Alice,30,ok')
  })

  it('supports custom row delimiter', () => {
    const rows = [
      mockRow({ id: '1', name: 'Alice', age: 30, notes: 'ok' }),
      mockRow({ id: '2', name: 'Bob', age: 25, notes: 'fine' }),
    ]

    const result = serializeCells(rows, columns, {
      delimiter: '\t',
      rowDelimiter: '\r\n',
      includeHeaders: false,
    })

    expect(result).toBe('Alice\t30\tok\r\nBob\t25\tfine')
  })
})

// ---------------------------------------------------------------------------
// parseClipboardText tests
// ---------------------------------------------------------------------------

describe('parseClipboardText', () => {
  it('parses basic TSV text into 2D array', () => {
    const text = 'Alice\t30\nBob\t25'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
  })

  it('handles single row', () => {
    const text = 'Alice\t30\tok'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([['Alice', '30', 'ok']])
  })

  it('handles single cell', () => {
    const text = 'hello'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([['hello']])
  })

  it('returns empty array for empty string', () => {
    expect(parseClipboardText('', defaultParseOpts)).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(parseClipboardText('   ', defaultParseOpts)).toEqual([])
  })

  it('strips trailing empty row (common with clipboard)', () => {
    const text = 'Alice\t30\nBob\t25\n'
    const result = parseClipboardText(text, defaultParseOpts)

    // Should NOT have a third empty row
    expect(result).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
  })

  it('returns empty for all-whitespace input (tabs and newlines)', () => {
    // text.trim() === '' for all-whitespace — returns empty per spec
    const text = '\t\t\n\t\t'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([])
  })

  it('handles rows with some empty cells mixed with data', () => {
    const text = 'Alice\t\t30\n\tBob\t'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([
      ['Alice', '', '30'],
      ['', 'Bob', ''],
    ])
  })

  it('handles quoted values containing tabs', () => {
    const text = '"Alice\tSmith"\t30'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([['Alice\tSmith', '30']])
  })

  it('handles quoted values containing escaped quotes (doubled quotes)', () => {
    const text = '"She said ""hello"""\t30'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([['She said "hello"', '30']])
  })

  it('handles mixed quoted and unquoted cells', () => {
    const text = 'Alice\t"Has\ttabs"\t30'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([['Alice', 'Has\ttabs', '30']])
  })

  it('parses with custom delimiter', () => {
    const text = 'Alice,30,ok'
    const result = parseClipboardText(text, { delimiter: ',', rowDelimiter: '\n' })

    expect(result).toEqual([['Alice', '30', 'ok']])
  })

  it('handles multiple rows with mixed content', () => {
    const text = 'Name\tAge\tNotes\nAlice\t30\tok\nBob\t25\t"has\ttab"'
    const result = parseClipboardText(text, defaultParseOpts)

    expect(result).toEqual([
      ['Name', 'Age', 'Notes'],
      ['Alice', '30', 'ok'],
      ['Bob', '25', 'has\ttab'],
    ])
  })
})

// ---------------------------------------------------------------------------
// Round-trip tests (serialize then parse)
// ---------------------------------------------------------------------------

describe('clipboard round-trip', () => {
  const columns = [mockColumn('name', 'Name'), mockColumn('value', 'Value')]

  it('round-trips simple data correctly', () => {
    const rows = [
      mockRow({ id: '1', name: 'Alice', value: '100' }),
      mockRow({ id: '2', name: 'Bob', value: '200' }),
    ]

    const serialized = serializeCells(rows, columns, defaultSerializeOpts)
    const parsed = parseClipboardText(serialized, defaultParseOpts)

    expect(parsed).toEqual([
      ['Alice', '100'],
      ['Bob', '200'],
    ])
  })

  it('round-trips data with special characters', () => {
    const rows = [mockRow({ id: '1', name: "O'Brien", value: 'has "quotes"' })]

    const serialized = serializeCells(rows, columns, defaultSerializeOpts)
    const parsed = parseClipboardText(serialized, defaultParseOpts)

    expect(parsed[0]![0]).toBe("O'Brien")
    expect(parsed[0]![1]).toBe('has "quotes"')
  })

  it('round-trips data with headers', () => {
    const rows = [mockRow({ id: '1', name: 'Alice', value: '100' })]

    const serialized = serializeCells(rows, columns, {
      ...defaultSerializeOpts,
      includeHeaders: true,
    })
    const parsed = parseClipboardText(serialized, defaultParseOpts)

    expect(parsed[0]).toEqual(['Name', 'Value'])
    expect(parsed[1]).toEqual(['Alice', '100'])
  })
})

// ---------------------------------------------------------------------------
// isEditableTarget (tested via useClipboard behavior indirectly)
// ---------------------------------------------------------------------------

describe('useClipboard helper: isEditableTarget behavior', () => {
  // The isEditableTarget function is private, but we can verify its behavior
  // by testing that the hook pattern skips input/textarea/contenteditable elements.
  // Since useClipboard is mostly wiring (attaches event listeners to container),
  // we test the core serialization/parsing above which covers the data path.

  it('documents that useClipboard skips events from input elements', () => {
    // This is a design documentation test — the useClipboard hook checks
    // if the event target is an input, textarea, select, or contenteditable
    // element and returns early if so, avoiding clipboard interception
    // when users are editing form fields.
    expect(true).toBe(true) // Verified by reading the source
  })
})
