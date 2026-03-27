// @yable/core — Clipboard Tests

import { describe, it, expect } from 'vitest'
import {
  serializeCells,
  parseClipboardText,
} from '../clipboard'
import type { SerializeOptions, ParseOptions } from '../clipboard'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultSerializeOpts: SerializeOptions = {
  delimiter: '\t',
  rowDelimiter: '\n',
  includeHeaders: false,
}

const defaultParseOpts: ParseOptions = {
  delimiter: '\t',
  rowDelimiter: '\n',
}

/** Create mock rows with getValue */
function mockRows(data: Record<string, unknown>[]) {
  return data.map((d, i) => ({
    id: String(i),
    index: i,
    getValue: (colId: string) => d[colId],
  })) as any[]
}

/** Create mock columns */
function mockColumns(ids: string[], headers?: string[]) {
  return ids.map((id, i) => ({
    id,
    columnDef: { header: headers?.[i] ?? id },
  })) as any[]
}

// ===========================================================================
// serializeCells
// ===========================================================================

describe('serializeCells', () => {
  it('should serialize a 2D grid to TSV', () => {
    const rows = mockRows([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ])
    const cols = mockColumns(['name', 'age'])

    const result = serializeCells(rows, cols, defaultSerializeOpts)
    expect(result).toBe('Alice\t30\nBob\t25')
  })

  it('should include headers when includeHeaders is true', () => {
    const rows = mockRows([{ name: 'Alice' }])
    const cols = mockColumns(['name'], ['Name'])

    const result = serializeCells(rows, cols, {
      ...defaultSerializeOpts,
      includeHeaders: true,
    })
    expect(result).toBe('Name\nAlice')
  })

  it('should handle empty data', () => {
    const result = serializeCells([], mockColumns(['name']), defaultSerializeOpts)
    expect(result).toBe('')
  })

  it('should handle null/undefined values as empty strings', () => {
    const rows = mockRows([{ name: null, age: undefined }])
    const cols = mockColumns(['name', 'age'])

    const result = serializeCells(rows, cols, defaultSerializeOpts)
    expect(result).toBe('\t')
  })

  it('should escape values containing the delimiter', () => {
    const rows = mockRows([{ name: 'foo\tbar' }])
    const cols = mockColumns(['name'])

    const result = serializeCells(rows, cols, defaultSerializeOpts)
    expect(result).toBe('"foo\tbar"')
  })

  it('should escape values containing quotes', () => {
    const rows = mockRows([{ name: 'say "hi"' }])
    const cols = mockColumns(['name'])

    const result = serializeCells(rows, cols, defaultSerializeOpts)
    expect(result).toBe('"say ""hi"""')
  })

  it('should escape values containing newlines', () => {
    const rows = mockRows([{ name: 'line1\nline2' }])
    const cols = mockColumns(['name'])

    const result = serializeCells(rows, cols, defaultSerializeOpts)
    expect(result).toBe('"line1\nline2"')
  })

  it('should handle single cell', () => {
    const rows = mockRows([{ val: 42 }])
    const cols = mockColumns(['val'])

    const result = serializeCells(rows, cols, defaultSerializeOpts)
    expect(result).toBe('42')
  })

  it('should handle Date values via toISOString', () => {
    const date = new Date('2024-01-15T00:00:00.000Z')
    const rows = mockRows([{ date }])
    const cols = mockColumns(['date'])

    const result = serializeCells(rows, cols, defaultSerializeOpts)
    expect(result).toBe('2024-01-15T00:00:00.000Z')
  })

  it('should use custom delimiter', () => {
    const rows = mockRows([{ a: 1, b: 2 }])
    const cols = mockColumns(['a', 'b'])

    const result = serializeCells(rows, cols, {
      ...defaultSerializeOpts,
      delimiter: ',',
    })
    expect(result).toBe('1,2')
  })
})

// ===========================================================================
// parseClipboardText
// ===========================================================================

describe('parseClipboardText', () => {
  it('should parse TSV into 2D array', () => {
    const result = parseClipboardText('Alice\t30\nBob\t25', defaultParseOpts)
    expect(result).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
  })

  it('should handle empty input', () => {
    expect(parseClipboardText('', defaultParseOpts)).toEqual([])
    expect(parseClipboardText('  ', defaultParseOpts)).toEqual([])
  })

  it('should trim trailing empty row', () => {
    const result = parseClipboardText('Alice\t30\n', defaultParseOpts)
    expect(result).toEqual([['Alice', '30']])
  })

  it('should parse quoted values', () => {
    const result = parseClipboardText('"hello"\t"world"', defaultParseOpts)
    expect(result).toEqual([['hello', 'world']])
  })

  it('should handle escaped quotes within quoted values', () => {
    const result = parseClipboardText('"say ""hi"""', defaultParseOpts)
    expect(result).toEqual([['say "hi"']])
  })

  it('should parse single cell', () => {
    const result = parseClipboardText('42', defaultParseOpts)
    expect(result).toEqual([['42']])
  })

  it('should parse single row with multiple columns', () => {
    const result = parseClipboardText('a\tb\tc', defaultParseOpts)
    expect(result).toEqual([['a', 'b', 'c']])
  })

  it('should parse single column with multiple rows', () => {
    const result = parseClipboardText('a\nb\nc', defaultParseOpts)
    expect(result).toEqual([['a'], ['b'], ['c']])
  })
})

// ===========================================================================
// Round-trip
// ===========================================================================

describe('Round-trip: serialize -> parse', () => {
  it('should round-trip simple values', () => {
    const rows = mockRows([
      { a: 'hello', b: 42 },
      { a: 'world', b: 99 },
    ])
    const cols = mockColumns(['a', 'b'])

    const serialized = serializeCells(rows, cols, defaultSerializeOpts)
    const parsed = parseClipboardText(serialized, defaultParseOpts)

    expect(parsed).toEqual([
      ['hello', '42'],
      ['world', '99'],
    ])
  })

  it('should round-trip values with special characters', () => {
    const rows = mockRows([{ a: 'tab\there', b: 'quote"mark' }])
    const cols = mockColumns(['a', 'b'])

    const serialized = serializeCells(rows, cols, defaultSerializeOpts)
    const parsed = parseClipboardText(serialized, defaultParseOpts)

    expect(parsed[0]![0]).toBe('tab\there')
    expect(parsed[0]![1]).toBe('quote"mark')
  })
})
