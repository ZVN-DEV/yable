// @zvndev/yable-react — Smart column width (opt-in `autoColumnWidth`)
//
// Measures column content with an offscreen canvas, then resolves final widths
// under one of two overflow policies (`fit` squishes + wraps, `scroll` keeps
// natural widths) and writes them into `columnSizing` so `getSize`, pinned
// offsets, the colgroup, and virtualization totals all agree.

import { useEffect, useRef, useState } from 'react'
import type { Column, RowData, Table } from '@zvndev/yable-core'
import type { AutoColumnWidthOptions } from '../types'

// ---------------------------------------------------------------------------
// Pure width computation — fully testable, no DOM.
// ---------------------------------------------------------------------------

export interface AutoSizeColumnInput {
  id: string
  /**
   * For auto columns: the measured natural content width (padding + indicators
   * already included), UNclamped. For fixed columns: their current width.
   */
  natural: number
  minSize?: number
  maxSize?: number
  /** Whether this column participates in auto-sizing (distribute / squish). */
  auto: boolean
}

export interface ComputeAutoColumnWidthsOptions {
  columns: AutoSizeColumnInput[]
  containerWidth: number
  overflow: 'fit' | 'scroll'
  underflow: 'distribute' | 'leave'
  /** Absolute floor a squished column may never drop below. Default 48. */
  hardMinWidth?: number
  /**
   * Whether squish + wrap is allowed. `false` (e.g. row virtualization is on)
   * forces natural widths on overflow — i.e. `scroll` behavior — because
   * wrapped row heights are not measured by the virtualizer.
   */
  canSquish: boolean
}

export interface ComputeAutoColumnWidthsResult {
  /** Final resolved width per column id (all columns, auto + fixed). */
  widths: Record<string, number>
  /** Auto columns that were squished below natural and must wrap their cells. */
  wrapColumnIds: string[]
  /**
   * True only when a real `fit` downgrade occurred: `overflow: 'fit'` was
   * requested, squish was disabled (`canSquish: false`, e.g. row virtualization),
   * AND natural content actually overflows the container — so the grid silently
   * fell back to `scroll` behavior. Callers may surface a dev warning.
   */
  downgradedFit: boolean
}

function clamp(value: number, min?: number, max?: number): number {
  let out = value
  if (typeof min === 'number' && typeof max === 'number' && min > max) {
    // Mirror core getSize: on inverted bounds, min wins.
    return Math.max(out, min)
  }
  if (typeof min === 'number') out = Math.max(out, min)
  if (typeof max === 'number') out = Math.min(out, max)
  return out
}

/**
 * Resolve final column widths for the smart-width feature. See the algorithm in
 * the feature docs: underflow (leave / distribute) and overflow (scroll / fit
 * squish, proportional to per-column slack, never below a floor).
 */
export function computeAutoColumnWidths(
  options: ComputeAutoColumnWidthsOptions,
): ComputeAutoColumnWidthsResult {
  const { columns, containerWidth, overflow, underflow, canSquish } = options
  const hardMinWidth = options.hardMinWidth ?? 48

  // Base width: auto columns are clamped to their min/max; fixed columns keep
  // their supplied width verbatim.
  const base = new Map<string, number>()
  for (const col of columns) {
    const width = col.auto
      ? Math.round(clamp(col.natural, col.minSize, col.maxSize))
      : Math.round(col.natural)
    base.set(col.id, width)
  }

  const widths: Record<string, number> = {}
  for (const col of columns) widths[col.id] = base.get(col.id)!

  const autoColumns = columns.filter((c) => c.auto)
  const naturalTotal = columns.reduce((sum, c) => sum + base.get(c.id)!, 0)

  // A `fit` request downgrades to `scroll` only when squish is disabled AND the
  // content genuinely overflows the container (otherwise there is nothing to
  // squish and no downgrade actually happened).
  const downgradedFit = overflow === 'fit' && !canSquish && naturalTotal > containerWidth

  // --- Underflow: natural content already fits the container -----------------
  if (naturalTotal <= containerWidth) {
    if (underflow === 'distribute' && autoColumns.length > 0 && containerWidth > naturalTotal) {
      distributeExtraSpace(autoColumns, base, widths, containerWidth - naturalTotal)
    }
    return { widths, wrapColumnIds: [], downgradedFit }
  }

  // --- Overflow: `scroll` (or squish disabled) keeps natural widths ----------
  if (overflow === 'scroll' || !canSquish) {
    return { widths, wrapColumnIds: [], downgradedFit }
  }

  // --- Overflow: `fit` — squish auto columns to fit, taking from slack -------
  // `minSize` is a HARD floor, not a soft target: core `getSize` clamps every
  // rendered width up to `minSize`, so squishing below it would be undone at
  // render time. We therefore never squish a column below max(minSize, hardMin).
  const floors = new Map<string, number>()
  let totalSlack = 0
  for (const col of autoColumns) {
    const floor = Math.max(col.minSize ?? 0, hardMinWidth)
    floors.set(col.id, floor)
    totalSlack += Math.max(0, base.get(col.id)! - floor)
  }

  if (totalSlack <= 0) {
    // Nothing to give — columns stay at natural width and the grid scrolls.
    return { widths, wrapColumnIds: [], downgradedFit }
  }

  const required = Math.min(naturalTotal - containerWidth, totalSlack)
  const wrapColumnIds: string[] = []

  for (const col of autoColumns) {
    const baseWidth = base.get(col.id)!
    const floor = floors.get(col.id)!
    const slack = Math.max(0, baseWidth - floor)
    if (slack <= 0) continue

    const reduction = required * (slack / totalSlack)
    const next = Math.max(floor, Math.round(baseWidth - reduction))
    widths[col.id] = next
    if (next < baseWidth) wrapColumnIds.push(col.id)
  }

  return { widths, wrapColumnIds, downgradedFit }
}

function distributeExtraSpace(
  autoColumns: AutoSizeColumnInput[],
  base: Map<string, number>,
  widths: Record<string, number>,
  extra: number,
): void {
  const autoBaseTotal = autoColumns.reduce((sum, c) => sum + base.get(c.id)!, 0)
  if (autoBaseTotal <= 0) return

  for (const col of autoColumns) {
    const baseWidth = base.get(col.id)!
    const grown = baseWidth + extra * (baseWidth / autoBaseTotal)
    // Respect maxSize: never distribute a column past its cap.
    widths[col.id] = Math.round(clamp(grown, undefined, col.maxSize))
  }
}

// ---------------------------------------------------------------------------
// Pure per-column natural-width resolution — precedence + measurement math,
// no DOM. The caller supplies a `measure(text, font)` callback (canvas in the
// hook) and the sampled rows; this decides WHAT to measure per column.
// ---------------------------------------------------------------------------

export interface ResolveColumnNaturalParams<R> {
  /** Sampled rows (already capped to sampleSize by the caller). */
  rows: R[]
  /** Header label, or '' when the header is not a plain string. */
  headerText: string
  /** Measures a string's pixel width in the given canvas font shorthand. */
  measure: (text: string, font: string) => number
  bodyFont: string
  headerFont: string
  /** Total horizontal cell padding (both sides). */
  horizontalPadding: number
  /** Sort-indicator width allowance (0 when the column can't sort). */
  indicator: number
  /** Raw accessor value for a row — the default measured string source. */
  getRawValue: (row: R) => unknown
  /** Override: measure this string instead of the raw value. */
  autoSizeText?: (row: R) => string
  /** Override: use this exact natural pixel width, bypassing measurement. */
  autoSizeWidth?: (row: R) => number
}

/**
 * Resolve one column's natural (unclamped) content width. Precedence:
 *   1. `autoSizeWidth` — max of ceil(width) over sampled rows, then max with the
 *      header's measured natural width (incl. padding + indicator). Used verbatim
 *      (no padding/indicator added to the per-row widths themselves).
 *   2. `autoSizeText` — measure that string per row with the body font.
 *   3. raw accessor value — `String(row.getValue(id))`, today's default.
 * For (2) and (3): natural = ceil(max(headerContent, maxTextWidth) + padding + indicator).
 */
export function resolveColumnNatural<R>(params: ResolveColumnNaturalParams<R>): number {
  const {
    rows,
    headerText,
    measure,
    bodyFont,
    headerFont,
    horizontalPadding,
    indicator,
    getRawValue,
    autoSizeText,
    autoSizeWidth,
  } = params

  const headerContent = headerText ? measure(headerText, headerFont) : 0

  if (autoSizeWidth) {
    let maxWidth = 0
    for (const row of rows) {
      const raw = autoSizeWidth(row)
      if (!Number.isFinite(raw)) continue
      const w = Math.ceil(raw)
      if (w > maxWidth) maxWidth = w
    }
    const headerNatural = Math.ceil(headerContent + horizontalPadding + indicator)
    return Math.max(maxWidth, headerNatural)
  }

  let content = headerContent
  for (const row of rows) {
    let text: string
    if (autoSizeText) {
      const raw = autoSizeText(row)
      text = raw == null ? '' : String(raw)
    } else {
      const raw = getRawValue(row)
      text = raw == null ? '' : String(raw)
    }
    if (text.length === 0) continue
    const width = measure(text, bodyFont)
    if (width > content) content = width
  }

  return Math.ceil(content + horizontalPadding + indicator)
}

// ---------------------------------------------------------------------------
// Measurement (canvas 2D measureText) + application hook.
// ---------------------------------------------------------------------------

export interface UseAutoColumnSizingOptions<TData extends RowData> {
  table: Table<TData>
  /** Visible leaf columns in render order. */
  columns: Column<TData, unknown>[]
  /** Ref to the grid content element whose width bounds the columns. */
  measureRef: React.RefObject<HTMLElement | null>
  enabled: boolean
  config: AutoColumnWidthOptions
  /** When true, squish + wrap is disabled (falls back to scroll on overflow). */
  isVirtualized: boolean
  /** Stable key covering data/columns/font — recompute when it changes. */
  signature: string
}

export interface UseAutoColumnSizingResult {
  /** Column ids whose cells must wrap (squished under `fit`). */
  wrapColumnIds: string[]
}

const DEFAULT_SAMPLE_SIZE = 100
const DEFAULT_PADDING_X = 14
const SORT_INDICATOR_ALLOWANCE = 20

let sharedCanvas: HTMLCanvasElement | null = null
let sharedContext: CanvasRenderingContext2D | null = null

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (sharedContext) return sharedContext
  sharedCanvas = document.createElement('canvas')
  sharedContext = sharedCanvas.getContext('2d')
  return sharedContext
}

function readVar(style: CSSStyleDeclaration, name: string): string {
  return style.getPropertyValue(name).trim()
}

function parsePx(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function useAutoColumnSizing<TData extends RowData>({
  table,
  columns,
  measureRef,
  enabled,
  config,
  isVirtualized,
  signature,
}: UseAutoColumnSizingOptions<TData>): UseAutoColumnSizingResult {
  const [wrapColumnIds, setWrapColumnIds] = useState<string[]>([])
  const [containerWidth, setContainerWidth] = useState(0)

  // Track columns the user has manually resized this session; once resized, a
  // column is excluded from auto-sizing so we never fight an active drag.
  const userResizedRef = useRef<Set<string>>(new Set())
  const resizingColumn = table.getState().columnSizingInfo.isResizingColumn
  if (typeof resizingColumn === 'string' && resizingColumn.length > 0) {
    userResizedRef.current.add(resizingColumn)
  }

  // Widths this hook itself wrote this session, keyed by column id. Used to tell
  // an auto-written width apart from an externally-provenanced one (a user drag
  // or a persisted/restored `columnSizing` value) so we never overwrite a width
  // we did not set — even a persisted one present on the very first mount.
  const autoWrittenRef = useRef<Map<string, number>>(new Map())
  // One-shot guard so the `fit`-under-virtualization downgrade warns at most once.
  const warnedDowngradeRef = useRef(false)

  const overflow = config.overflow ?? 'fit'
  const underflow = config.underflow ?? 'leave'
  const sampleSize = config.sampleSize ?? DEFAULT_SAMPLE_SIZE

  // Observe the grid content width so squish/distribute recompute on resize.
  useEffect(() => {
    const node = measureRef.current
    if (!enabled || !node) {
      setContainerWidth(0)
      return
    }
    const update = () => setContainerWidth(node.clientWidth)
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, measureRef])

  useEffect(() => {
    if (!enabled) {
      setWrapColumnIds([])
      return
    }
    const node = measureRef.current
    const ctx = getMeasureContext()
    if (!node || !ctx || containerWidth <= 0) return

    const style = getComputedStyle(node)
    const fontFamily = readVar(style, '--yable-font-family') || style.fontFamily || 'sans-serif'
    const bodyFontSize = parsePx(readVar(style, '--yable-font-size'), 13)
    const headerFontSize = parsePx(readVar(style, '--yable-font-size-header'), 12)
    const paddingX = parsePx(readVar(style, '--yable-cell-padding-x'), DEFAULT_PADDING_X)
    const horizontalPadding = paddingX > 0 ? paddingX * 2 : DEFAULT_PADDING_X * 2
    const bodyFont = `${bodyFontSize}px ${fontFamily}`
    const headerFont = `${headerFontSize}px ${fontFamily}`

    const measure = (text: string, font: string): number => {
      ctx.font = font
      return ctx.measureText(text).width
    }

    const rows = table.getRowModel().rows
    const rowLimit = Math.min(rows.length, Math.max(0, sampleSize))
    const sampledRows = rows.slice(0, rowLimit)
    const columnSizing = table.getState().columnSizing

    const inputs: AutoSizeColumnInput[] = columns.map((column) => {
      const def = column.columnDef
      const hasExplicitSize = typeof def.size === 'number'
      // Externally provenanced = a width exists that this hook did not write
      // (a user drag or persisted/restored state). Such columns are excluded so
      // we never clobber a user-set or persisted width.
      const currentWidth = columnSizing[column.id]
      const isExternallyProvenanced =
        currentWidth !== undefined &&
        (!autoWrittenRef.current.has(column.id) ||
          autoWrittenRef.current.get(column.id) !== currentWidth)
      const isAuto =
        !hasExplicitSize &&
        def.enableAutoSize !== false &&
        !userResizedRef.current.has(column.id) &&
        !isExternallyProvenanced

      if (!isAuto) {
        return {
          id: column.id,
          natural: column.getSize(),
          minSize: def.minSize,
          maxSize: def.maxSize,
          auto: false,
        }
      }

      const headerText = typeof def.header === 'string' ? def.header : ''
      const indicator = column.getCanSort() ? SORT_INDICATOR_ALLOWANCE : 0
      const natural = resolveColumnNatural({
        rows: sampledRows,
        headerText,
        measure,
        bodyFont,
        headerFont,
        horizontalPadding,
        indicator,
        getRawValue: (row) => row.getValue(column.id),
        autoSizeText: def.autoSizeText,
        autoSizeWidth: def.autoSizeWidth,
      })
      return { id: column.id, natural, minSize: def.minSize, maxSize: def.maxSize, auto: true }
    })

    const {
      widths,
      wrapColumnIds: nextWrap,
      downgradedFit,
    } = computeAutoColumnWidths({
      columns: inputs,
      containerWidth,
      overflow,
      underflow,
      canSquish: !isVirtualized,
    })

    if (downgradedFit && !warnedDowngradeRef.current && process.env.NODE_ENV !== 'production') {
      warnedDowngradeRef.current = true
      console.warn(
        "[yable] autoColumnWidth overflow:'fit' fell back to 'scroll' under row virtualization: wrapped row heights aren't measured by the virtualizer. Use Pretext-measured heights, disable virtualization, or set overflow:'scroll' to silence this.",
      )
    }

    // Only write auto (non-user-resized) columns into columnSizing so explicit
    // sizes and user resizes are never clobbered.
    const autoIds = new Set(inputs.filter((i) => i.auto).map((i) => i.id))
    const current = table.getState().columnSizing
    let changed = false
    const next: Record<string, number> = { ...current }
    for (const id of autoIds) {
      const width = widths[id]
      if (typeof width !== 'number') continue
      // Record every width we own this session (even unchanged ones) so the
      // provenance check keeps recognizing it as auto-written on later passes.
      autoWrittenRef.current.set(id, width)
      if (current[id] !== width) {
        next[id] = width
        changed = true
      }
    }
    if (changed) {
      table.setColumnSizing(next)
    }

    setWrapColumnIds((prev) => (arraysEqual(prev, nextWrap) ? prev : nextWrap))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` folds in data/columns/font; other deps are stable
  }, [enabled, signature, containerWidth, overflow, underflow, sampleSize, isVirtualized])

  return { wrapColumnIds }
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
