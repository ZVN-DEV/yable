'use client'

import { useState } from 'react'
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
} from '@zvndev/yable-react'
import { people, departments, type Person } from '@/data'
import s from './page.module.css'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const shortCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const columnHelper = createColumnHelper<Person>()

const totalSalary = people.reduce((sum, person) => sum + person.salary, 0)
const activeCount = people.filter((person) => person.active).length
const averageSalary = Math.round(totalSalary / people.length)
const averageAge = Math.round(
  people.reduce((sum, person) => sum + person.age, 0) / people.length
)

const heroPreviewData = people.slice(0, 4)
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

type NotePanel = {
  eyebrow: string
  title: string
  description: string
  points: string[]
}

const packageLayers = [
  {
    name: '@zvndev/yable-core',
    label: 'Headless Engine',
    copy: 'Sorting, filtering, formulas, pivot tables, clipboard, tree data.',
  },
  {
    name: '@zvndev/yable-react',
    label: 'React Surface',
    copy: 'Table primitives, hooks, editors, pagination, and batteries included.',
  },
  {
    name: '@zvndev/yable-vanilla',
    label: 'DOM Renderer',
    copy: 'Plain-JS rendering for teams that need the engine without React.',
  },
  {
    name: '@zvndev/yable-themes',
    label: 'Token Packs',
    copy: 'Eight built-in visual systems with light and dark support.',
  },
] as const

const fieldNotes: Record<DemoTab, NotePanel> = {
  data: {
    eyebrow: 'Showcase One',
    title: 'A sortable employee ledger, not a hollow mock.',
    description:
      'Global search, sticky headers, selection, and pagination are all running in the same live surface.',
    points: [
      'Type in the search bar to filter the dataset instantly.',
      'Click any column header to sort and shift-click for multi-sort.',
      'Row selection and pagination stay in sync instead of fighting each other.',
    ],
  },
  editable: {
    eyebrow: 'Showcase Two',
    title: 'Inline editing that keeps state honest.',
    description:
      'Pending changes are buffered until save, so the interaction feels safe instead of twitchy.',
    points: [
      'Text, number, select, and checkbox editors are wired into the same model.',
      'Unsaved changes are visible at a glance before they touch the dataset.',
      'Discard and save actions prove the UI can do more than render pretty cells.',
    ],
  },
  themes: {
    eyebrow: 'Showcase Three',
    title: 'Themes are a system, not a screenshot.',
    description:
      'Each preview card is a live table instance, which makes the gallery useful for real design decisions.',
    points: [
      'Every theme rides on CSS custom properties instead of copy-paste overrides.',
      'Light and dark modes come from the token layer, not duplicated markup.',
      'The gallery lets design work happen next to implementation, not after it.',
    ],
  },
}

const themeNotes: Record<ThemeId, NotePanel> = {
  midnight: {
    eyebrow: 'Selected Theme',
    title: 'Midnight leans high-contrast and cinematic.',
    description:
      'A dense dark palette for dashboards and ops views where focus matters more than softness.',
    points: [
      'Best when you want the table to feel like control software.',
      'High-visibility accents keep sorting and status states easy to track.',
      'Pairs naturally with the darker editorial shell in this demo.',
    ],
  },
  default: {
    eyebrow: 'Selected Theme',
    title: 'Default is calm, bright, and broadly reusable.',
    description:
      'The cleanest entry point when the table needs to blend into an existing product surface.',
    points: [
      'Useful for admin tools that want familiarity over drama.',
      'Neutral tokens leave room for product-brand accents elsewhere.',
      'A good baseline when teams plan to customize from scratch.',
    ],
  },
  stripe: {
    eyebrow: 'Selected Theme',
    title: 'Stripe pushes a sharper product-polish tone.',
    description:
      'Cool accents and crisp spacing make it feel a touch more SaaS-native without getting bland.',
    points: [
      'Strong fit for billing tools, finance surfaces, and growth dashboards.',
      'Keeps density high while still reading polished and modern.',
      'Useful when you want a premium look without custom theme work.',
    ],
  },
  compact: {
    eyebrow: 'Selected Theme',
    title: 'Compact is built for information density.',
    description:
      'The tightest layout in the pack, intended for teams that care about rows-per-screen.',
    points: [
      'Great for operational views with wide datasets and minimal chrome.',
      'Reduces padding without making the table feel crushed.',
      'Ideal when speed of scanning matters more than decorative space.',
    ],
  },
  ocean: {
    eyebrow: 'Selected Theme',
    title: 'Ocean cools the surface without going sterile.',
    description:
      'Aquatic accents give the table a productized calm that still feels distinctive.',
    points: [
      'A solid choice for analytics views or data-heavy documentation.',
      'Blue-green tokens communicate state changes cleanly.',
      'Feels lighter than Midnight while keeping visual authority.',
    ],
  },
  forest: {
    eyebrow: 'Selected Theme',
    title: 'Forest brings warmth and restraint together.',
    description:
      'Muted greens work well for operational software that wants maturity rather than neon.',
    points: [
      'Strong match for the editorial brass-and-ink framing on this page.',
      'Status colors feel natural without overwhelming the table body.',
      'A good default when teams want character without risk.',
    ],
  },
  rose: {
    eyebrow: 'Selected Theme',
    title: 'Rose softens the interface without losing clarity.',
    description:
      'A warmer tone that proves table tooling does not need to feel industrial to stay useful.',
    points: [
      'Great for CRM, people tools, and internal apps with a gentler brand voice.',
      'Gives edit states and affordances a softer feel than blue-first palettes.',
      'Distinctive enough to make previews feel intentionally designed.',
    ],
  },
  mono: {
    eyebrow: 'Selected Theme',
    title: 'Mono strips the surface down to pure hierarchy.',
    description:
      'A monochrome system for teams that want the typography and spacing to do the work.',
    points: [
      'Excellent for editorial products and serious back-office tools.',
      'Lets badges and data states carry meaning without a colorful frame.',
      'Works especially well when you want the content to feel archival.',
    ],
  },
}

const heroSignals = [
  {
    label: 'Features Audited',
    value: '143 / 222',
    detail: 'Credible parity tracking against AG Grid.',
  },
  {
    label: 'Themes Included',
    value: String(allThemes.length).padStart(2, '0'),
    detail: 'Tokenized palettes with light and dark support.',
  },
  {
    label: 'Average Salary',
    value: shortCurrencyFormatter.format(averageSalary),
    detail: 'Live sample data powering the demo tables.',
  },
  {
    label: 'Active Employees',
    value: percentFormatter.format(activeCount / people.length),
    detail: 'Status states visible across sorting and filtering.',
  },
] as const

const heroColumns: ColumnDef<Person, any>[] = [
  columnHelper.accessor('firstName', {
    header: 'Operator',
    cell: (info: any) => (
      <div className={s.previewIdentity}>
        <span className={s.previewName}>
          {info.row.original.firstName} {info.row.original.lastName}
        </span>
        <span className={s.previewRole}>{info.row.original.role}</span>
      </div>
    ),
    size: 210,
  }),
  columnHelper.accessor('department', {
    header: 'Desk',
    cell: (info: any) => (
      <span className={getDepartmentClassName(info.getValue() as string)}>
        {info.getValue()}
      </span>
    ),
    size: 120,
  }),
  columnHelper.accessor('salary', {
    header: 'Budget',
    cell: (info: any) => (
      <span className={s.currencyValue}>
        {currencyFormatter.format(info.getValue() as number)}
      </span>
    ),
    size: 120,
  }),
  columnHelper.accessor('active', {
    header: 'Live',
    cell: (info: any) => (
      <span
        className={`${s.statusPill} ${
          info.getValue() ? s.statusPillPositive : s.statusPillNegative
        }`}
      >
        <span className={s.statusPillDot} />
        {info.getValue() ? 'Online' : 'Paused'}
      </span>
    ),
    size: 100,
  }),
]

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
      <span className={s.emailValue}>{info.getValue()}</span>
    ),
    size: 220,
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: (info: any) => (
      <span className={s.numericValue}>{info.getValue()}</span>
    ),
    size: 70,
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    cell: (info: any) => (
      <span className={getDepartmentClassName(info.getValue() as string)}>
        {info.getValue()}
      </span>
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
      <span className={s.currencyValue}>
        {currencyFormatter.format(info.getValue() as number)}
      </span>
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
    cell: (info: any) =>
      currencyFormatter.format(info.getValue() as number).replace('.00', ''),
    size: 100,
  }),
]

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10.8 10.8a4.8 4.8 0 1 1 .8-.8l3.2 3.2-.8.8-3.2-3.2Z"
        fill="currentColor"
      />
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

export default function Home() {
  const [tab, setTab] = useState<DemoTab>('data')
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('forest')

  const activeNote = tab === 'themes' ? themeNotes[selectedTheme] : fieldNotes[tab]

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <header className={s.hero}>
          <div className={s.heroCopy}>
            <div className={s.kickerRow}>
              <span className={s.kicker}>TypeScript-first table engine</span>
              <span className={s.kickerDivider} />
              <span className={s.kickerMeta}>
                Headless core, React surface, vanilla renderer, theme tokens
              </span>
            </div>

            <h1 className={s.heroTitle}>
              Spreadsheet muscle.
              <br />
              Product taste.
              <br />
              Zero enterprise tax.
            </h1>

            <p className={s.heroLead}>
              Yable is a table system for teams that need real data tooling and
              still want the interface to feel considered. The shell below is
              editorial by design. The demos inside it are fully live.
            </p>

            <div className={s.heroBadges}>
              <span className={s.heroBadge}>Sorting, filtering, editing, theming</span>
              <span className={s.heroBadge}>Spreadsheet-grade features under MIT</span>
              <span className={s.heroBadge}>Designed to showcase the package, not hide it</span>
            </div>
          </div>

          <div className={s.heroStage}>
            <div className={s.stageChrome}>
              <span>Flight Deck</span>
              <span>Live Preview</span>
            </div>

            <div className={s.heroPreviewWrap}>
              <HeroPreview />
            </div>

            <div className={s.signalGrid}>
              {heroSignals.map((signal) => (
                <article key={signal.label} className={s.signalCard}>
                  <span className={s.signalLabel}>{signal.label}</span>
                  <strong className={s.signalValue}>{signal.value}</strong>
                  <p className={s.signalDetail}>{signal.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </header>

        <section className={s.packageBand} aria-label="Package layers">
          {packageLayers.map((layer) => (
            <article key={layer.name} className={s.packageCard}>
              <span className={s.packageLabel}>{layer.label}</span>
              <h2 className={s.packageName}>{layer.name}</h2>
              <p className={s.packageCopy}>{layer.copy}</p>
            </article>
          ))}
        </section>

        <section className={s.showcase}>
          <div className={s.showcaseHeader}>
            <div className={s.showcaseTitleGroup}>
              <span className={s.sectionEyebrow}>Live Demo Deck</span>
              <h2 className={s.sectionTitle}>The product should sell itself on contact.</h2>
              <p className={s.sectionDescription}>
                This page turns the demo into a proper front door for the
                package: the table is the hero, the framing is intentional, and
                every tab proves a different part of the system.
              </p>
            </div>

            <nav className={s.tabBar} aria-label="Demo tabs">
              {(
                [
                  ['data', 'Live Data'],
                  ['editable', 'Editing'],
                  ['themes', 'Theme Gallery'],
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
          </div>

          <div className={s.showcaseGrid}>
            <div className={s.showcaseMain}>
              {tab === 'data' && <BasicDemo />}
              {tab === 'editable' && <EditableDemo />}
              {tab === 'themes' && (
                <ThemeGallery selected={selectedTheme} onSelect={setSelectedTheme} />
              )}
            </div>

            <aside className={s.showcaseSidebar}>
              <div className={s.sidebarCard}>
                <span className={s.sidebarEyebrow}>{activeNote.eyebrow}</span>
                <h3 className={s.sidebarTitle}>{activeNote.title}</h3>
                <p className={s.sidebarDescription}>{activeNote.description}</p>

                <div className={s.sidebarList}>
                  {activeNote.points.map((point, index) => (
                    <div key={point} className={s.sidebarItem}>
                      <span className={s.sidebarIndex}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={s.sidebarCard}>
                <span className={s.sidebarEyebrow}>What Ships Free</span>
                <div className={s.valueStack}>
                  <div className={s.valueRow}>
                    <span>Formula engine</span>
                    <span>Included</span>
                  </div>
                  <div className={s.valueRow}>
                    <span>Pivot tables</span>
                    <span>Included</span>
                  </div>
                  <div className={s.valueRow}>
                    <span>Clipboard + fill handle</span>
                    <span>Included</span>
                  </div>
                  <div className={s.valueRow}>
                    <span>Undo / redo</span>
                    <span>Included</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className={s.manifestGrid}>
          <article className={s.manifestCard}>
            <span className={s.manifestEyebrow}>Why It Lands</span>
            <h2 className={s.manifestTitle}>A headless engine that still respects presentation.</h2>
            <p className={s.manifestCopy}>
              The package is built for teams that want architectural control
              without having to rebuild sorting, editing, selection, and visual
              polish every time a new table appears.
            </p>
          </article>

          <article className={s.manifestCard}>
            <span className={s.manifestEyebrow}>Design Note</span>
            <h2 className={s.manifestTitle}>The demo needed a point of view.</h2>
            <p className={s.manifestCopy}>
              The old page looked like a stock dark SaaS shell. This version
              uses a warmer editorial palette, stronger typography, and tighter
              composition so the package feels authored instead of templated.
            </p>
          </article>

          <article className={s.manifestCard}>
            <span className={s.manifestEyebrow}>Interaction Note</span>
            <h2 className={s.manifestTitle}>Browser-verified, not eyeballed from source.</h2>
            <p className={s.manifestCopy}>
              The page was booted locally and checked through browser automation
              so the visual work stays grounded in the real render, not an
              imagined one.
            </p>
          </article>
        </section>
      </div>
    </div>
  )
}

function HeroPreview() {
  const table = useTable({
    data: heroPreviewData,
    columns: heroColumns,
    getRowId: (row) => String(row.id),
  })

  return <Table table={table} theme="forest" striped bordered />
}

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
              Search, sort, select, and paginate without leaving the same
              component tree.
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
            <h3 className={s.demoTitle}>Inline forms without losing table rhythm.</h3>
            <p className={s.demoDescription}>
              Changes stay buffered until commit, which keeps the surface
              reversible and calm.
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
            <p className={s.demoDescription}>
              Choose a theme to inspect how the system shifts while the table
              structure stays constant.
            </p>
          </div>

          <div className={s.demoMetrics}>
            <span className={s.metricPill}>Selected: {allThemes.find((theme) => theme.id === selected)?.label}</span>
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
          <span
            className={s.themeAccentDot}
            style={{ backgroundColor: theme.accent }}
          />
          <div>
            <span className={s.themeName}>{theme.label}</span>
            <span className={s.themeSubcopy}>{themeNotes[theme.id].title}</span>
          </div>
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

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00Z`))
}

function getDepartmentClassName(value: string) {
  if (value === 'Engineering') {
    return `${s.departmentPill} ${s.departmentEngineering}`
  }

  if (value === 'Design') {
    return `${s.departmentPill} ${s.departmentDesign}`
  }

  return `${s.departmentPill} ${s.departmentProduct}`
}
