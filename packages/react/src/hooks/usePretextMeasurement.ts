// @yable/react — Pretext-powered row height pre-computation
//
// Uses @chenglou/pretext to measure text layout WITHOUT DOM access.
// Returns exact pixel heights for every row before any rendering happens.
// This makes virtualization pixel-perfect: no scroll jitter, no height corrections.

import { useEffect, useMemo, useRef, useState } from 'react'

// Dynamic import types — pretext is an optional dependency
type PreparedText = { readonly [brand: symbol]: true }
type LayoutResult = { lineCount: number; height: number }
type PrepareFn = (text: string, font: string) => PreparedText
type LayoutFn = (prepared: PreparedText, maxWidth: number, lineHeight: number) => LayoutResult

interface PretextModule {
  prepare: PrepareFn
  layout: LayoutFn
  clearCache: () => void
}

export interface CellMeasurement {
  /** Column ID */
  columnId: string
  /** Column width in px */
  width: number
  /** CSS font string for this column, e.g. "400 13px Inter" */
  font: string
  /** Line height in px */
  lineHeight: number
  /** Vertical padding in px (top + bottom) */
  padding?: number
}

export interface UsePretextMeasurementOptions {
  /** The row data to measure */
  data: any[]
  /** Measurement config per column — only columns that need text measurement */
  columns: CellMeasurement[]
  /** Extract the text content for a given row and column */
  getCellText: (row: any, columnId: string) => string
  /** Minimum row height in px */
  minRowHeight?: number
  /** Whether measurement is enabled */
  enabled?: boolean
}

export interface UsePretextMeasurementResult {
  /** Map from row index → exact pixel height */
  rowHeights: Float64Array | null
  /** Pre-computed cumulative offsets for binary search (prefix sums) */
  prefixSums: Float64Array | null
  /** Total height of all rows in px */
  totalHeight: number
  /** Whether pretext is loaded and heights are computed */
  ready: boolean
  /** Time taken for prepare() phase in ms */
  prepareTimeMs: number
  /** Time taken for layout() phase in ms */
  layoutTimeMs: number
}

// Singleton: try to load pretext once
let pretextPromise: Promise<PretextModule | null> | null = null

function loadPretext(): Promise<PretextModule | null> {
  if (pretextPromise) return pretextPromise
  pretextPromise = import('@chenglou/pretext')
    .then((mod) => mod as unknown as PretextModule)
    .catch(() => null)
  return pretextPromise
}

/**
 * Pre-computes exact pixel heights for every row using Pretext's
 * DOM-free text measurement. Returns typed arrays for cache-friendly
 * access by the virtualizer.
 *
 * layout() is pure arithmetic (~0.0003ms per cell) so column resizing
 * re-computes all heights near-instantly.
 */
export function usePretextMeasurement({
  data,
  columns,
  getCellText,
  minRowHeight = 32,
  enabled = true,
}: UsePretextMeasurementOptions): UsePretextMeasurementResult {
  const [pretext, setPretext] = useState<PretextModule | null>(null)
  const [ready, setReady] = useState(false)
  const prepareTimeRef = useRef(0)
  const layoutTimeRef = useRef(0)

  // Stable reference for column widths (used to detect resize)
  const columnWidthsKey = columns.map((c) => `${c.columnId}:${c.width}`).join('|')

  // Load pretext on mount
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    loadPretext().then((mod) => {
      if (!cancelled && mod) setPretext(mod)
    })
    return () => { cancelled = true }
  }, [enabled])

  // Cache prepared text handles — keyed by "text|font"
  // These survive column resizes (only layout() needs to re-run)
  const preparedCacheRef = useRef<Map<string, PreparedText>>(new Map())

  // Phase 1: prepare() — runs when data or fonts change
  const preparedCells = useMemo(() => {
    if (!pretext || !enabled || data.length === 0 || columns.length === 0) return null

    const cache = preparedCacheRef.current
    const start = performance.now()
    const result: { rowIndex: number; columnId: string; prepared: PreparedText }[] = []

    for (let r = 0; r < data.length; r++) {
      for (const col of columns) {
        const text = getCellText(data[r], col.columnId)
        if (!text) continue
        const key = `${text}|${col.font}`
        let prepared = cache.get(key)
        if (!prepared) {
          prepared = pretext.prepare(text, col.font)
          cache.set(key, prepared)
        }
        result.push({ rowIndex: r, columnId: col.columnId, prepared })
      }
    }

    prepareTimeRef.current = performance.now() - start
    return result
    // Re-run when data changes or fonts change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pretext, enabled, data, columns.map((c) => `${c.columnId}:${c.font}`).join('|')])

  // Phase 2: layout() — runs when column widths change (pure math, instant)
  const measurement = useMemo(() => {
    if (!pretext || !preparedCells || preparedCells.length === 0) {
      return { rowHeights: null, prefixSums: null, totalHeight: 0 }
    }

    const start = performance.now()
    const rowHeights = new Float64Array(data.length).fill(minRowHeight)

    // Column config lookup
    const colMap = new Map<string, CellMeasurement>()
    for (const col of columns) colMap.set(col.columnId, col)

    // Layout every cell and take max height per row
    for (const { rowIndex, columnId, prepared } of preparedCells) {
      const col = colMap.get(columnId)
      if (!col) continue
      const result = pretext.layout(prepared, col.width, col.lineHeight)
      const cellHeight = result.height + (col.padding ?? 16)
      if (cellHeight > rowHeights[rowIndex]) {
        rowHeights[rowIndex] = cellHeight
      }
    }

    // Build prefix sums for O(log n) binary search in virtualizer
    const prefixSums = new Float64Array(data.length + 1)
    for (let i = 0; i < data.length; i++) {
      prefixSums[i + 1] = prefixSums[i] + rowHeights[i]
    }

    layoutTimeRef.current = performance.now() - start

    return {
      rowHeights,
      prefixSums,
      totalHeight: prefixSums[data.length],
    }
    // Re-run on column width changes (layout is pure math, ~15ms for 50k cells)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pretext, preparedCells, columnWidthsKey, minRowHeight, data.length])

  // Mark ready once we have heights
  useEffect(() => {
    if (measurement.rowHeights) setReady(true)
  }, [measurement.rowHeights])

  return {
    rowHeights: measurement.rowHeights,
    prefixSums: measurement.prefixSums,
    totalHeight: measurement.totalHeight,
    ready,
    prepareTimeMs: prepareTimeRef.current,
    layoutTimeMs: layoutTimeRef.current,
  }
}
