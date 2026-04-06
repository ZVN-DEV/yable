'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  useTable,
  Table,
  createColumnHelper,
  usePretextMeasurement,
  CellBadge,
  CellNumeric,
  CellStatus,
  type CellMeasurement,
} from '@yable/react'
import s from './pretext-demo.module.css'

/* ── Data with variable-length text ────────────────────────────────────── */

interface Article {
  id: number
  title: string
  author: string
  category: string
  excerpt: string
  wordCount: number
  publishedAt: string
  status: 'published' | 'draft' | 'review'
}

const categories = ['Technology', 'Design', 'Engineering', 'Product', 'Culture', 'Research']
const authors = [
  'Alice Chen', 'Bob Martinez', 'Carol Wu', 'David Okafor', 'Eve Johansson',
  'Frank Patel', 'Grace Kim', 'Henry Dubois', 'Ivy Tanaka', 'Jack Morrison',
]

const excerpts = [
  'A brief note on API design.',
  'The rise of edge computing has fundamentally changed how we think about latency and data locality in distributed systems.',
  'Understanding memory allocation patterns in modern garbage collectors requires a deep dive into generational collection strategies, concurrent marking algorithms, and the tradeoffs between throughput and pause time that every runtime must navigate.',
  'CSS Grid changed everything.',
  'When we started migrating our monolith to microservices, we quickly learned that the hardest problems weren\'t technical at all. They were organizational. Conway\'s Law hit us hard, and we had to restructure three teams before the architecture could follow.',
  'TypeScript 5.0 is here.',
  'The debate between server-side rendering and client-side rendering has evolved into a nuanced conversation about streaming, partial hydration, resumability, and the spectrum of rendering strategies that modern frameworks now support. There is no single right answer, and the best choice depends on your specific use case, audience, and performance requirements.',
  'Quick thoughts on testing.',
  'Building accessible data tables is one of the most underappreciated challenges in web development. Screen readers, keyboard navigation, ARIA roles, focus management, and semantic HTML all need to work in concert to create an experience that serves every user equally.',
  'React Server Components represent a paradigm shift in how we compose applications. By moving data fetching to the server while maintaining component-level granularity, we can eliminate client-server waterfalls without sacrificing the developer experience that made React popular in the first place.',
  'Ship it.',
  'Performance optimization is a journey that starts with measurement. Without real user monitoring data, you are optimizing in the dark. Lighthouse scores are useful but they only tell part of the story. Core Web Vitals from field data paint the complete picture of how your users actually experience your application in the wild, across different devices, networks, and geographies.',
  'The art of code review goes beyond catching bugs. Great reviewers teach, mentor, and elevate the entire team\'s understanding of the codebase. They ask questions instead of making demands. They explain the "why" behind their suggestions.',
  'Vim or Emacs?',
  'Database indexing strategies can make or break your application at scale. A missing index on a frequently queried column can turn a 2ms query into a 20-second table scan. But over-indexing has its own costs: write amplification, increased storage, and longer backup times.',
]

const titles = [
  'API Design Principles for the Modern Web',
  'Edge Computing and the Future of Latency',
  'Deep Dive: Memory Allocation in GC Runtimes',
  'CSS Grid: A Complete Guide',
  'Lessons from Our Microservices Migration',
  'What\'s New in TypeScript 5.0',
  'The Rendering Spectrum: SSR, CSR, and Beyond',
  'A Minimalist Approach to Testing',
  'Building Truly Accessible Data Tables',
  'React Server Components: A Paradigm Shift',
  'The Power of Shipping Fast',
  'Performance: From Lighthouse to Real Users',
  'The Art of the Code Review',
  'Editor Wars: A Brief History',
  'Database Indexing at Scale',
]

function generateArticles(count: number): Article[] {
  const statuses: Article['status'][] = ['published', 'draft', 'review']
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: titles[i % titles.length],
    author: authors[i % authors.length],
    category: categories[i % categories.length],
    excerpt: excerpts[i % excerpts.length],
    wordCount: 120 + (i * 347) % 3000,
    publishedAt: `${2023 + (i % 3)}-${String(1 + (i * 3) % 12).padStart(2, '0')}-${String(1 + (i * 7) % 28).padStart(2, '0')}`,
    status: statuses[i % 3],
  }))
}

/* ── Column Definitions ────────────────────────────────────────────────── */

const columnHelper = createColumnHelper<Article>()

const columns = [
  columnHelper.accessor('title', {
    header: 'Title',
    cell: (info: any) => <span className={s.cellTitle}>{info.getValue()}</span>,
    size: 250,
  }),
  columnHelper.accessor('excerpt', {
    header: 'Excerpt',
    cell: (info: any) => <span className={s.cellExcerpt}>{info.getValue()}</span>,
    size: 400,
  }),
  columnHelper.accessor('author', {
    header: 'Author',
    cell: (info: any) => <span className={s.cellAuthor}>{info.getValue()}</span>,
    size: 140,
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info: any) => <CellBadge context={info} variant="accent" appearance="soft" />,
    size: 120,
  }),
  columnHelper.accessor('wordCount', {
    header: 'Words',
    cell: (info: any) => <CellNumeric context={info} />,
    size: 80,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info: any) => <CellStatus context={info} />,
    size: 100,
  }),
]

/* ── Dataset Sizes ─────────────────────────────────────────────────────── */

const DATASETS: Record<string, number> = {
  '100': 100,
  '500': 500,
  '1,000': 1000,
  '5,000': 5000,
  '10,000': 10000,
}

/* ── The body font used in yable tables (IBM Plex Sans from layout.tsx) ── */

const TABLE_FONT = '400 13px "IBM Plex Sans", sans-serif'
const TABLE_LINE_HEIGHT = 20
const CELL_PADDING = 16 // 8px top + 8px bottom

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function PretextDemoPage() {
  const [dataSize, setDataSize] = useState('1,000')
  const [usePretextMode, setUsePretextMode] = useState(true)
  const data = useMemo(() => generateArticles(DATASETS[dataSize]), [dataSize])

  // Define which columns need text measurement
  const cellMeasurements: CellMeasurement[] = useMemo(() => [
    { columnId: 'title', width: 250, font: '500 13px "IBM Plex Sans", sans-serif', lineHeight: TABLE_LINE_HEIGHT, padding: CELL_PADDING },
    { columnId: 'excerpt', width: 400, font: TABLE_FONT, lineHeight: TABLE_LINE_HEIGHT, padding: CELL_PADDING },
  ], [])

  // Extract text from row for measurement
  const getCellText = useCallback((row: Article, columnId: string) => {
    return String((row as any)[columnId] ?? '')
  }, [])

  // Pretext measurement
  const {
    rowHeights,
    prefixSums,
    totalHeight: pretextTotalHeight,
    ready: pretextReady,
    prepareTimeMs,
    layoutTimeMs,
  } = usePretextMeasurement({
    data,
    columns: cellMeasurements,
    getCellText,
    minRowHeight: 40,
    enabled: usePretextMode,
  })

  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
    enableVirtualization: true,
    pretextHeights: usePretextMode && pretextReady ? rowHeights : undefined,
    pretextPrefixSums: usePretextMode && pretextReady ? prefixSums : undefined,
    rowHeight: 40,
    // Disable pagination so all rows go to virtualizer
    initialState: { pagination: { pageIndex: 0, pageSize: 100_000 } },
  })

  // Compute height distribution stats
  const heightStats = useMemo(() => {
    if (!rowHeights) return null
    let min = Infinity, max = -Infinity, sum = 0
    const unique = new Set<number>()
    for (let i = 0; i < data.length; i++) {
      const h = rowHeights[i]
      if (h < min) min = h
      if (h > max) max = h
      sum += h
      unique.add(Math.round(h))
    }
    return {
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(sum / data.length),
      uniqueHeights: unique.size,
    }
  }, [rowHeights, data.length])

  return (
    <div className={s.page}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>Pretext + Yable</h1>
          <p className={s.subtitle}>Pixel-perfect variable-height virtualization</p>
        </div>
        <div className={s.headerRight}>
          <a href="/playground" className={s.backLink}>Playground</a>
        </div>
      </header>

      {/* ── Controls ────────────────────────────────────────────────── */}
      <div className={s.controls}>
        <div className={s.controlGroup}>
          <label className={s.controlLabel}>Rows</label>
          <div className={s.btnGroup}>
            {Object.keys(DATASETS).map((key) => (
              <button
                key={key}
                type="button"
                className={`${s.btn} ${dataSize === key ? s.btnActive : ''}`}
                onClick={() => setDataSize(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className={s.controlGroup}>
          <label className={s.controlLabel}>Mode</label>
          <div className={s.btnGroup}>
            <button
              type="button"
              className={`${s.btn} ${usePretextMode ? s.btnActive : ''}`}
              onClick={() => setUsePretextMode(true)}
            >
              Pretext (exact)
            </button>
            <button
              type="button"
              className={`${s.btn} ${!usePretextMode ? s.btnActive : ''}`}
              onClick={() => setUsePretextMode(false)}
            >
              Fixed 40px
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className={s.stats}>
        <div className={s.stat}>
          <span className={s.statLabel}>Rows</span>
          <span className={s.statValue}>{data.length.toLocaleString()}</span>
        </div>
        {usePretextMode ? (
          <>
            <div className={s.stat}>
              <span className={s.statLabel}>prepare()</span>
              <span className={`${s.statValue} ${s.statHighlight}`}>
                {pretextReady ? `${prepareTimeMs.toFixed(1)}ms` : '...'}
              </span>
            </div>
            <div className={s.stat}>
              <span className={s.statLabel}>layout()</span>
              <span className={`${s.statValue} ${s.statHighlight}`}>
                {pretextReady ? `${layoutTimeMs.toFixed(2)}ms` : '...'}
              </span>
            </div>
            <div className={s.stat}>
              <span className={s.statLabel}>Total Height</span>
              <span className={s.statValue}>
                {pretextReady ? `${Math.round(pretextTotalHeight).toLocaleString()}px` : '...'}
              </span>
            </div>
            {heightStats && (
              <>
                <div className={s.stat}>
                  <span className={s.statLabel}>Height Range</span>
                  <span className={s.statValue}>{heightStats.min}–{heightStats.max}px</span>
                </div>
                <div className={s.stat}>
                  <span className={s.statLabel}>Unique Heights</span>
                  <span className={s.statValue}>{heightStats.uniqueHeights}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className={s.stat}>
              <span className={s.statLabel}>Row Height</span>
              <span className={s.statValue}>40px (fixed)</span>
            </div>
            <div className={s.stat}>
              <span className={s.statLabel}>Total Height</span>
              <span className={s.statValue}>{(data.length * 40).toLocaleString()}px</span>
            </div>
            <div className={s.stat}>
              <span className={s.statLabel}>Unique Heights</span>
              <span className={s.statValue}>1</span>
            </div>
          </>
        )}
      </div>

      {/* ── Mode Indicator ──────────────────────────────────────────── */}
      <div className={`${s.modeIndicator} ${usePretextMode ? s.modePretext : s.modeFixed}`}>
        {usePretextMode ? (
          <>
            <span className={s.modeDot} />
            Pretext: Every row height pre-computed before render. No DOM measurement. No scroll jitter.
          </>
        ) : (
          <>
            <span className={s.modeDotFixed} />
            Fixed 40px: Text clips. Every row same height. Standard approach.
          </>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className={s.tableWrap}>
        <Table
          table={table}
          theme="midnight"
          striped
          bordered
          stickyHeader
        />
      </div>

      {/* ── Explainer ───────────────────────────────────────────────── */}
      <div className={s.explainer}>
        <h2 className={s.explainerTitle}>How it works</h2>
        <div className={s.explainerGrid}>
          <div className={s.explainerCard}>
            <span className={s.explainerStep}>1</span>
            <h3>prepare(text, font)</h3>
            <p>Measures every glyph width via Canvas API. One-time cost per unique text+font combo. Cached across cells.</p>
          </div>
          <div className={s.explainerCard}>
            <span className={s.explainerStep}>2</span>
            <h3>layout(width, lineHeight)</h3>
            <p>Pure arithmetic. Given column width, returns exact pixel height. ~0.0003ms per cell. 50k cells in 15ms.</p>
          </div>
          <div className={s.explainerCard}>
            <span className={s.explainerStep}>3</span>
            <h3>Prefix sums + binary search</h3>
            <p>Pre-computed cumulative heights enable O(log n) scroll position lookup. Instant scrollTo for any row.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
