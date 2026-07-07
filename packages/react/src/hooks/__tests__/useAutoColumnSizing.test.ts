import { describe, it, expect } from 'vitest'
import {
  computeAutoColumnWidths,
  resolveColumnNatural,
  type AutoSizeColumnInput,
} from '../useAutoColumnSizing'

function auto(
  id: string,
  natural: number,
  extra?: Partial<AutoSizeColumnInput>,
): AutoSizeColumnInput {
  return { id, natural, auto: true, ...extra }
}
function fixed(id: string, natural: number): AutoSizeColumnInput {
  return { id, natural, auto: false }
}

describe('computeAutoColumnWidths', () => {
  describe('underflow — natural total fits container', () => {
    it('leave: keeps natural widths and never wraps', () => {
      const { widths, wrapColumnIds } = computeAutoColumnWidths({
        columns: [auto('a', 100), auto('b', 120)],
        containerWidth: 500,
        overflow: 'fit',
        underflow: 'leave',
        canSquish: true,
      })
      expect(widths).toEqual({ a: 100, b: 120 })
      expect(wrapColumnIds).toEqual([])
    })

    it('distribute: spreads leftover across auto columns proportional to base width', () => {
      const { widths, wrapColumnIds } = computeAutoColumnWidths({
        columns: [auto('a', 100), auto('b', 300)],
        containerWidth: 800,
        overflow: 'fit',
        underflow: 'distribute',
        canSquish: true,
      })
      // 400px leftover, split 1:3 → a +100, b +300
      expect(widths).toEqual({ a: 200, b: 600 })
      expect(widths.a! + widths.b!).toBe(800)
      expect(wrapColumnIds).toEqual([])
    })

    it('distribute: never grows a column past its maxSize', () => {
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 100, { maxSize: 130 }), auto('b', 100)],
        containerWidth: 400,
        overflow: 'fit',
        underflow: 'distribute',
        canSquish: true,
      })
      expect(widths.a).toBeLessThanOrEqual(130)
    })

    it('distribute: fixed columns are excluded from the extra space', () => {
      const { widths } = computeAutoColumnWidths({
        columns: [fixed('a', 100), auto('b', 100)],
        containerWidth: 400,
        overflow: 'fit',
        underflow: 'distribute',
        canSquish: true,
      })
      expect(widths.a).toBe(100)
      expect(widths.b).toBe(300)
    })

    it('distribute waterfall: extra beyond one maxSize spills to the uncapped column', () => {
      // a caps at 130 (base 100, +30); the rest of the 200px extra goes to b.
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 100, { maxSize: 130 }), auto('b', 100)],
        containerWidth: 400,
        overflow: 'fit',
        underflow: 'distribute',
        canSquish: true,
      })
      expect(widths.a).toBe(130)
      expect(widths.b).toBe(270)
      // No gutter: a capped but b absorbed the spill → sum fills the container.
      expect(widths.a! + widths.b!).toBe(400)
    })

    it('distribute waterfall: gutter remains ONLY when every auto column is capped', () => {
      // Both cap at 130; extra is 200 but only 60px of headroom exists (30 each).
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 100, { maxSize: 130 }), auto('b', 100, { maxSize: 130 })],
        containerWidth: 400,
        overflow: 'fit',
        underflow: 'distribute',
        canSquish: true,
      })
      expect(widths.a).toBe(130)
      expect(widths.b).toBe(130)
      // Everything capped → a 140px gutter is left (400 - 260), by design.
      expect(widths.a! + widths.b!).toBe(260)
    })

    it('stretch: all columns capped but underfilled → grows past maxSize, fills exactly', () => {
      // Same capped setup as above, but stretch treats maxSize as a SOFT cap and
      // grows both past it proportionally (equal base → 200 each) to fill 400.
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 100, { maxSize: 130 }), auto('b', 100, { maxSize: 130 })],
        containerWidth: 400,
        overflow: 'fit',
        underflow: 'stretch',
        canSquish: true,
      })
      expect(widths.a).toBeGreaterThan(130)
      expect(widths.b).toBeGreaterThan(130)
      expect(widths.a).toBe(200)
      expect(widths.b).toBe(200)
      expect(widths.a! + widths.b!).toBe(400)
    })

    it('stretch: uneven bases grow proportionally past maxSize and sum exactly', () => {
      // a base 100 cap 120, b base 300 cap 320. extra = 900-400 = 500.
      // Waterfall caps both (a +20, b +20 = 40 spent), 460 left; stretch grows
      // by base ratio 1:3 → a +115 = 235, b +345 = 665. Sum = 900 exactly.
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 100, { maxSize: 120 }), auto('b', 300, { maxSize: 320 })],
        containerWidth: 900,
        overflow: 'fit',
        underflow: 'stretch',
        canSquish: true,
      })
      expect(widths.a).toBe(235)
      expect(widths.b).toBe(665)
      expect(widths.a! + widths.b!).toBe(900)
    })

    it('stretch: with no caps behaves like distribute and fills exactly', () => {
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 100), auto('b', 300)],
        containerWidth: 800,
        overflow: 'fit',
        underflow: 'stretch',
        canSquish: true,
      })
      expect(widths).toEqual({ a: 200, b: 600 })
    })

    it('distribute: rounding remainder is absorbed so the sum is exact', () => {
      // 3 equal columns, 100px extra doesn't divide evenly (33.33 each).
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 100), auto('b', 100), auto('c', 100)],
        containerWidth: 400,
        overflow: 'fit',
        underflow: 'distribute',
        canSquish: true,
      })
      expect(widths.a! + widths.b! + widths.c!).toBe(400)
    })
  })

  describe('overflow — natural total exceeds container', () => {
    it('scroll: keeps natural widths (grid scrolls), no wrap', () => {
      const { widths, wrapColumnIds } = computeAutoColumnWidths({
        columns: [auto('a', 400), auto('b', 400)],
        containerWidth: 500,
        overflow: 'scroll',
        underflow: 'leave',
        canSquish: true,
      })
      expect(widths).toEqual({ a: 400, b: 400 })
      expect(wrapColumnIds).toEqual([])
    })

    it('fit but canSquish=false (virtualized): falls back to natural widths, no wrap', () => {
      const { widths, wrapColumnIds } = computeAutoColumnWidths({
        columns: [auto('a', 400), auto('b', 400)],
        containerWidth: 500,
        overflow: 'fit',
        underflow: 'leave',
        canSquish: false,
      })
      expect(widths).toEqual({ a: 400, b: 400 })
      expect(wrapColumnIds).toEqual([])
    })

    it('fit: squishes proportional to slack, taking most from the widest column', () => {
      // floors default to 48. a slack=352, b slack=52. required reduction=300.
      const { widths, wrapColumnIds } = computeAutoColumnWidths({
        columns: [auto('a', 400), auto('b', 100)],
        containerWidth: 200,
        overflow: 'fit',
        underflow: 'leave',
        canSquish: true,
      })
      // a gives up 300*352/404≈261 → ~139; b gives up 300*52/404≈39 → ~61
      expect(widths.a).toBeLessThan(400)
      expect(widths.b).toBeLessThan(100)
      expect(400 - widths.a!).toBeGreaterThan(100 - widths.b!) // widest gives up most
      expect(widths.a! + widths.b!).toBeCloseTo(200, -1)
      expect(new Set(wrapColumnIds)).toEqual(new Set(['a', 'b']))
    })

    it('fit: never squishes a column below its floor (hardMinWidth / minSize)', () => {
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 400, { minSize: 120 }), auto('b', 400)],
        containerWidth: 100, // impossibly small — everything hits its floor
        overflow: 'fit',
        underflow: 'leave',
        hardMinWidth: 48,
        canSquish: true,
      })
      expect(widths.a).toBeGreaterThanOrEqual(120)
      expect(widths.b).toBeGreaterThanOrEqual(48)
    })

    it('fit: fixed columns keep their width and are never squished', () => {
      const { widths, wrapColumnIds } = computeAutoColumnWidths({
        columns: [fixed('a', 300), auto('b', 400)],
        containerWidth: 500,
        overflow: 'fit',
        underflow: 'leave',
        canSquish: true,
      })
      expect(widths.a).toBe(300) // fixed untouched
      expect(widths.b).toBeLessThan(400) // auto absorbs the whole squish
      expect(wrapColumnIds).toEqual(['b'])
    })

    it('fit: a column with zero slack (already at floor) is not squished further', () => {
      const { widths, wrapColumnIds } = computeAutoColumnWidths({
        columns: [auto('a', 400), auto('b', 48)],
        containerWidth: 200,
        overflow: 'fit',
        underflow: 'leave',
        hardMinWidth: 48,
        canSquish: true,
      })
      expect(widths.b).toBe(48) // no slack → untouched
      expect(wrapColumnIds).toContain('a')
      expect(wrapColumnIds).not.toContain('b')
    })
  })

  describe('downgradedFit — fit-under-virtualization fallback flag', () => {
    it('true only when fit + canSquish=false + real overflow', () => {
      const { downgradedFit } = computeAutoColumnWidths({
        columns: [auto('a', 400), auto('b', 400)],
        containerWidth: 500, // 800 natural > 500 → real overflow
        overflow: 'fit',
        underflow: 'leave',
        canSquish: false,
      })
      expect(downgradedFit).toBe(true)
    })

    it('false when there is no overflow (content fits)', () => {
      const { downgradedFit } = computeAutoColumnWidths({
        columns: [auto('a', 100), auto('b', 100)],
        containerWidth: 500, // 200 natural ≤ 500 → no overflow
        overflow: 'fit',
        underflow: 'leave',
        canSquish: false,
      })
      expect(downgradedFit).toBe(false)
    })

    it('false when canSquish is true (fit actually squishes)', () => {
      const { downgradedFit } = computeAutoColumnWidths({
        columns: [auto('a', 400), auto('b', 400)],
        containerWidth: 500,
        overflow: 'fit',
        underflow: 'leave',
        canSquish: true,
      })
      expect(downgradedFit).toBe(false)
    })

    it("false when overflow is 'scroll' (no fit was requested)", () => {
      const { downgradedFit } = computeAutoColumnWidths({
        columns: [auto('a', 400), auto('b', 400)],
        containerWidth: 500,
        overflow: 'scroll',
        underflow: 'leave',
        canSquish: false,
      })
      expect(downgradedFit).toBe(false)
    })
  })

  describe('clamping', () => {
    it('auto column natural width is clamped to minSize/maxSize before layout', () => {
      const { widths } = computeAutoColumnWidths({
        columns: [auto('a', 500, { maxSize: 200 }), auto('b', 10, { minSize: 80 })],
        containerWidth: 1000,
        overflow: 'fit',
        underflow: 'leave',
        canSquish: true,
      })
      expect(widths.a!).toBe(200) // clamped down to maxSize
      expect(widths.b!).toBe(80) // clamped up to minSize
    })
  })
})

// ---------------------------------------------------------------------------
// resolveColumnNatural — per-column measurement precedence
// (autoSizeWidth > autoSizeText > raw accessor value).
// ---------------------------------------------------------------------------

interface StubRow {
  raw: unknown
  formatted?: string
  exact?: number
}

// Deterministic measurer: 10px per character, font-agnostic.
const measure = (text: string): number => text.length * 10

const PADDING = 14
const INDICATOR = 6

function natural(
  rows: StubRow[],
  overrides: Partial<{
    headerText: string
    autoSizeText: (row: StubRow) => string
    autoSizeWidth: (row: StubRow) => number
  }> = {},
): number {
  return resolveColumnNatural<StubRow>({
    rows,
    headerText: overrides.headerText ?? 'H',
    measure,
    bodyFont: 'body',
    headerFont: 'header',
    horizontalPadding: PADDING,
    indicator: INDICATOR,
    getRawValue: (row) => row.raw,
    autoSizeText: overrides.autoSizeText,
    autoSizeWidth: overrides.autoSizeWidth,
  })
}

describe('resolveColumnNatural', () => {
  it('raw fallback: measures String(rawValue) + padding + indicator', () => {
    // 'hello' → 50, header 'H' → 10, content 50 → ceil(50 + 14 + 6) = 70
    expect(natural([{ raw: 'hello' }])).toBe(70)
  })

  it('raw fallback: header content wins when wider than every row', () => {
    // header 'HEADER' → 60, raw 'x' → 10 → ceil(60 + 20) = 80
    expect(natural([{ raw: 'x' }], { headerText: 'HEADER' })).toBe(80)
  })

  it('autoSizeText takes precedence over the raw value', () => {
    const rows: StubRow[] = [{ raw: 19, formatted: '$1,234.00' }]
    // autoSizeText '$1,234.00' → 90; raw '19' → 20.
    const withText = natural(rows, { autoSizeText: (r) => r.formatted! })
    const rawOnly = natural(rows)
    expect(withText).toBe(110) // ceil(90 + 14 + 6)
    expect(rawOnly).toBe(40) // ceil(20 + 14 + 6) — what the old measurement gave
    expect(withText).toBeGreaterThan(rawOnly)
  })

  it('autoSizeWidth takes precedence over autoSizeText AND the raw value', () => {
    const rows: StubRow[] = [
      { raw: 'aaaaaaaaaaaaaaaaaaaa', exact: 100 }, // huge raw string
      { raw: 'bbbbbbbbbbbbbbbbbbbb', exact: 250 },
    ]
    // autoSizeWidth is used verbatim: max(ceil(100), ceil(250)) = 250; header
    // natural = ceil(10 + 14 + 6) = 30 → max(250, 30) = 250. Text is ignored.
    const width = natural(rows, {
      autoSizeText: () => 'this text is extremely long and would measure very wide',
      autoSizeWidth: (r) => r.exact!,
    })
    expect(width).toBe(250)
  })

  it('autoSizeWidth: header natural width wins when wider than every exact width', () => {
    const rows: StubRow[] = [{ raw: '', exact: 12 }]
    // exact 12 vs header 'WIDE HEADER' (11 chars → 110) natural = ceil(110+20)=130
    const width = natural(rows, {
      headerText: 'WIDE HEADER',
      autoSizeWidth: (r) => r.exact!,
    })
    expect(width).toBe(130)
  })

  it('autoSizeWidth: does NOT add padding/indicator to the per-row widths', () => {
    const rows: StubRow[] = [{ raw: '', exact: 200 }]
    // 200 verbatim, header natural = ceil(0-content? header 'H'→10 +20)=30 → 200
    expect(natural(rows, { autoSizeWidth: (r) => r.exact! })).toBe(200)
  })

  it('autoSizeWidth: ceils each row width before taking the max', () => {
    const rows: StubRow[] = [{ raw: '', exact: 150.2 }]
    expect(natural(rows, { autoSizeWidth: (r) => r.exact! })).toBe(151)
  })
})
