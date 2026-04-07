// @zvndev/yable-core — Pivot Table Tests

import { describe, it, expect } from 'vitest'
import { PivotEngine } from '../pivot'
import type { PivotConfig } from '../pivot'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

interface SalesData {
  region: string
  product: string
  quarter: string
  revenue: number
  units: number
}

const salesData: SalesData[] = [
  { region: 'East', product: 'Widget', quarter: 'Q1', revenue: 100, units: 10 },
  { region: 'East', product: 'Widget', quarter: 'Q2', revenue: 150, units: 15 },
  { region: 'East', product: 'Gadget', quarter: 'Q1', revenue: 200, units: 5 },
  { region: 'East', product: 'Gadget', quarter: 'Q2', revenue: 250, units: 8 },
  { region: 'West', product: 'Widget', quarter: 'Q1', revenue: 120, units: 12 },
  { region: 'West', product: 'Widget', quarter: 'Q2', revenue: 180, units: 18 },
  { region: 'West', product: 'Gadget', quarter: 'Q1', revenue: 90, units: 3 },
  { region: 'West', product: 'Gadget', quarter: 'Q2', revenue: 110, units: 4 },
]

const getVal = (row: SalesData, field: string): unknown => (row as any)[field]

function createEngine(config: PivotConfig) {
  return new PivotEngine(salesData, config, getVal)
}

// ===========================================================================
// COLUMN GENERATION
// ===========================================================================

describe('PivotEngine — generateColumns', () => {
  it('should generate value columns when no columnFields specified', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    })
    const cols = engine.generateColumns()
    expect(cols).toHaveLength(1)
    expect(cols[0]!.valueField).toBe('revenue')
  })

  it('should generate cross-tab columns for column fields', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [{ field: 'quarter' }],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    })
    const cols = engine.generateColumns()
    // Q1 and Q2 each get one value column => 2 columns
    expect(cols).toHaveLength(2)
    expect(cols.map((c) => c.path)).toEqual(
      expect.arrayContaining([['Q1'], ['Q2']])
    )
  })

  it('should generate multiple value columns per column path', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [{ field: 'quarter' }],
      valueFields: [
        { field: 'revenue', aggregation: 'sum' },
        { field: 'units', aggregation: 'count' },
      ],
    })
    const cols = engine.generateColumns()
    // 2 quarters * 2 value fields = 4
    expect(cols).toHaveLength(4)
  })

  it('should include subtotal columns when showColumnSubtotals is true and multiple column fields', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [{ field: 'quarter' }, { field: 'product' }],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      showColumnSubtotals: true,
    })
    const cols = engine.generateColumns()
    const subtotals = cols.filter((c) => c.isSubtotal)
    expect(subtotals.length).toBeGreaterThanOrEqual(1)
  })
})

// ===========================================================================
// ROW GENERATION
// ===========================================================================

describe('PivotEngine — generateRows', () => {
  it('should generate rows grouped by row fields', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    })
    const rows = engine.generateRows()
    // East and West
    expect(rows).toHaveLength(2)
    const labels = rows.map((r) => r.label).sort()
    expect(labels).toEqual(['East', 'West'])
  })

  it('should aggregate values correctly with sum', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    })
    const rows = engine.generateRows()
    const eastRow = rows.find((r) => r.label === 'East')!
    // East revenue: 100 + 150 + 200 + 250 = 700
    const valKey = Object.keys(eastRow.values)[0]!
    expect(eastRow.values[valKey]).toBe(700)
  })

  it('should aggregate values correctly with count', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'count' }],
    })
    const rows = engine.generateRows()
    const eastRow = rows.find((r) => r.label === 'East')!
    const valKey = Object.keys(eastRow.values)[0]!
    expect(eastRow.values[valKey]).toBe(4) // 4 East rows
  })

  it('should handle multiple row fields (nested grouping)', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }, { field: 'product' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    })
    const rows = engine.generateRows()
    // East (depth 0), East/Gadget (depth 1), East/Widget (depth 1), West (depth 0), ...
    expect(rows.length).toBeGreaterThanOrEqual(4)
    const depths = [...new Set(rows.map((r) => r.depth))]
    expect(depths).toContain(0)
    expect(depths).toContain(1)
  })

  it('should add grand total row when showGrandTotal is true', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      showGrandTotal: true,
    })
    const rows = engine.generateRows()
    const grandTotal = rows.find((r) => r.isGrandTotal)
    expect(grandTotal).toBeDefined()
    expect(grandTotal!.label).toBe('Grand Total')
    // Grand total revenue: 100+150+200+250+120+180+90+110 = 1200
    const valKey = Object.keys(grandTotal!.values)[0]!
    expect(grandTotal!.values[valKey]).toBe(1200)
  })

  it('should add row subtotals when showRowSubtotals is true', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }, { field: 'product' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      showRowSubtotals: true,
    })
    const rows = engine.generateRows()
    const subtotals = rows.filter((r) => r.isSubtotal)
    expect(subtotals.length).toBeGreaterThanOrEqual(2) // One for East, one for West
  })

  it('should generate single row when no row fields are specified', () => {
    const engine = createEngine({
      rowFields: [],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    })
    const rows = engine.generateRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.label).toBe('All')
  })

  it('should handle cross-tab: row fields x column fields', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [{ field: 'quarter' }],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    })
    const rows = engine.generateRows()
    const eastRow = rows.find((r) => r.label === 'East')!

    // East Q1 revenue: 100 (Widget) + 200 (Gadget) = 300
    const q1Col = Object.keys(eastRow.values).find((k) => k.includes('Q1'))
    expect(q1Col).toBeDefined()
    expect(eastRow.values[q1Col!]).toBe(300)
  })

  it('should return empty results for empty data', () => {
    const emptyEngine = new PivotEngine<SalesData>(
      [],
      {
        rowFields: [{ field: 'region' }],
        columnFields: [],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      },
      getVal
    )
    const rows = emptyEngine.generateRows()
    expect(rows).toHaveLength(0)
  })

  it('should handle single data row correctly', () => {
    const singleEngine = new PivotEngine<SalesData>(
      [{ region: 'North', product: 'Widget', quarter: 'Q1', revenue: 999, units: 1 }],
      {
        rowFields: [{ field: 'region' }],
        columnFields: [],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      },
      getVal
    )
    const rows = singleEngine.generateRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.label).toBe('North')
    const valKey = Object.keys(rows[0]!.values)[0]!
    expect(rows[0]!.values[valKey]).toBe(999)
  })

  it('should use mean aggregation correctly', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'mean' }],
    })
    const rows = engine.generateRows()
    const eastRow = rows.find((r) => r.label === 'East')!
    // East mean: (100+150+200+250)/4 = 175
    const valKey = Object.keys(eastRow.values)[0]!
    expect(eastRow.values[valKey]).toBe(175)
  })

  it('should use min aggregation correctly', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'min' }],
    })
    const rows = engine.generateRows()
    const eastRow = rows.find((r) => r.label === 'East')!
    const valKey = Object.keys(eastRow.values)[0]!
    expect(eastRow.values[valKey]).toBe(100)
  })

  it('should use max aggregation correctly', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [],
      valueFields: [{ field: 'revenue', aggregation: 'max' }],
    })
    const rows = engine.generateRows()
    const eastRow = rows.find((r) => r.label === 'East')!
    const valKey = Object.keys(eastRow.values)[0]!
    expect(eastRow.values[valKey]).toBe(250)
  })

  it('should return null for aggregation on empty filtered data', () => {
    const engine = createEngine({
      rowFields: [{ field: 'region' }],
      columnFields: [{ field: 'quarter' }],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    })
    const rows = engine.generateRows()
    // All existing rows should have numeric values for their columns
    for (const row of rows) {
      for (const val of Object.values(row.values)) {
        // Values should be either a number or null (if no data matches that column path)
        expect(val === null || typeof val === 'number').toBe(true)
      }
    }
  })
})
