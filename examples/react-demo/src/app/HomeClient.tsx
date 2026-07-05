'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  useTable,
  Table,
  Pagination,
  GlobalFilter,
  CellInput,
  CellSelect,
  CellCheckbox,
  createColumnHelper,
  useTableRowHeights,
  type ColumnDef,
  type TableInstance,
  type CellMeasureRecipe,
} from '@zvndev/yable-react'
import { people, departments, type Person } from '@/data'
import s from './page.module.css'

/* Theme CSS — moved from layout.tsx so they only load where needed */
import '@zvndev/yable-themes/stripe.css'
import '@zvndev/yable-themes/compact.css'
import '@zvndev/yable-themes/ocean.css'
import '@zvndev/yable-themes/forest.css'
import '@zvndev/yable-themes/rose.css'
import '@zvndev/yable-themes/mono.css'

/* ─────────────────────────────────────────────────────────────────────────
 * Formatters
 * ─────────────────────────────────────────────────────────────────────── */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00Z`))
}

/* ─────────────────────────────────────────────────────────────────────────
 * Column helpers + data
 * ─────────────────────────────────────────────────────────────────────── */

const columnHelper = createColumnHelper<Person>()
const themePreviewData = people.slice(0, 5)

const allThemes = [
  { id: 'midnight', label: 'Midnight', accent: '#6ec7ff' },
  { id: 'default', label: 'Default', accent: '#d8b46d' },
  { id: 'stripe', label: 'Stripe', accent: '#89a4ff' },
  { id: 'compact', label: 'Compact', accent: '#76d8b7' },
  { id: 'ocean', label: 'Ocean', accent: '#57c6d8' },
  { id: 'forest', label: 'Forest', accent: '#8fc7a0' },
  { id: 'rose', label: 'Rose', accent: '#f08d92' },
  { id: 'mono', label: 'Mono', accent: '#d8d0c4' },
] as const

type ThemeId = (typeof allThemes)[number]['id']
type DemoTab = 'data' | 'editable' | 'themes'

const CURRENT_VERSION = '0.5.0'
const PASSING_TESTS = '596'
const REACT_GZIPPED_SIZE = '35.5kB'

/* ─────────────────────────────────────────────────────────────────────────
 * Comparison table data
 * ─────────────────────────────────────────────────────────────────────── */

type CompareCell = 'yes' | 'no' | 'partial' | 'paid'
type CompareRow = {
  label: string
  yable: CompareCell
  tanstack: CompareCell
  agCommunity: CompareCell
  agEnterprise: CompareCell
  note?: string
}

const compareRows: CompareRow[] = [
  { label: 'Headless core', yable: 'yes', tanstack: 'yes', agCommunity: 'no', agEnterprise: 'no' },
  {
    label: 'React components shipped',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'yes',
    agEnterprise: 'yes',
  },
  {
    label: 'Cell editing (text, select, checkbox\u2026)',
    yable: 'yes',
    tanstack: 'partial',
    agCommunity: 'yes',
    agEnterprise: 'yes',
  },
  {
    label: 'Sorting / filtering / pagination',
    yable: 'yes',
    tanstack: 'yes',
    agCommunity: 'yes',
    agEnterprise: 'yes',
  },
  {
    label: 'Pivot tables',
    yable: 'partial',
    tanstack: 'no',
    agCommunity: 'no',
    agEnterprise: 'paid',
    note: 'Yable: programmatic row model — render is DIY',
  },
  {
    label: 'Formula engine',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'no',
    agEnterprise: 'paid',
  },
  {
    label: 'Clipboard copy / paste / TSV',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'no',
    agEnterprise: 'paid',
  },
  {
    label: 'Fill handle (linear + geometric)',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'no',
    agEnterprise: 'paid',
  },
  {
    label: 'Undo / redo with event hooks',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'yes',
    agEnterprise: 'yes',
  },
  {
    label: 'Tree data / hierarchical rows',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'no',
    agEnterprise: 'paid',
  },
  {
    label: 'Async cell commits + retry',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'no',
    agEnterprise: 'no',
  },
  {
    label: '8 themed token packs',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'partial',
    agEnterprise: 'partial',
  },
  {
    label: 'Row virtualization',
    yable: 'yes',
    tanstack: 'partial',
    agCommunity: 'yes',
    agEnterprise: 'yes',
  },
  {
    label: 'Keyboard navigation grid',
    yable: 'yes',
    tanstack: 'no',
    agCommunity: 'yes',
    agEnterprise: 'yes',
  },
  {
    label: 'Column drag-to-reorder',
    yable: 'yes',
    tanstack: 'partial',
    agCommunity: 'partial',
    agEnterprise: 'partial',
    note: 'animated drop indicator in Yable',
  },
  { label: 'License', yable: 'yes', tanstack: 'yes', agCommunity: 'yes', agEnterprise: 'paid' },
]

/* ─────────────────────────────────────────────────────────────────────────
 * Yable vs AG Grid — headline two-column comparison
 * ─────────────────────────────────────────────────────────────────────── */

type AgRow = {
  label: string
  yable: CompareCell
  ag: CompareCell
  yableNote?: string
  agNote?: string
}

const agGridRows: AgRow[] = [
  {
    label: 'Clipboard copy / paste / TSV',
    yable: 'yes',
    yableNote: 'MIT',
    ag: 'paid',
    agNote: 'Enterprise',
  },
  {
    label: 'Excel-style fill handle',
    yable: 'yes',
    yableNote: 'MIT',
    ag: 'paid',
    agNote: 'Enterprise',
  },
  {
    label: 'Tree data / hierarchical rows',
    yable: 'yes',
    yableNote: 'MIT',
    ag: 'paid',
    agNote: 'Enterprise',
  },
  {
    label: 'Row grouping render',
    yable: 'yes',
    yableNote: 'MIT',
    ag: 'paid',
    agNote: 'Enterprise',
  },
  {
    label: 'Pivot tables',
    yable: 'partial',
    yableNote: 'programmatic',
    ag: 'paid',
    agNote: 'Enterprise',
  },
  {
    label: 'Animated column drag-to-reorder',
    yable: 'yes',
    yableNote: 'premium',
    ag: 'partial',
    agNote: 'basic, no animation',
  },
  { label: 'Column pinning', yable: 'yes', ag: 'yes', agNote: 'Community' },
  { label: 'Column resizing', yable: 'yes', ag: 'yes', agNote: 'Community' },
  { label: 'Headless core', yable: 'yes', ag: 'no' },
  { label: 'Zero-dependency core', yable: 'yes', ag: 'no' },
]

/* ─────────────────────────────────────────────────────────────────────────
 * Crown jewel feature cards
 * ─────────────────────────────────────────────────────────────────────── */

const showcaseFeatures = [
  {
    eyebrow: 'FormulaEngine',
    title: 'Real formula engine.',
    copy: (
      <>
        Tokenizer → AST → recursive evaluator with dependency graph and circular-ref detection. 17
        functions: <code>SUM</code>, <code>IF</code>, <code>ROUND</code>, etc.
      </>
    ),
    code: '=SUM(B2:B12) * IF(D2 > 100, 1.1, 1)',
  },
  {
    eyebrow: 'getPivotRowModel',
    title: 'Pivot row model.',
    copy: (
      <>
        <code>getPivotRowModel()</code> returns real aggregated rows — row groups, column groups,
        subtotals, grand totals — from one config. React <code>&lt;Table&gt;</code> can render the
        generated pivot rows and dynamic columns directly.
      </>
    ),
    code: 'const pivot = table.getPivotRowModel({\n  rows: ["region"],\n  values: [{ field: "revenue", aggregation: "sum" }],\n})',
  },
  {
    eyebrow: 'onCommit',
    title: 'Async cell commits.',
    copy: (
      <>
        <code>onCommit</code> batches edits and sends them to your API. Pending/saved/error states
        render per-cell. Auto-retry on failure.
      </>
    ),
    code: 'onCommit: async (patches) => {\n  await api.save(patches)\n}',
  },
]

/* ─────────────────────────────────────────────────────────────────────────
 * SPEED SECTION data + columns
 * ─────────────────────────────────────────────────────────────────────── */

interface SpeedRow {
  id: number
  title: string
  excerpt: string
  author: string
  category: 'Engineering' | 'Design' | 'Product' | 'Research'
}

const speedTitles = [
  'API design for the modern web',
  'Edge computing and latency',
  'Memory allocation in GC runtimes',
  'CSS Grid: a complete guide',
  'Lessons from a microservices migration',
  "What's new in TypeScript 5.0",
  'The rendering spectrum: SSR, CSR, beyond',
  'A minimalist approach to testing',
  'Building truly accessible data tables',
  'The power of shipping fast',
  'Performance: from Lighthouse to real users',
  'The art of the code review',
]

const speedExcerpts = [
  'A brief note on API shape.',
  'The rise of edge computing has fundamentally changed how we think about latency and data locality in distributed systems. Even the best-laid caching strategies break down once you try to coordinate across more than two regions.',
  'Understanding memory allocation patterns in modern garbage collectors requires a deep dive into generational collection strategies, concurrent marking algorithms, and the tradeoffs between throughput and pause time that every runtime must navigate.',
  'CSS Grid changed everything about layout.',
  'When we started migrating our monolith to microservices, we quickly learned that the hardest problems were not technical at all \u2014 they were organizational. Conway\u2019s Law hit us hard, and we had to restructure three teams before the architecture could follow.',
  'TypeScript 5.0 is here and it brings decorators, const type parameters, and a smarter inference story.',
  'The debate between server-side rendering and client-side rendering has evolved into a nuanced conversation about streaming, partial hydration, resumability, and the full spectrum of rendering strategies that modern frameworks now support in production.',
  'Quick thoughts on test pyramids.',
  'Building accessible data tables is one of the most underappreciated challenges in web development. Screen readers, keyboard navigation, ARIA roles, focus management, and semantic HTML all need to work in concert to create an experience that serves every user equally well.',
  'Ship it, then learn from production.',
  'Performance optimization is a journey that starts with measurement. Without real user monitoring data, you are optimizing in the dark. Lighthouse scores are useful but they only tell part of the story.',
  'The art of code review goes beyond catching bugs. Great reviewers teach, mentor, and elevate the entire team\u2019s understanding of the codebase by asking questions instead of making demands.',
]

const speedAuthorNames = [
  'Alice Chen',
  'Bob Martinez',
  'Carol Wu',
  'David Okafor',
  'Eve Johansson',
  'Frank Patel',
  'Grace Kim',
  'Henry Dubois',
]

const speedCategoryList: SpeedRow['category'][] = ['Engineering', 'Design', 'Product', 'Research']

function generateSpeedRows(count: number): SpeedRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: speedTitles[i % speedTitles.length]!,
    excerpt: speedExcerpts[i % speedExcerpts.length]!,
    author: speedAuthorNames[i % speedAuthorNames.length]!,
    category: speedCategoryList[i % speedCategoryList.length]!,
  }))
}

const SPEED_TITLE_RECIPE: CellMeasureRecipe = {
  font: '500 13px "IBM Plex Sans", sans-serif',
  lineHeight: 20,
  padding: 14,
}

const SPEED_EXCERPT_RECIPE: CellMeasureRecipe = {
  font: '400 13px "IBM Plex Sans", sans-serif',
  lineHeight: 20,
  padding: 14,
}

const speedColumnHelper = createColumnHelper<SpeedRow>()

const speedColumns: ColumnDef<SpeedRow, any>[] = [
  speedColumnHelper.accessor('title', {
    header: 'Title',
    cell: (info: any) => <span className={s.speedCellTitle}>{info.getValue()}</span>,
    size: 220,
    measureRecipe: SPEED_TITLE_RECIPE,
  }) as ColumnDef<SpeedRow, any>,
  speedColumnHelper.accessor('excerpt', {
    header: 'Excerpt',
    cell: (info: any) => <span className={s.speedCellExcerpt}>{info.getValue()}</span>,
    size: 440,
    measureRecipe: SPEED_EXCERPT_RECIPE,
  }) as ColumnDef<SpeedRow, any>,
  speedColumnHelper.accessor('author', {
    header: 'Author',
    cell: (info: any) => <span className={s.speedCellAuthor}>{info.getValue()}</span>,
    size: 140,
  }) as ColumnDef<SpeedRow, any>,
  speedColumnHelper.accessor('category', {
    header: 'Category',
    cell: (info: any) => (
      <span className={getCategoryClassName(info.getValue() as string)}>{info.getValue()}</span>
    ),
    size: 130,
  }) as ColumnDef<SpeedRow, any>,
]

const SPEED_SIZES = [100, 1000, 5000, 10000, 25000] as const
type SpeedSize = (typeof SPEED_SIZES)[number]

function formatSpeedSize(n: SpeedSize) {
  return n >= 1000 ? `${n / 1000}K` : String(n)
}

/* ─────────────────────────────────────────────────────────────────────────
 * Main demo columns
 * ─────────────────────────────────────────────────────────────────────── */

const mainColumns: ColumnDef<Person, any>[] = [
  columnHelper.display({
    id: 'select',
    header: ({ table }: { table: TableInstance<Person> }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={() => table.toggleAllRowsSelected()}
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }: { row: any }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={() => row.toggleSelected()}
        aria-label={`Select row ${row.id}`}
      />
    ),
    size: 40,
  }),
  columnHelper.accessor('firstName', {
    header: 'First Name',
    cell: (info: any) => info.getValue(),
    size: 120,
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
    cell: (info: any) => info.getValue(),
    size: 120,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info: any) => <span className={s.emailValue}>{info.getValue()}</span>,
    size: 220,
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: (info: any) => <span className={s.numericValue}>{info.getValue()}</span>,
    size: 70,
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    cell: (info: any) => (
      <span className={getDepartmentClassName(info.getValue() as string)}>{info.getValue()}</span>
    ),
    size: 140,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: (info: any) => info.getValue(),
    size: 200,
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    cell: (info: any) => (
      <span className={s.currencyValue}>{currencyFormatter.format(info.getValue() as number)}</span>
    ),
    size: 120,
  }),
  columnHelper.accessor('startDate', {
    header: 'Start Date',
    cell: (info: any) => formatDate(info.getValue() as string),
    size: 130,
  }),
  columnHelper.accessor('active', {
    header: 'Status',
    cell: (info: any) => (
      <span
        className={`${s.statusPill} ${
          info.getValue() ? s.statusPillPositive : s.statusPillNegative
        }`}
      >
        <span className={s.statusPillDot} />
        {info.getValue() ? 'Active' : 'Inactive'}
      </span>
    ),
    size: 110,
  }),
]

const editableColumns: ColumnDef<Person, any>[] = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} />,
    meta: { alwaysEditable: true },
    size: 110,
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} />,
    meta: { alwaysEditable: true },
    size: 110,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} type="email" />,
    meta: { alwaysEditable: true },
    size: 200,
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    editable: true,
    editConfig: {
      type: 'select',
      options: departments.map((department) => ({
        label: department,
        value: department,
      })),
    },
    cell: (info: any) => (
      <CellSelect
        context={info}
        options={departments.map((department) => ({
          label: department,
          value: department,
        }))}
      />
    ),
    meta: { alwaysEditable: true },
    size: 140,
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    editable: true,
    editConfig: { type: 'number' },
    cell: (info: any) => <CellInput context={info} type="number" />,
    meta: { alwaysEditable: true },
    size: 110,
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    editable: true,
    editConfig: { type: 'checkbox' },
    cell: (info: any) => <CellCheckbox context={info} />,
    meta: { alwaysEditable: true },
    size: 70,
  }),
]

const miniColumns: ColumnDef<Person, any>[] = [
  columnHelper.accessor('firstName', {
    header: 'Name',
    cell: (info: any) => info.getValue(),
    size: 100,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: (info: any) => info.getValue(),
    size: 140,
  }),
  columnHelper.accessor('department', {
    header: 'Dept',
    cell: (info: any) => info.getValue(),
    size: 100,
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    cell: (info: any) => currencyFormatter.format(info.getValue() as number).replace('.00', ''),
    size: 100,
  }),
]

/* ─────────────────────────────────────────────────────────────────────────
 * Icon components
 * ─────────────────────────────────────────────────────────────────────── */

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M10.8 10.8a4.8 4.8 0 1 1 .8-.8l3.2 3.2-.8.8-3.2-3.2Z" fill="currentColor" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M10 3 4.5 8.5 2 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * Hooks
 * ─────────────────────────────────────────────────────────────────────── */

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      valueRef.current = target
      setValue(target)
      return
    }

    const from = valueRef.current
    const to = target
    if (from === to) return

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (to - from) * eased
      valueRef.current = next
      setValue(next)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        valueRef.current = to
        setValue(to)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mql.matches)
    update()
    if (mql.addEventListener) {
      mql.addEventListener('change', update)
      return () => mql.removeEventListener('change', update)
    }
    mql.addListener(update)
    return () => mql.removeListener(update)
  }, [])

  return reduced
}

/* ─────────────────────────────────────────────────────────────────────────
 * Hero code tabs
 * ─────────────────────────────────────────────────────────────────────── */

const codeTabs = ['install', 'basic', 'edit', 'formula', 'pivot'] as const
type CodeTab = (typeof codeTabs)[number]
const codeTabLabels: Record<CodeTab, string> = {
  install: 'Install',
  basic: 'Basic',
  edit: 'Edit',
  formula: 'Formula',
  pivot: 'Pivot',
}

/* ─────────────────────────────────────────────────────────────────────────
 * HomeClient — main page component
 * ─────────────────────────────────────────────────────────────────────── */

interface HomeClientProps {
  codeBlocks: Record<string, string>
}

export default function HomeClient({ codeBlocks }: HomeClientProps) {
  const [tab, setTab] = useState<DemoTab>('data')
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('forest')
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('basic')
  const [copied, setCopied] = useState(false)
  const reducedMotion = useReducedMotion()

  const copyInstall = () => {
    navigator.clipboard.writeText('npm i @zvndev/yable-react @zvndev/yable-themes')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={s.page} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <div className={s.inner}>
        {/* ── Section 1: HERO ───────────────────────────────────────── */}
        <header className={s.hero}>
          <div className={s.heroCopy}>
            <div className={s.kickerRow}>
              <span className={s.kicker}>{`v${CURRENT_VERSION}`} · MIT licensed</span>
              <span className={s.kickerDivider} />
              <span className={s.kickerMeta}>React · Vanilla · Headless · Themeable</span>
            </div>

            <h1 className={s.heroTitle}>
              <span className={s.heroLine}>The only table package</span>
              <span className={`${s.heroLine} ${s.heroLineAccent}`}>you&apos;ll ever need.</span>
              <span className="sr-only">
                Open-source React data table with AG Grid-class features — clipboard, pivot, row
                grouping, formulas, and animated column drag — MIT-licensed with a zero-dependency
                headless core.
              </span>
            </h1>

            <p className={s.heroLead}>
              Headless core, batteries-included React. AG Grid-class features &mdash; clipboard,
              pivot, row grouping, Excel-style fills, and premium{' '}
              <strong>animated column drag-to-reorder</strong> &mdash; MIT-licensed, no paywall,
              zero-dependency core.
            </p>

            <div className={s.installStrip}>
              <code className={s.installCode}>npm i @zvndev/yable-react @zvndev/yable-themes</code>
              <button
                className={s.installCopy}
                onClick={copyInstall}
                aria-label="Copy install command"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className={s.heroCtas}>
              <Link href="/gallery" className={s.heroCtaPrimary}>
                Explore the gallery<span aria-hidden="true">→</span>
              </Link>
              <Link href="/docs/quickstart" className={s.heroCtaSecondary}>
                Read the docs<span aria-hidden="true">→</span>
              </Link>
              <Link href="/drag-lab" className={s.heroCtaSecondary}>
                <span className={s.heroCtaBadge}>New</span>
                Try column drag<span aria-hidden="true">→</span>
              </Link>
              <a
                href="https://github.com/ZVN-DEV/yable"
                target="_blank"
                rel="noreferrer"
                className={s.heroCtaSecondary}
              >
                GitHub
              </a>
            </div>

            <div className={s.trustStrip}>
              <div className={s.trustItem}>
                <span className={s.trustValue}>{PASSING_TESTS}</span>
                <span className={s.trustLabel}>passing tests</span>
              </div>
              <div className={s.trustItem}>
                <span className={s.trustValue}>{REACT_GZIPPED_SIZE}</span>
                <span className={s.trustLabel}>React pkg gzipped</span>
              </div>
              <div className={s.trustItem}>
                <span className={s.trustValue}>0</span>
                <span className={s.trustLabel}>core runtime deps</span>
              </div>
            </div>
          </div>

          <div className={s.heroCode}>
            <nav className={s.codeTabBar}>
              {codeTabs.map((t) => (
                <button
                  key={t}
                  className={`${s.codeTab} ${activeCodeTab === t ? s.codeTabActive : ''}`}
                  onClick={() => setActiveCodeTab(t)}
                >
                  {codeTabLabels[t]}
                </button>
              ))}
            </nav>
            <div
              className={s.codePanel}
              dangerouslySetInnerHTML={{ __html: codeBlocks[activeCodeTab] }}
            />
          </div>
        </header>

        {/* ── Section 2: YABLE vs AG GRID (headline framing) ───────── */}
        <AgGridCompare />

        {/* ── Section 3: FULL FEATURE MATRIX ───────────────────────── */}
        <section className={s.compareSection} aria-label="Feature comparison">
          <div className={s.compareHeader}>
            <span className={s.sectionEyebrow}>Full matrix</span>
            <h2 className={s.compareTitle}>The rest of the field.</h2>
            <p className={s.compareSub}>
              Every Yable checkmark is verifiable in this repo. Competitor columns focus on built-in
              behavior rather than custom code or extra packages.
            </p>
          </div>
          <CompareTable />
        </section>

        {/* ── Section 3: CROWN JEWELS + LIVE DEMO ──────────────────── */}
        <section className={s.featureSection} aria-label="Key features and live demo">
          <div className={s.featureHeader}>
            <span className={s.sectionEyebrow}>Built In</span>
            <h2 className={s.sectionTitle}>Stuff you&apos;d normally bolt together yourself.</h2>
          </div>

          <div className={s.featureGrid}>
            {showcaseFeatures.map((feature) => (
              <article key={feature.title} className={s.featureCard}>
                <span className={s.featureEyebrow}>{feature.eyebrow}</span>
                <h3 className={s.featureTitle}>{feature.title}</h3>
                <p className={s.featureCopy}>{feature.copy}</p>
                <pre className={s.featureCode}>
                  <code>{feature.code}</code>
                </pre>
              </article>
            ))}
          </div>

          <div className={s.demoArea}>
            <nav className={s.tabBar} aria-label="Demo tabs">
              {(
                [
                  ['data', 'Data'],
                  ['editable', 'Editing'],
                  ['themes', 'Themes'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`${s.tabButton} ${tab === key ? s.tabButtonActive : ''}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className={s.demoMain}>
              {tab === 'data' && <BasicDemo />}
              {tab === 'editable' && <EditableDemo />}
              {tab === 'themes' && (
                <ThemeGallery selected={selectedTheme} onSelect={setSelectedTheme} />
              )}
            </div>
          </div>
        </section>

        {/* ── Section 4: SPEED SHOWCASE ────────────────────────────── */}
        <SpeedShowcase />

        {/* ── Section 5: CTA FOOTER ────────────────────────────────── */}
        <section className={s.ctaSection}>
          <div className={s.ctaCard}>
            <div className={s.ctaCopy}>
              <span className={s.sectionEyebrow}>Get Started</span>
              <h2 className={s.ctaTitle}>11-step quickstart.</h2>
              <p className={s.ctaLead}>
                Each step has copy-paste code tested in a live Next.js app.
              </p>
            </div>
            <div className={s.ctaActions}>
              <Link href="/docs/quickstart" className={s.heroCtaPrimary}>
                Quickstart <span aria-hidden="true">→</span>
              </Link>
              <Link href="/docs/features" className={s.heroCtaSecondary}>
                Features
              </Link>
              <Link href="/docs/features/async-commits" className={s.heroCtaSecondary}>
                Async Commits
              </Link>
            </div>
          </div>

          <p className={s.footerPackages}>Ships as 4 packages: core, react, vanilla, themes.</p>

          <nav className={s.footerLinks} aria-label="More resources">
            <Link href="/gallery">Gallery</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/docs/api">API Reference</Link>
            <Link href="/playground">Playground</Link>
            <Link href="/drag-lab">Drag Lab</Link>
            <Link href="/benchmark">Benchmark</Link>
            <Link href="/tailwind-demo">Tailwind Demo</Link>
            <Link href="/pretext-demo">Pretext Demo</Link>
            <Link href="/commit-stories">Commit Stories</Link>
          </nav>
        </section>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * SpeedShowcase — preserved from original, trimmed intro copy
 * ─────────────────────────────────────────────────────────────────────── */

function SpeedShowcase() {
  const [size, setSize] = useState<SpeedSize>(10000)
  const data = useMemo(() => generateSpeedRows(size), [size])

  const { rowHeights, prefixSums, totalHeight, ready, prepareTimeMs, layoutTimeMs } =
    useTableRowHeights({
      data,
      columns: speedColumns,
      minRowHeight: 36,
      enabled: true,
    })

  const table = useTable({
    data,
    columns: speedColumns,
    getRowId: (row) => String(row.id),
    enableVirtualization: true,
    pretextHeights: ready && rowHeights ? rowHeights : undefined,
    pretextPrefixSums: ready && prefixSums ? prefixSums : undefined,
    rowHeight: 36,
    initialState: { pagination: { pageIndex: 0, pageSize: 100_000 } },
  })

  const cellCount = size * speedColumns.length
  const totalMs = ready ? prepareTimeMs + layoutTimeMs : 0
  const msPerCell = ready && cellCount > 0 ? totalMs / cellCount : 0

  const prepareDisplay = useCountUp(ready ? prepareTimeMs : 0, 700)
  const layoutDisplay = useCountUp(ready ? layoutTimeMs : 0, 700)
  const perCellDisplay = useCountUp(msPerCell, 700)
  const totalHeightDisplay = useCountUp(ready ? totalHeight : 0, 700)

  return (
    <section className={s.speedSection} aria-label="Speed showcase">
      <div className={s.speedHead}>
        <span className={s.sectionEyebrow}>Performance</span>
        <h2 className={s.speedTitle}>Virtualization benchmarks.</h2>
        <p className={s.speedLead}>
          Pretext measures every variable-height row before paint. Pick a size — numbers are live.
        </p>
      </div>

      <div className={s.speedControl} role="radiogroup" aria-label="Dataset size">
        {SPEED_SIZES.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={size === n}
            className={`${s.speedControlBtn} ${size === n ? s.speedControlBtnActive : ''}`}
            onClick={() => setSize(n)}
          >
            {formatSpeedSize(n)} rows
          </button>
        ))}
      </div>

      <div className={s.speedMetrics}>
        <div className={s.speedMetric}>
          <span className={s.speedMetricLabel}>prepare()</span>
          <span className={s.speedMetricNum}>
            {ready ? prepareDisplay.toFixed(1) : '\u2014'}
            <em>ms</em>
          </span>
        </div>
        <div className={s.speedMetric}>
          <span className={s.speedMetricLabel}>layout()</span>
          <span className={s.speedMetricNum}>
            {ready ? layoutDisplay.toFixed(2) : '\u2014'}
            <em>ms</em>
          </span>
        </div>
        <div className={s.speedMetric}>
          <span className={s.speedMetricLabel}>per cell</span>
          <span className={s.speedMetricNum}>
            {ready && msPerCell > 0 ? perCellDisplay.toFixed(4) : '\u2014'}
            <em>ms</em>
          </span>
        </div>
        <div className={s.speedMetric}>
          <span className={s.speedMetricLabel}>total height</span>
          <span className={s.speedMetricNum}>
            {ready ? Math.round(totalHeightDisplay).toLocaleString() : '\u2014'}
            <em>px</em>
          </span>
        </div>
      </div>

      <div className={s.speedPreview}>
        <Table table={table} theme="forest" bordered />
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * Shared comparison cell symbol (●/—/◐/$)
 * ─────────────────────────────────────────────────────────────────────── */

function compareSymbol(cell: CompareCell) {
  switch (cell) {
    case 'yes':
      return <span className={`${s.compareCell} ${s.compareYes}`}>●</span>
    case 'no':
      return <span className={`${s.compareCell} ${s.compareNo}`}>—</span>
    case 'partial':
      return <span className={`${s.compareCell} ${s.comparePartial}`}>◐</span>
    case 'paid':
      return <span className={`${s.compareCell} ${s.comparePaid}`}>$</span>
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * AgGridCompare — flagship "Yable vs AG Grid" two-column section
 * ─────────────────────────────────────────────────────────────────────── */

function AgGridCompare() {
  return (
    <section className={s.agSection} aria-label="Yable versus AG Grid">
      <div className={s.compareHeader}>
        <span className={s.sectionEyebrow}>Yable vs AG Grid</span>
        <h2 className={s.compareTitle}>The Enterprise features, MIT-free.</h2>
        <p className={s.compareSub}>
          Clipboard, Excel-style fills, tree data, and row grouping sit behind AG Grid Enterprise at{' '}
          <strong>$999 / dev / year</strong> &mdash; Yable ships them MIT, alongside premium
          animated column drag-to-reorder. Row grouping and pivots render through{' '}
          <code>&lt;Table&gt;</code>
          with collapsible headers, dynamic columns, and rolled-up aggregates.
        </p>
      </div>

      <div className={s.agContrast}>
        <div className={`${s.agContrastCard} ${s.agContrastCardYable}`}>
          <span className={s.agContrastName}>Yable</span>
          <span className={s.agContrastPrice}>$0</span>
          <span className={s.agContrastMeta}>MIT · {REACT_GZIPPED_SIZE} gzip · 0 deps</span>
        </div>
        <div className={s.agContrastVs} aria-hidden="true">
          vs
        </div>
        <div className={s.agContrastCard}>
          <span className={s.agContrastName}>AG Grid Enterprise</span>
          <span className={`${s.agContrastPrice} ${s.agContrastPricePaid}`}>$999</span>
          <span className={s.agContrastMeta}>per developer / year</span>
        </div>
      </div>

      <div className={s.compareTableWrap}>
        <table className={`${s.compareTable} ${s.agTable}`}>
          <thead>
            <tr>
              <th scope="col" className={s.compareHeadFeature}>
                Capability
              </th>
              <th scope="col" className={s.compareHeadYable}>
                Yable
                <span>MIT · free</span>
              </th>
              <th scope="col">
                AG Grid
                <span>MIT core · $999/dev Enterprise</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {agGridRows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className={s.compareRowLabel}>
                  {row.label}
                </th>
                <td className={s.compareCellYable}>
                  <span className={s.agCellInner}>
                    {compareSymbol(row.yable)}
                    {row.yableNote && <span className={s.agTag}>{row.yableNote}</span>}
                  </span>
                </td>
                <td>
                  <span className={s.agCellInner}>
                    {compareSymbol(row.ag)}
                    {row.agNote && <span className={s.agTag}>{row.agNote}</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={s.compareLegend}>
          <span>
            <span className={`${s.compareCell} ${s.compareYes}`}>●</span> shipping
          </span>
          <span>
            <span className={`${s.compareCell} ${s.comparePartial}`}>◐</span> partial / programmatic
          </span>
          <span>
            <span className={`${s.compareCell} ${s.comparePaid}`}>$</span> paid tier only
          </span>
          <span>
            <span className={`${s.compareCell} ${s.compareNo}`}>—</span> not available
          </span>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * CompareTable — full feature matrix
 * ─────────────────────────────────────────────────────────────────────── */

function CompareTable() {
  return (
    <div className={s.compareTableWrap}>
      <table className={s.compareTable}>
        <thead>
          <tr>
            <th scope="col" className={s.compareHeadFeature}>
              Feature
            </th>
            <th scope="col" className={s.compareHeadYable}>
              Yable
              <span>MIT · free</span>
            </th>
            <th scope="col">
              TanStack Table
              <span>MIT · free</span>
            </th>
            <th scope="col">
              AG Grid Community
              <span>MIT · free</span>
            </th>
            <th scope="col">
              AG Grid Enterprise
              <span>paid tier</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {compareRows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className={s.compareRowLabel}>
                {row.label}
                {row.note && <span className={s.compareNote}>{row.note}</span>}
              </th>
              <td className={s.compareCellYable}>{compareSymbol(row.yable)}</td>
              <td>{compareSymbol(row.tanstack)}</td>
              <td>{compareSymbol(row.agCommunity)}</td>
              <td>{compareSymbol(row.agEnterprise)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={s.compareLegend}>
        <span>
          <span className={`${s.compareCell} ${s.compareYes}`}>●</span> shipping
        </span>
        <span>
          <span className={`${s.compareCell} ${s.comparePartial}`}>◐</span> partial / DIY
        </span>
        <span>
          <span className={`${s.compareCell} ${s.comparePaid}`}>$</span> paid tier only
        </span>
        <span>
          <span className={`${s.compareCell} ${s.compareNo}`}>—</span> not available
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * BasicDemo — preserved
 * ─────────────────────────────────────────────────────────────────────── */

function BasicDemo() {
  const [data] = useState(people)

  const table = useTable({
    data,
    columns: mainColumns,
    getRowId: (row) => String(row.id),
  })

  const selectedCount = Object.keys(table.getState().rowSelection).length

  return (
    <section className={s.demoSection}>
      <div className={s.demoCard}>
        <div className={s.demoHeader}>
          <div className={s.demoTitleGroup}>
            <span className={s.demoEyebrow}>Live Data Surface</span>
            <h3 className={s.demoTitle}>Employee ledger with real interaction density.</h3>
            <p className={s.demoDescription}>
              Search, sort, select, and paginate without leaving the same component tree.
            </p>
          </div>

          <div className={s.demoMetrics}>
            <span className={s.metricPill}>{people.length} rows</span>
            <span className={s.metricPill}>{departments.length} departments</span>
            <span className={s.metricPill}>
              {selectedCount > 0 ? `${selectedCount} selected` : 'Selection ready'}
            </span>
          </div>
        </div>

        <div className={s.searchRow}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>
              <SearchIcon />
            </span>
            <GlobalFilter
              table={table}
              placeholder="Scan names, roles, departments, and salary bands"
            />
          </div>
          <p className={s.searchHint}>Click a header to sort. Shift-click to multi-sort.</p>
        </div>

        <div className={s.tableWrap}>
          <Table table={table} theme="midnight" stickyHeader striped bordered>
            <Pagination table={table} />
          </Table>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * EditableDemo — preserved
 * ─────────────────────────────────────────────────────────────────────── */

function EditableDemo() {
  const [data, setData] = useState(() => people.slice(0, 8))

  const table = useTable({
    data,
    columns: editableColumns,
    getRowId: (row) => String(row.id),
  })

  const pendingChanges = table.getAllPendingChanges()
  const hasPending = table.hasPendingChanges()
  const pendingCount = Object.keys(pendingChanges).length

  const handleSave = () => {
    if (!hasPending) return

    const next = data.map((row) => {
      const changes = pendingChanges[String(row.id)]
      return changes ? { ...row, ...changes } : row
    })

    setData(next)
    table.discardAllPending()
  }

  return (
    <section className={s.demoSection}>
      <div className={s.demoCard}>
        <div className={s.demoHeader}>
          <div className={s.demoTitleGroup}>
            <span className={s.demoEyebrow}>Editing Surface</span>
            <h3 className={s.demoTitle}>Inline editing with buffered commits.</h3>
            <p className={s.demoDescription}>
              Changes stay buffered until commit. Discard or save at any point.
            </p>
          </div>

          <div className={s.demoMetrics}>
            <span className={s.metricPill}>Text</span>
            <span className={s.metricPill}>Select</span>
            <span className={s.metricPill}>Checkbox</span>
            <span className={s.metricPill}>
              {hasPending ? `${pendingCount} pending` : 'No pending edits'}
            </span>
          </div>
        </div>

        <div className={s.tableWrap}>
          <Table table={table} theme="forest" bordered />
        </div>

        <div className={s.editorFooter}>
          <div className={s.pendingBlock}>
            <span className={`${s.pendingDot} ${hasPending ? s.pendingDotActive : ''}`} />
            <span className={s.pendingText}>
              {hasPending
                ? `${pendingCount} row${pendingCount > 1 ? 's' : ''} waiting to be committed`
                : 'Edit any cell to stage a change'}
            </span>
          </div>

          <div className={s.actionRow}>
            <button
              type="button"
              className={s.btnSecondary}
              onClick={() => table.discardAllPending()}
              disabled={!hasPending}
            >
              Discard
            </button>
            <button
              type="button"
              className={s.btnPrimary}
              onClick={handleSave}
              disabled={!hasPending}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * ThemeGallery — flat swatches, no sidebar notes
 * ─────────────────────────────────────────────────────────────────────── */

function ThemeGallery({
  selected,
  onSelect,
}: {
  selected: ThemeId
  onSelect: (theme: ThemeId) => void
}) {
  return (
    <section className={s.demoSection}>
      <div className={s.demoCard}>
        <div className={s.demoHeader}>
          <div className={s.demoTitleGroup}>
            <span className={s.demoEyebrow}>Theme Gallery</span>
            <h3 className={s.demoTitle}>Eight token packs. One table language.</h3>
          </div>

          <div className={s.demoMetrics}>
            <span className={s.metricPill}>
              Selected: {allThemes.find((theme) => theme.id === selected)?.label}
            </span>
            <span className={s.metricPill}>Dark + light ready</span>
          </div>
        </div>

        <div className={s.themeGrid}>
          {allThemes.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isSelected={selected === theme.id}
              onSelect={() => onSelect(theme.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ThemePreviewCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: (typeof allThemes)[number]
  isSelected: boolean
  onSelect: () => void
}) {
  const table = useTable({
    data: themePreviewData,
    columns: miniColumns,
    getRowId: (row) => String(row.id),
  })

  return (
    <div
      className={`${s.themeCard} ${isSelected ? s.themeCardSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      aria-label={`Select ${theme.label} theme`}
      aria-pressed={isSelected}
    >
      <div className={s.themeTableWrap}>
        <Table table={table} theme={theme.id} striped bordered />
      </div>

      <div className={s.themeCardFooter}>
        <div className={s.themeNameRow}>
          <span className={s.themeAccentDot} style={{ backgroundColor: theme.accent }} />
          <span className={s.themeName}>{theme.label}</span>
        </div>

        <span className={`${s.themeCheck} ${isSelected ? s.themeCheckVisible : ''}`}>
          <CheckIcon />
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * Utility classname helpers — preserved
 * ─────────────────────────────────────────────────────────────────────── */

function getDepartmentClassName(value: string) {
  if (value === 'Engineering') {
    return `${s.departmentPill} ${s.departmentEngineering}`
  }

  if (value === 'Design') {
    return `${s.departmentPill} ${s.departmentDesign}`
  }

  return `${s.departmentPill} ${s.departmentProduct}`
}

function getCategoryClassName(value: string) {
  if (value === 'Engineering') {
    return `${s.departmentPill} ${s.departmentEngineering}`
  }

  if (value === 'Design') {
    return `${s.departmentPill} ${s.departmentDesign}`
  }

  return `${s.departmentPill} ${s.departmentProduct}`
}
