'use client'

import { useState, useMemo } from 'react'
import {
  useTable,
  Table,
  Pagination,
  GlobalFilter,
  CellInput,
  CellSelect,
  CellCheckbox,
  createColumnHelper,
  type ColumnDef,
  type TableInstance,
} from '@yable/react'
import { people, departments, type Person } from '@/data'
import s from './page.module.css'

// ─── Column Definitions ────────────────────────────────────────────────────

const columnHelper = createColumnHelper<Person>()

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
    cell: (info: any) => (
      <span style={{ color: '#60a5fa' }}>{info.getValue()}</span>
    ),
    size: 220,
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: (info: any) => info.getValue(),
    size: 70,
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    cell: (info: any) => {
      const val = info.getValue() as string
      const colors: Record<string, { bg: string; text: string }> = {
        Engineering: { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa' },
        Design: { bg: 'rgba(168,85,247,0.1)', text: '#c084fc' },
        Product: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24' },
      }
      const c = colors[val] || { bg: 'rgba(255,255,255,0.05)', text: '#a1a1aa' }
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: c.bg,
            color: c.text,
          }}
        >
          {val}
        </span>
      )
    },
    size: 140,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: (info: any) => info.getValue(),
    size: 200,
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    cell: (info: any) => {
      const v = info.getValue() as number
      return (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          ${v.toLocaleString()}
        </span>
      )
    },
    size: 120,
  }),
  columnHelper.accessor('startDate', {
    header: 'Start Date',
    cell: (info: any) => {
      const d = info.getValue() as string
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    },
    size: 130,
  }),
  columnHelper.accessor('active', {
    header: 'Status',
    cell: (info: any) => {
      const active = info.getValue() as boolean
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className={`${s.statusDot} ${active ? s.statusActive : s.statusInactive}`}
          />
          <span style={{ fontSize: 12, color: active ? '#4ade80' : '#f87171' }}>
            {active ? 'Active' : 'Inactive'}
          </span>
        </span>
      )
    },
    size: 100,
  }),
]

// Editable form columns
const editableColumns: ColumnDef<Person, any>[] = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} />,
    meta: { alwaysEditable: true },
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} />,
    meta: { alwaysEditable: true },
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    editable: true,
    editConfig: { type: 'text' },
    cell: (info: any) => <CellInput context={info} type="email" />,
    meta: { alwaysEditable: true },
    size: 240,
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    editable: true,
    editConfig: {
      type: 'select',
      options: departments.map((d) => ({ label: d, value: d })),
    },
    cell: (info: any) => (
      <CellSelect
        context={info}
        options={departments.map((d) => ({ label: d, value: d }))}
      />
    ),
    meta: { alwaysEditable: true },
    size: 160,
  }),
  columnHelper.accessor('salary', {
    header: 'Salary',
    editable: true,
    editConfig: { type: 'number' },
    cell: (info: any) => <CellInput context={info} type="number" />,
    meta: { alwaysEditable: true },
    size: 130,
  }),
  columnHelper.accessor('active', {
    header: 'Active',
    editable: true,
    editConfig: { type: 'checkbox' },
    cell: (info: any) => <CellCheckbox context={info} />,
    meta: { alwaysEditable: true },
    size: 80,
  }),
]

// Mini columns for theme gallery preview
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
    cell: (info: any) => `$${(info.getValue() as number).toLocaleString()}`,
    size: 90,
  }),
]

// ─── Theme Metadata ────────────────────────────────────────────────────────

const allThemes = [
  { id: 'midnight', label: 'Midnight', accent: '#388bfd' },
  { id: 'default', label: 'Default', accent: '#3b82f6' },
  { id: 'stripe', label: 'Stripe', accent: '#635bff' },
  { id: 'compact', label: 'Compact', accent: '#10b981' },
  { id: 'ocean', label: 'Ocean', accent: '#0891b2' },
  { id: 'forest', label: 'Forest', accent: '#16a34a' },
  { id: 'rose', label: 'Rose', accent: '#f43f5e' },
  { id: 'mono', label: 'Mono', accent: '#71717a' },
] as const

type ThemeId = (typeof allThemes)[number]['id']
type DemoTab = 'data' | 'editable' | 'themes'

// ─── SVG Icons (inline, no deps) ──────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.3 3.9a5 5 0 1 1 .7-.7l3.1 3.1-.7.7-3.1-3.1Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [tab, setTab] = useState<DemoTab>('data')
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('midnight')

  return (
    <div className={s.page}>
      <div className={s.inner}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className={s.header}>
          <div className={s.logoRow}>
            <div className={s.logoIcon}>Y</div>
            <h1 className={s.title}>
              Yable<span className={s.titleAccent}>Tables</span>
            </h1>
          </div>
          <p className={s.subtitle}>
            A complete data table library for React. Fast, themeable, accessible.
          </p>
          <div className={s.badges}>
            <span className={s.badge}>
              <span className={s.badgeDot} /> Sorting
            </span>
            <span className={s.badge}>
              <span className={s.badgeDot} style={{ background: '#8b5cf6' }} />{' '}
              Filtering
            </span>
            <span className={s.badge}>
              <span className={s.badgeDot} style={{ background: '#22c55e' }} />{' '}
              Editing
            </span>
            <span className={s.badge}>
              <span className={s.badgeDot} style={{ background: '#f59e0b' }} />{' '}
              8 Themes
            </span>
            <span className={s.badge}>
              <span className={s.badgeDot} style={{ background: '#ec4899' }} />{' '}
              Pagination
            </span>
            <span className={s.badge}>
              <span className={s.badgeDot} style={{ background: '#06b6d4' }} />{' '}
              Selection
            </span>
          </div>
        </header>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <nav className={s.tabBar}>
          {(
            [
              ['data', 'Data Table'],
              ['editable', 'Editable Table'],
              ['themes', 'Theme Gallery'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={`${s.tabButton} ${tab === key ? s.tabButtonActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ── Demos ──────────────────────────────────────────────────── */}
        {tab === 'data' && <BasicDemo />}
        {tab === 'editable' && <EditableDemo />}
        {tab === 'themes' && (
          <ThemeGallery selected={selectedTheme} onSelect={setSelectedTheme} />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Basic Data Table
// ═══════════════════════════════════════════════════════════════════════════

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
      <div className={s.card}>
        <div className={s.cardHeader}>
          <div className={s.cardTitleGroup}>
            <h2 className={s.cardTitle}>Employee Directory</h2>
            <p className={s.cardDescription}>
              20 records &middot; Click column headers to sort &middot;{' '}
              {selectedCount > 0 && (
                <span style={{ color: '#60a5fa' }}>
                  {selectedCount} selected
                </span>
              )}
            </p>
          </div>
          <div className={s.cardActions}>
            <div className={s.featureTags}>
              <span className={s.featureTag}>Sorting</span>
              <span className={`${s.featureTag} ${s.featureTagPurple}`}>
                Filtering
              </span>
              <span className={`${s.featureTag} ${s.featureTagGreen}`}>
                Selection
              </span>
              <span className={`${s.featureTag} ${s.featureTagAmber}`}>
                Pagination
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div className={s.searchWrap} style={{ flex: 1, maxWidth: 320 }}>
            <span className={s.searchIcon}>
              <SearchIcon />
            </span>
            <GlobalFilter table={table} placeholder="Search employees..." />
          </div>
        </div>

        <div className={s.tableWrap}>
          <Table table={table} theme="midnight" stickyHeader striped>
            <Pagination table={table} />
          </Table>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Editable Table
// ═══════════════════════════════════════════════════════════════════════════

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

  const handleDiscard = () => {
    table.discardAllPending()
  }

  return (
    <section className={s.demoSection}>
      <div className={s.card}>
        <div className={s.cardHeader}>
          <div className={s.cardTitleGroup}>
            <h2 className={s.cardTitle}>
              Inline Editing
              {hasPending && (
                <>
                  <span className={s.unsavedDot} />
                  <span className={s.unsavedLabel}>
                    {pendingCount} row{pendingCount > 1 ? 's' : ''} modified
                  </span>
                </>
              )}
            </h2>
            <p className={s.cardDescription}>
              Edit cells directly. Text inputs, selects, and checkboxes built in.
            </p>
          </div>
          <div className={s.cardActions}>
            <div className={s.featureTags}>
              <span className={s.featureTag}>Text Input</span>
              <span className={`${s.featureTag} ${s.featureTagPurple}`}>
                Select
              </span>
              <span className={`${s.featureTag} ${s.featureTagGreen}`}>
                Checkbox
              </span>
            </div>
          </div>
        </div>

        <div className={s.tableWrap}>
          <Table table={table} theme="midnight" bordered />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 16,
          }}
        >
          <button
            className={s.btnSecondary}
            onClick={handleDiscard}
            disabled={!hasPending}
          >
            Discard
          </button>
          <button
            className={s.btnPrimary}
            onClick={handleSave}
            disabled={!hasPending}
          >
            Save Changes
          </button>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Theme Gallery
// ═══════════════════════════════════════════════════════════════════════════

function ThemeGallery({
  selected,
  onSelect,
}: {
  selected: ThemeId
  onSelect: (t: ThemeId) => void
}) {
  return (
    <section className={s.demoSection}>
      {/* Gallery header */}
      <div className={s.card} style={{ marginBottom: 20 }}>
        <div className={s.cardHeader} style={{ marginBottom: 0 }}>
          <div className={s.cardTitleGroup}>
            <h2 className={s.cardTitle}>Theme Gallery</h2>
            <p className={s.cardDescription}>
              8 built-in themes. Click any card to preview. Each theme supports
              light and dark modes.
            </p>
          </div>
          <div className={s.featureTags}>
            <span className={s.featureTag}>8 Themes</span>
            <span className={`${s.featureTag} ${s.featureTagPurple}`}>
              Dark Mode
            </span>
            <span className={`${s.featureTag} ${s.featureTagGreen}`}>
              CSS Variables
            </span>
          </div>
        </div>
      </div>

      {/* Grid of mini-table previews */}
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
  const previewData = useMemo(() => people.slice(0, 5), [])

  const table = useTable({
    data: previewData,
    columns: miniColumns,
    getRowId: (row) => String(row.id),
  })

  return (
    <div
      className={`${s.themeCard} ${isSelected ? s.themeCardSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-label={`Select ${theme.label} theme`}
      aria-pressed={isSelected}
    >
      <div className={s.themeTableWrap}>
        <Table table={table} theme={theme.id} striped />
      </div>
      <div className={s.themeCardFooter}>
        <div className={s.themeNameRow}>
          <span
            className={s.themeAccentDot}
            style={{ background: theme.accent }}
          />
          <span className={s.themeName}>{theme.label}</span>
        </div>
        <span
          className={`${s.themeCheck} ${isSelected ? s.themeCheckVisible : ''}`}
        >
          <CheckIcon />
        </span>
      </div>
    </div>
  )
}
