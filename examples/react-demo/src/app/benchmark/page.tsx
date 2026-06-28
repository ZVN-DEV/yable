'use client'

// Yable scale benchmark — proves the grid stays responsive at 100k+ rows.
// Row virtualization keeps the DOM tiny (~visible rows) while sort/scroll stay
// fast. All timings are measured live in the browser with performance.now().

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'
import s from './benchmark.module.css'

interface Row {
  id: number
  name: string
  email: string
  department: string
  role: string
  salary: number
  age: number
  startDate: string
  rating: number
  active: boolean
}

const FIRST = [
  'Alice',
  'Bob',
  'Carol',
  'David',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
  'Kate',
  'Liam',
  'Mia',
  'Noah',
  'Olivia',
  'Pete',
  'Quinn',
  'Rachel',
  'Sam',
  'Tina',
]
const LAST = [
  'Johnson',
  'Smith',
  'Williams',
  'Brown',
  'Davis',
  'Miller',
  'Wilson',
  'Moore',
  'Taylor',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Garcia',
]
const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Finance']
const ROLES = ['Intern', 'Junior', 'Engineer', 'Senior', 'Staff', 'Principal', 'Lead', 'Manager']

function generateData(count: number): Row[] {
  const rows = new Array<Row>(count)
  for (let i = 0; i < count; i++) {
    const first = FIRST[i % FIRST.length]
    const last = LAST[(i * 7) % LAST.length]
    rows[i] = {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      role: ROLES[(i * 3) % ROLES.length],
      salary: 55000 + ((i * 13007) % 165000),
      age: 22 + ((i * 7) % 40),
      startDate: `${2015 + (i % 10)}-${String(1 + ((i * 3) % 12)).padStart(2, '0')}-${String(1 + ((i * 7) % 28)).padStart(2, '0')}`,
      rating: 1 + ((i * 3) % 5),
      active: i % 4 !== 0,
    }
  }
  return rows
}

const ROW_COUNTS = [10_000, 100_000, 500_000]
const ROW_HEIGHT = 44

const columnHelper = createColumnHelper<Row>()
const columns = [
  columnHelper.accessor('id', { header: '#', size: 80, enableSorting: true }),
  columnHelper.accessor('name', { header: 'Name', size: 170, enableSorting: true }),
  columnHelper.accessor('email', { header: 'Email', size: 240, enableSorting: true }),
  columnHelper.accessor('department', { header: 'Department', size: 140, enableSorting: true }),
  columnHelper.accessor('role', { header: 'Role', size: 130, enableSorting: true }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    size: 120,
    enableSorting: true,
    cell: (info) => `$${(info.getValue() as number).toLocaleString()}`,
  }),
  columnHelper.accessor('age', { header: 'Age', size: 80, enableSorting: true }),
  columnHelper.accessor('startDate', { header: 'Start date', size: 130, enableSorting: true }),
  columnHelper.accessor('rating', { header: 'Rating', size: 90, enableSorting: true }),
  columnHelper.accessor('active', {
    header: 'Active',
    size: 90,
    cell: (info) => (info.getValue() ? '✓' : '—'),
  }),
]

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={s.stat}>
      <span className={s.statValue}>{value}</span>
      <span className={s.statLabel}>{label}</span>
      {hint ? <span className={s.statHint}>{hint}</span> : null}
    </div>
  )
}

export default function BenchmarkPage() {
  const [rowCount, setRowCount] = useState(100_000)
  const [genMs, setGenMs] = useState(0)
  const [domRows, setDomRows] = useState(0)
  const [lastSortMs, setLastSortMs] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => {
    const t0 = performance.now()
    const d = generateData(rowCount)
    // Defer the state write out of render.
    queueMicrotask(() => setGenMs(performance.now() - t0))
    return d
  }, [rowCount])

  const table = useTable<Row>({
    data,
    columns,
    getRowId: (row) => String(row.id),
    enableVirtualization: true,
    rowHeight: ROW_HEIGHT,
    overscan: 6,
  })

  // Yable paginates to 10 rows by default. Turn that off so the virtualizer
  // handles the entire dataset — otherwise only the first page is rendered and
  // there is nothing to scroll.
  useEffect(() => {
    table.setPageSize(rowCount)
    table.setPageIndex(0)
  }, [table, rowCount])

  // Count the body rows actually present in the DOM — proof that virtualization
  // windows the dataset instead of mounting every row.
  const measureDomRows = useCallback(() => {
    const n = wrapRef.current?.querySelectorAll('[data-column-index="0"]').length ?? 0
    setDomRows(n)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(measureDomRows)
    const scroller = wrapRef.current?.querySelector('.yable-virtual-scroll-container')
    scroller?.addEventListener('scroll', measureDomRows, { passive: true })
    return () => {
      cancelAnimationFrame(id)
      scroller?.removeEventListener('scroll', measureDomRows)
    }
  }, [measureDomRows, rowCount])

  const sortBy = useCallback(
    (columnId: string) => {
      const t0 = performance.now()
      const current = table.getState().sorting[0]
      const desc = current?.id === columnId ? !current.desc : false
      table.setSorting([{ id: columnId, desc }])
      requestAnimationFrame(() => {
        setLastSortMs(performance.now() - t0)
        measureDomRows()
      })
    },
    [table, measureDomRows],
  )

  return (
    <main className={s.page}>
      <header className={s.header}>
        <span className={s.eyebrow}>Scale benchmark</span>
        <h1 className={s.title}>
          {rowCount.toLocaleString()} rows. <span className={s.accent}>Virtualized.</span>
        </h1>
        <p className={s.subtitle}>
          The whole dataset lives in state; only the visible window is mounted to the DOM. Sort,
          scroll, and resize stay smooth at a scale that would freeze a naïvely-rendered table.
          Every number below is measured live in your browser.
        </p>
      </header>

      <div className={s.controls}>
        <div className={s.segment}>
          {ROW_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              className={count === rowCount ? `${s.segmentBtn} ${s.segmentActive}` : s.segmentBtn}
              onClick={() => {
                setLastSortMs(null)
                setRowCount(count)
              }}
            >
              {count.toLocaleString()}
            </button>
          ))}
        </div>
        <div className={s.sortGroup}>
          <span className={s.sortLabel}>Sort {rowCount.toLocaleString()} rows:</span>
          <button type="button" className={s.ghostBtn} onClick={() => sortBy('salary')}>
            by Salary
          </button>
          <button type="button" className={s.ghostBtn} onClick={() => sortBy('name')}>
            by Name
          </button>
          <button type="button" className={s.ghostBtn} onClick={() => sortBy('age')}>
            by Age
          </button>
        </div>
      </div>

      <div className={s.stats}>
        <Stat label="Total rows" value={rowCount.toLocaleString()} hint="held in memory" />
        <Stat
          label="Rows in the DOM"
          value={domRows ? domRows.toString() : '—'}
          hint={`of ${rowCount.toLocaleString()} — windowed`}
        />
        <Stat label="Data generated" value={`${genMs.toFixed(1)} ms`} hint="client-side" />
        <Stat
          label="Last sort"
          value={lastSortMs == null ? '—' : `${lastSortMs.toFixed(1)} ms`}
          hint="compute + re-render"
        />
      </div>

      <div className={s.tableWrap} ref={wrapRef}>
        <Table table={table} striped stickyHeader compact ariaLabel="Benchmark data table" />
      </div>

      <p className={s.footnote}>
        DOM row count stays roughly constant as you scroll or change the dataset size — that is
        virtualization doing its job. Header clicks and the sort buttons above re-sort the full
        dataset, not just the visible window.
      </p>
    </main>
  )
}
