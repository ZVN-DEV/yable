'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  useTable,
  Table,
  Pagination,
  GlobalFilter,
  CellInput,
  CellSelect,
  CellCheckbox,
  CellLink,
  createColumnHelper,
  type ColumnDef,
  type TableInstance,
} from '@yable/react'
import s from './playground.module.css'

/* ── Data ────────────────────────────────────────────────────────────────── */

interface Employee {
  id: number
  name: string
  email: string
  age: number
  role: string
  department: string
  salary: number
  startDate: string
  active: boolean
  rating: number
  completion: number
}

const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales']
const roles = [
  'Intern', 'Junior Engineer', 'Engineer', 'Senior Engineer', 'Staff Engineer',
  'Designer', 'Senior Designer', 'Product Manager', 'Marketing Lead', 'Sales Rep',
]

function generateData(count: number): Employee[] {
  const firstNames = [
    'Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
    'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Pete', 'Quinn', 'Rachel', 'Sam', 'Tina',
    'Uma', 'Victor', 'Wendy', 'Xander', 'Yara', 'Zoe', 'Adrian', 'Beth', 'Carlos', 'Dana',
  ]
  const lastNames = [
    'Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
    'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Garcia', 'Robinson',
    'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott',
  ]

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    const dept = departments[i % departments.length]
    return {
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      age: 22 + (i * 7) % 30,
      role: roles[i % roles.length],
      department: dept,
      salary: 55000 + (i * 13000) % 160000,
      startDate: `${2018 + (i % 7)}-${String(1 + (i * 3) % 12).padStart(2, '0')}-${String(1 + (i * 7) % 28).padStart(2, '0')}`,
      active: i % 5 !== 0,
      rating: 1 + (i * 3) % 5,
      completion: Math.min(100, (i * 17 + 15) % 110),
    }
  })
}

const DATASETS: Record<string, number> = {
  '10 rows': 10,
  '50 rows': 50,
  '200 rows': 200,
  '1,000 rows': 1000,
  '5,000 rows': 5000,
}

/* ── Themes ──────────────────────────────────────────────────────────────── */

const THEMES = [
  { id: 'default', label: 'Default', color: '#2563eb' },
  { id: 'midnight', label: 'Midnight', color: '#388bfd' },
  { id: 'stripe', label: 'Stripe', color: '#635bff' },
  { id: 'compact', label: 'Compact', color: '#10b981' },
  { id: 'ocean', label: 'Ocean', color: '#06b6d4' },
  { id: 'forest', label: 'Forest', color: '#5a8a4a' },
  { id: 'rose', label: 'Rose', color: '#e11d48' },
  { id: 'mono', label: 'Mono', color: '#737373' },
] as const

type ThemeId = (typeof THEMES)[number]['id']

/* ── Column Definitions ──────────────────────────────────────────────────── */

const columnHelper = createColumnHelper<Employee>()

function buildColumns(editable: boolean, showSelection: boolean): ColumnDef<Employee, any>[] {
  const cols: ColumnDef<Employee, any>[] = []

  if (showSelection) {
    cols.push(
      columnHelper.display({
        id: 'select',
        header: ({ table }: { table: TableInstance<Employee> }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={() => table.toggleAllRowsSelected()}
            aria-label="Select all"
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
        size: 44,
      })
    )
  }

  cols.push(
    columnHelper.accessor('name', {
      header: 'Name',
      cell: editable
        ? (info: any) => <CellInput context={info} />
        : (info: any) => <span className={s.cellName}>{info.getValue()}</span>,
      editable,
      editConfig: editable ? { type: 'text' } : undefined,
      meta: editable ? { alwaysEditable: true } : undefined,
      size: 180,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info: any) => <CellLink context={info} href={(v) => `mailto:${v}`} />,
      size: 240,
    }),
    columnHelper.accessor('age', {
      header: 'Age',
      cellType: 'numeric',
      size: 70,
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      cell: editable
        ? (info: any) => (
            <CellSelect
              context={info}
              options={departments.map((d) => ({ label: d, value: d }))}
            />
          )
        : undefined,
      cellType: 'badge',
      cellTypeProps: { variant: 'accent', appearance: 'soft' },
      editable,
      editConfig: editable
        ? { type: 'select', options: departments.map((d) => ({ label: d, value: d })) }
        : undefined,
      meta: editable ? { alwaysEditable: true } : undefined,
      size: 150,
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      size: 170,
    }),
    columnHelper.accessor('salary', {
      header: 'Salary',
      cellType: 'currency',
      size: 120,
    }),
    columnHelper.accessor('startDate', {
      header: 'Start Date',
      cellType: 'date',
      cellTypeProps: { format: 'medium' },
      size: 130,
    }),
    columnHelper.accessor('active', {
      header: 'Active',
      cell: editable
        ? (info: any) => <CellCheckbox context={info} />
        : undefined,
      cellType: 'boolean',
      cellTypeProps: { mode: 'dot' },
      editable,
      editConfig: editable ? { type: 'checkbox' } : undefined,
      meta: editable ? { alwaysEditable: true } : undefined,
      size: 100,
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cellType: 'rating',
      size: 90,
    }),
    columnHelper.accessor('completion', {
      header: 'Progress',
      cellType: 'progress',
      cellTypeProps: { variant: 'accent' },
      size: 130,
    })
  )

  return cols
}

/* ── Playground Page ─────────────────────────────────────────────────────── */

export default function PlaygroundPage() {
  // Theme
  const [theme, setTheme] = useState<ThemeId>('midnight')
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark')

  // Table props
  const [striped, setStriped] = useState(true)
  const [bordered, setBordered] = useState(true)
  const [compact, setCompact] = useState(false)
  const [stickyHeader, setStickyHeader] = useState(true)
  const [showFooter, setShowFooter] = useState(false)
  const [showPagination, setShowPagination] = useState(true)
  const [showSearch, setShowSearch] = useState(true)
  const [showSelection, setShowSelection] = useState(true)
  const [editMode, setEditMode] = useState(false)

  // Data
  const [dataSize, setDataSize] = useState<string>('50 rows')
  const data = useMemo(() => generateData(DATASETS[dataSize]), [dataSize])

  // Columns (rebuild when edit or selection toggles change)
  const columns = useMemo(
    () => buildColumns(editMode, showSelection),
    [editMode, showSelection]
  )

  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
  })

  // Sync color scheme to <html> so CSS theme selectors work correctly
  // (only one ancestor data-yable-theme should exist at a time)
  useEffect(() => {
    document.documentElement.setAttribute('data-yable-theme', colorScheme)
  }, [colorScheme])

  // Toggle pagination: show all rows when pagination is off
  useEffect(() => {
    if (!showPagination) {
      table.setPageSize(data.length)
      table.setPageIndex(0)
    } else {
      table.setPageSize(10)
      table.setPageIndex(0)
    }
  }, [showPagination, data.length, table])

  const selectedCount = Object.keys(table.getState().rowSelection).length
  const pendingChanges = table.getAllPendingChanges()
  const hasPending = table.hasPendingChanges()
  const pendingCount = Object.keys(pendingChanges).length

  const handleSave = useCallback(() => {
    if (!hasPending) return
    table.discardAllPending()
  }, [hasPending, table])

  return (
    <div className={s.playground}>
      {/* ── Control Panel ──────────────────────────────────────────────── */}
      <aside className={s.panel}>
        <div className={s.panelHeader}>
          <h1 className={s.panelTitle}>Yable Playground</h1>
          <p className={s.panelSub}>Interactive table workbench</p>
        </div>

        {/* Theme Selector */}
        <Section title="Theme">
          <div className={s.themeGrid}>
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`${s.themeSwatch} ${theme === t.id ? s.themeSwatchActive : ''}`}
                onClick={() => setTheme(t.id)}
                title={t.label}
                type="button"
              >
                <span className={s.swatchDot} style={{ backgroundColor: t.color }} />
                <span className={s.swatchLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Color Scheme */}
        <Section title="Color Scheme">
          <div className={s.toggleRow}>
            <ToggleButton
              active={colorScheme === 'dark'}
              onClick={() => setColorScheme('dark')}
              label="Dark"
            />
            <ToggleButton
              active={colorScheme === 'light'}
              onClick={() => setColorScheme('light')}
              label="Light"
            />
          </div>
        </Section>

        {/* Table Props */}
        <Section title="Table Props">
          <Switch label="Striped" checked={striped} onChange={setStriped} />
          <Switch label="Bordered" checked={bordered} onChange={setBordered} />
          <Switch label="Compact" checked={compact} onChange={setCompact} />
          <Switch label="Sticky Header" checked={stickyHeader} onChange={setStickyHeader} />
          <Switch label="Footer" checked={showFooter} onChange={setShowFooter} />
        </Section>

        {/* Features */}
        <Section title="Features">
          <Switch label="Search / Filter" checked={showSearch} onChange={setShowSearch} />
          <Switch label="Pagination" checked={showPagination} onChange={setShowPagination} />
          <Switch label="Row Selection" checked={showSelection} onChange={setShowSelection} />
          <Switch label="Inline Editing" checked={editMode} onChange={setEditMode} />
        </Section>

        {/* Dataset */}
        <Section title="Dataset">
          <div className={s.datasetGrid}>
            {Object.keys(DATASETS).map((key) => (
              <button
                key={key}
                type="button"
                className={`${s.datasetBtn} ${dataSize === key ? s.datasetBtnActive : ''}`}
                onClick={() => setDataSize(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </Section>

        {/* Live Stats */}
        <Section title="Live Stats">
          <div className={s.statGrid}>
            <Stat label="Rows" value={String(data.length)} />
            <Stat label="Columns" value={String(table.getVisibleLeafColumns().length)} />
            <Stat label="Selected" value={String(selectedCount)} />
            <Stat label="Page" value={`${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`} />
            {editMode && (
              <Stat label="Pending" value={String(pendingCount)} accent />
            )}
          </div>
        </Section>

        <div className={s.panelFooter}>
          <span className={s.footerBrand}>@yable/react</span>
          <span className={s.footerVersion}>v0.1.0</span>
        </div>
      </aside>

      {/* ── Table Area ─────────────────────────────────────────────────── */}
      <main className={s.stage}>
        <div className={s.stageHeader}>
          <div className={s.stageInfo}>
            <span className={s.stageThemeLabel}>{THEMES.find((t) => t.id === theme)?.label} Theme</span>
            <span className={s.stagePropList}>
              {[
                striped && 'striped',
                bordered && 'bordered',
                compact && 'compact',
                stickyHeader && 'stickyHeader',
                editMode && 'editable',
              ]
                .filter(Boolean)
                .join(' + ') || 'default'}
            </span>
          </div>

          {editMode && hasPending && (
            <div className={s.editActions}>
              <button
                type="button"
                className={s.btnDiscard}
                onClick={() => table.discardAllPending()}
              >
                Discard
              </button>
              <button
                type="button"
                className={s.btnSave}
                onClick={handleSave}
              >
                Save ({pendingCount})
              </button>
            </div>
          )}
        </div>

        {showSearch && (
          <div className={s.searchBar}>
            <svg className={s.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M10.8 10.8a4.8 4.8 0 1 1 .8-.8l3.2 3.2-.8.8-3.2-3.2Z" fill="currentColor" />
            </svg>
            <GlobalFilter
              table={table}
              placeholder="Search across all columns..."
            />
          </div>
        )}

        <div className={s.tableContainer}>
          <Table
            table={table}
            theme={theme}
            striped={striped}
            bordered={bordered}
            compact={compact}
            stickyHeader={stickyHeader}
            footer={showFooter}
          >
            {showPagination && <Pagination table={table} />}
          </Table>
        </div>
      </main>
    </div>
  )
}

/* ── UI Primitives ───────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={s.section}>
      <h2 className={s.sectionTitle}>{title}</h2>
      {children}
    </div>
  )
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className={s.switchRow}>
      <span className={s.switchLabel}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${s.switchTrack} ${checked ? s.switchTrackOn : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={s.switchThumb} />
      </button>
    </label>
  )
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      className={`${s.toggleBtn} ${active ? s.toggleBtnActive : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={s.statCard}>
      <span className={s.statLabel}>{label}</span>
      <span className={`${s.statValue} ${accent ? s.statAccent : ''}`}>{value}</span>
    </div>
  )
}
