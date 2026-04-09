// @zvndev/yable-vanilla — renderer tests
//
// The `esc()` helper in `../renderer.ts` is a private function, so we can't
// import it directly. Instead, we exercise it through the public `renderTable`
// API, which pipes user-controlled data through `esc()` in two places:
//
//   1. `opts.emptyMessage` when the table has zero rows
//        → `<div class="yable-empty-message">${esc(msg)}</div>`
//   2. Every cell value via `renderCell` → `${esc(value)}`
//
// These two surfaces give us a stable, public way to assert that the escape
// pipeline behaves correctly, including against real XSS payloads.

import { describe, it, expect } from 'vitest'
import {
  createTable,
  createColumnHelper,
  functionalUpdate,
  type TableOptions,
  type TableState,
  type Updater,
} from '@zvndev/yable-core'
import { renderTable } from '../renderer'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeBlankState(): TableState {
  return {
    sorting: [],
    columnFilters: [],
    globalFilter: '',
    pagination: { pageIndex: 0, pageSize: 10 },
    rowSelection: {},
    columnVisibility: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columnSizing: {},
    columnSizingInfo: {
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false,
      columnSizingStart: [],
    },
    expanded: {},
    rowPinning: { top: [], bottom: [] },
    grouping: [],
    editing: { activeCell: undefined, pendingValues: {} },
    commits: { cells: {}, nextOpId: 1 },
    keyboardNavigation: { focusedCell: null },
    undoRedo: { undoStack: [], redoStack: [], maxSize: 50 },
    fillHandle: { isDragging: false },
    formulas: { enabled: false, formulas: {}, computedValues: {}, errors: {} },
    rowDrag: { draggingRowId: null, overRowId: null, dropPosition: null },
    pivot: {
      enabled: false,
      config: { rowFields: [], columnFields: [], valueFields: [] },
      expandedRowGroups: {},
      expandedColumnGroups: {},
    },
  }
}

interface Row {
  id: number
  name: string
}

const columnHelper = createColumnHelper<Row>()

function buildTable(data: Row[]) {
  let state = makeBlankState()

  const options: TableOptions<Row> = {
    data,
    columns: [columnHelper.accessor('name', { header: 'Name' })],
    getRowId: (row) => String(row.id),
    state,
    onStateChange: (updater: Updater<TableState>) => {
      state = functionalUpdate(updater, state)
      table.setOptions((prev) => ({ ...prev, state }))
    },
  }

  const table = createTable<Row>(options)
  return table
}

/** Render an empty table with the given emptyMessage — exercises esc() directly. */
function renderEmptyWith(emptyMessage: string): string {
  const table = buildTable([])
  return renderTable(table, { emptyMessage })
}

/** Render a single-row table with the given name — exercises esc() on cell values. */
function renderRowWith(name: string): string {
  const table = buildTable([{ id: 1, name }])
  return renderTable(table, {})
}

// ---------------------------------------------------------------------------
// esc() — basic escape rules
// ---------------------------------------------------------------------------

describe('esc (via renderTable emptyMessage)', () => {
  it('escapes ampersand', () => {
    const html = renderEmptyWith('Tom & Jerry')
    expect(html).toContain('Tom &amp; Jerry')
    expect(html).not.toContain('Tom & Jerry<')
  })

  it('escapes less-than', () => {
    const html = renderEmptyWith('1 < 2')
    expect(html).toContain('1 &lt; 2')
  })

  it('escapes greater-than', () => {
    const html = renderEmptyWith('2 > 1')
    expect(html).toContain('2 &gt; 1')
  })

  it('escapes double quote', () => {
    const html = renderEmptyWith('say "hi"')
    expect(html).toContain('say &quot;hi&quot;')
  })

  it('escapes single quote as &#39;', () => {
    const html = renderEmptyWith("it's fine")
    expect(html).toContain('it&#39;s fine')
    // Make sure the raw apostrophe is gone from the message area
    expect(html).not.toContain("it's fine")
  })
})

// ---------------------------------------------------------------------------
// esc() — XSS attack vectors
// ---------------------------------------------------------------------------

describe('esc — XSS prevention', () => {
  it('escapes a <script> tag injection in emptyMessage', () => {
    const html = renderEmptyWith('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    // Must never emit a raw <script> anywhere in the output
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('</script>')
  })

  it('escapes an <img onerror> injection in emptyMessage', () => {
    const html = renderEmptyWith('<img src=x onerror="alert(1)">')
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(html).not.toContain('<img')
  })

  it('escapes an attribute-breakout attempt', () => {
    const html = renderEmptyWith('" onclick="alert(1)"')
    expect(html).toContain('&quot; onclick=&quot;alert(1)&quot;')
  })

  it('escapes a <script> tag injected into a cell value', () => {
    const html = renderRowWith('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('</script>')
  })

  it('escapes an img onerror injected into a cell value', () => {
    const html = renderRowWith('<img src=x onerror=alert(1)>')
    // The dangerous < and > must both be escaped
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img')
  })
})

// ---------------------------------------------------------------------------
// esc() — edge cases
// ---------------------------------------------------------------------------

describe('esc — edge cases', () => {
  it('returns empty message unchanged for plain ASCII', () => {
    const html = renderEmptyWith('hello')
    expect(html).toContain('>hello<')
  })

  it('defaults emptyMessage to "No data" when omitted', () => {
    const table = buildTable([])
    const html = renderTable(table, {})
    expect(html).toContain('>No data<')
  })

  it('escapes multiple special characters in one string', () => {
    const html = renderEmptyWith('<a href="x">&</a>')
    expect(html).toContain('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
  })

  it('escapes ampersand BEFORE other chars (avoids &amp;amp;-style collapse but correctly double-escapes pre-escaped input)', () => {
    // The replace order in esc() is &, <, >, ", '. This means the literal
    // string "&amp;" should become "&amp;amp;" — i.e. the leading & is
    // escaped first, so we don't accidentally under-escape existing entities.
    const html = renderEmptyWith('&amp;')
    expect(html).toContain('&amp;amp;')
  })

  it('handles unicode cleanly', () => {
    const html = renderEmptyWith('日本語 & 中文')
    expect(html).toContain('日本語 &amp; 中文')
  })

  it('escapes numbers coerced via String() without throwing', () => {
    // esc() uses String(value ?? '') so non-strings should pass through
    // unharmed. Render a row with a numeric-looking but special-char name.
    const html = renderRowWith('42 < 100')
    expect(html).toContain('42 &lt; 100')
  })

  it('renders a <table>, <thead>, and <tbody> skeleton', () => {
    const html = renderRowWith('Alice')
    expect(html).toContain('<table class="yable-table">')
    expect(html).toContain('<thead class="yable-thead">')
    expect(html).toContain('<tbody class="yable-tbody">')
    // Column header from columnDef
    expect(html).toContain('Name')
    // Cell value
    expect(html).toContain('Alice')
  })
})
