import { describe, it, expect } from 'vitest'
import { computeAutoColumnWidths, type AutoSizeColumnInput } from '../useAutoColumnSizing'

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
