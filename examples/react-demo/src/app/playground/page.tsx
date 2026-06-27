'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  useTable,
  Table,
  Pagination,
  GlobalFilter,
  CellInput,
  CellSelect,
  CellCheckbox,
  CellLink,
  createYableConfig,
  createColumnHelper,
  selectColumn,
  type ColumnDef,
  type SortingState,
  type YableConfig,
} from '@zvndev/yable-react'
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

const CURRENT_VERSION = '0.2.1'

const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales']
const roles = [
  'Intern',
  'Junior Engineer',
  'Engineer',
  'Senior Engineer',
  'Staff Engineer',
  'Designer',
  'Senior Designer',
  'Product Manager',
  'Marketing Lead',
  'Sales Rep',
]

function generateData(count: number): Employee[] {
  const firstNames = [
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
    'Uma',
    'Victor',
    'Wendy',
    'Xander',
    'Yara',
    'Zoe',
    'Adrian',
    'Beth',
    'Carlos',
    'Dana',
  ]
  const lastNames = [
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
    'Robinson',
    'Clark',
    'Lewis',
    'Lee',
    'Walker',
    'Hall',
    'Allen',
    'Young',
    'King',
    'Wright',
    'Scott',
  ]

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    const dept = departments[i % departments.length]
    return {
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      age: 22 + ((i * 7) % 30),
      role: roles[i % roles.length],
      department: dept,
      salary: 55000 + ((i * 13000) % 160000),
      startDate: `${2018 + (i % 7)}-${String(1 + ((i * 3) % 12)).padStart(2, '0')}-${String(1 + ((i * 7) % 28)).padStart(2, '0')}`,
      active: i % 5 !== 0,
      rating: 1 + ((i * 3) % 5),
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

const SERVER_TOTAL_ROWS = 2500
const SERVER_PAGE_SIZE = 100
const serverDatabase = generateData(SERVER_TOTAL_ROWS)

type ServerFetchResult = {
  rows: Employee[]
  nextCursor: number
  hasMore: boolean
  total: number
}

async function fetchServerEmployees({
  cursor,
  sorting,
  globalFilter,
  overrides,
  signal,
}: {
  cursor: unknown
  sorting: SortingState
  globalFilter: string
  overrides: Map<number, Partial<Employee>>
  signal?: AbortSignal
}): Promise<ServerFetchResult> {
  await new Promise((resolve) => setTimeout(resolve, 180))
  if (signal?.aborted) {
    return { rows: [], nextCursor: 0, hasMore: false, total: 0 }
  }

  let rows = serverDatabase.map((row) => ({ ...row, ...overrides.get(row.id) }))
  const query = globalFilter.trim().toLowerCase()

  if (query) {
    rows = rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(query)),
    )
  }

  const sort = sorting[0]
  if (sort && sort.id !== '_select') {
    rows = [...rows].sort((a, b) => {
      const aValue = a[sort.id as keyof Employee]
      const bValue = b[sort.id as keyof Employee]
      const result =
        typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue))
      return sort.desc ? -result : result
    })
  }

  const start = typeof cursor === 'number' ? cursor : 0
  const page = rows.slice(start, start + SERVER_PAGE_SIZE)
  return {
    rows: page,
    nextCursor: start + page.length,
    hasMore: start + page.length < rows.length,
    total: rows.length,
  }
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
type DesignerMode = 'simple' | 'advanced'
type DataMode = 'client' | 'server'
type TableProfileId = 'default' | 'compactVariant' | 'reviewGrid'
type CellProfileId = 'default' | 'RichItem' | 'MutedMeta' | 'StrongMetric'

/* ── Config Designer ─────────────────────────────────────────────────────── */

const TABLE_PROFILES: Record<TableProfileId, { label: string; description: string }> = {
  default: { label: 'Default', description: 'Site-wide table settings' },
  compactVariant: { label: 'Compact variant', description: 'Reusable dense profile' },
  reviewGrid: { label: 'Review grid', description: 'Wide profile with sticky headers' },
}

const CELL_PROFILES: Record<CellProfileId, { label: string; description: string }> = {
  default: { label: 'Default', description: 'Plain inherited cell' },
  RichItem: { label: 'RichItem', description: 'Wrapped, prominent item cells' },
  MutedMeta: { label: 'MutedMeta', description: 'Quiet secondary metadata' },
  StrongMetric: { label: 'StrongMetric', description: 'Right-aligned numeric emphasis' },
}

const DEFAULT_COLUMN_CELL_CONFIG: Record<string, CellProfileId> = {
  name: 'RichItem',
  email: 'MutedMeta',
  salary: 'StrongMetric',
  completion: 'StrongMetric',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ColumnDef is invariant and table columns intentionally mix value types.
type EmployeeColumnDef = ColumnDef<Employee, any>

function buildDesignerConfig({
  theme,
  compact,
  stickyHeader,
  bordered,
  striped,
  defaultColumnSize,
  rowHeight,
}: {
  theme: ThemeId
  compact: boolean
  stickyHeader: boolean
  bordered: boolean
  striped: boolean
  defaultColumnSize: number
  rowHeight: 'comfortable' | 'compact'
}): YableConfig<Employee> {
  return createYableConfig<Employee>({
    table: {
      theme,
      striped,
      bordered,
      compact,
      stickyHeader,
      ariaLabel: 'Employee table',
    },
    columns: {
      default: {
        size: defaultColumnSize,
        minSize: 64,
        maxSize: 420,
        enableSorting: true,
        enableResizing: true,
        enableReorder: true,
      },
    },
    rows: {
      className: rowHeight === 'compact' ? 'yable-row--dense' : 'yable-row--comfortable',
    },
    cells: {
      named: {
        RichItem: {
          cellClassName: 'yable-cell-rich-item',
          cellStyle: { whiteSpace: 'normal', lineHeight: 1.35, fontWeight: 600 },
        },
        MutedMeta: {
          cellClassName: 'yable-cell-muted-meta',
          cellStyle: { color: 'var(--yable-color-text-muted)' },
        },
        StrongMetric: {
          cellClassName: 'yable-cell-strong-metric',
          cellStyle: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
        },
      },
      byColumn: {
        department: {
          cellType: 'badge',
          cellTypeProps: { variant: 'accent', appearance: 'soft' },
        },
      },
    },
    profiles: {
      compactVariant: {
        table: {
          theme: 'compact',
          compact: true,
          bordered: false,
          stickyHeader: false,
          ariaLabel: 'Compact employee table',
        },
        columns: {
          default: { size: 112, minSize: 56, maxSize: 220 },
          byId: {
            name: { size: 140 },
            email: { size: 180 },
            salary: { size: 96 },
          },
        },
        rows: { className: 'yable-row--dense' },
        cells: {
          byColumn: {
            name: {
              cellStyle: { whiteSpace: 'nowrap', fontWeight: 600 },
            },
          },
        },
      },
      reviewGrid: {
        table: {
          theme,
          stickyHeader: true,
          bordered: true,
          columnVirtualization: true,
          ariaLabel: 'Wide employee review table',
        },
        columns: {
          default: { size: 180, minSize: 90, maxSize: 520 },
          byId: {
            email: { size: 280 },
            role: { size: 220 },
          },
        },
      },
    },
  })
}

/* ── Column Definitions ──────────────────────────────────────────────────── */

const columnHelper = createColumnHelper<Employee>()

function buildColumns(
  editable: boolean,
  showSelection: boolean,
  columnCellConfigs: Record<string, CellProfileId>,
  specialNameOverride: boolean,
): EmployeeColumnDef[] {
  const cols: EmployeeColumnDef[] = []

  if (showSelection) {
    cols.push(selectColumn<Employee>())
  }

  cols.push(
    columnHelper.accessor('name', {
      header: 'Name',
      cellConfig: columnCellConfigs.name === 'default' ? undefined : columnCellConfigs.name,
      cell: editable
        ? (info) => <CellInput context={info} />
        : (info) => <span className={s.cellName}>{info.getValue()}</span>,
      editable,
      editConfig: editable ? { type: 'text' } : undefined,
      meta: editable ? { alwaysEditable: true } : undefined,
      ...(specialNameOverride
        ? {
            cellStyle: {
              color: 'var(--yable-color-accent)',
              fontWeight: 700,
              whiteSpace: 'normal',
            },
          }
        : {}),
      size: 180,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cellConfig: columnCellConfigs.email === 'default' ? undefined : columnCellConfigs.email,
      cell: (info) => <CellLink context={info} href={(v) => `mailto:${v}`} />,
      size: 240,
    }),
    columnHelper.accessor('age', {
      header: 'Age',
      cellType: 'numeric',
      size: 70,
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      cellConfig:
        columnCellConfigs.department === 'default' ? undefined : columnCellConfigs.department,
      cell: editable
        ? (info) => (
            <CellSelect context={info} options={departments.map((d) => ({ label: d, value: d }))} />
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
      cellConfig: columnCellConfigs.salary === 'default' ? undefined : columnCellConfigs.salary,
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
      cell: editable ? (info) => <CellCheckbox context={info} /> : undefined,
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
      cellConfig:
        columnCellConfigs.completion === 'default' ? undefined : columnCellConfigs.completion,
      cellType: 'progress',
      cellTypeProps: { variant: 'accent' },
      size: 130,
    }),
  )

  return cols
}

/* ── Playground Page ─────────────────────────────────────────────────────── */

export default function PlaygroundPage() {
  const [designerMode, setDesignerMode] = useState<DesignerMode>('simple')
  const [tableProfile, setTableProfile] = useState<TableProfileId>('default')
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
  const [showSelection, setShowSelection] = useState(false)
  const [rowClickSelection, setRowClickSelection] = useState(false)
  const [cellSelection, setCellSelection] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [defaultColumnSize, setDefaultColumnSize] = useState(150)
  const [rowHeight, setRowHeight] = useState<'comfortable' | 'compact'>('comfortable')
  const [specialNameOverride, setSpecialNameOverride] = useState(false)
  const [columnCellConfigs, setColumnCellConfigs] = useState<Record<string, CellProfileId>>(
    DEFAULT_COLUMN_CELL_CONFIG,
  )

  // Data
  const [dataMode, setDataMode] = useState<DataMode>('client')
  const [dataSize, setDataSize] = useState<string>('50 rows')
  const clientData = useMemo(() => generateData(DATASETS[dataSize]), [dataSize])
  const [serverRows, setServerRows] = useState<Employee[]>([])
  const [serverCursor, setServerCursor] = useState(0)
  const [serverTotal, setServerTotal] = useState(SERVER_TOTAL_ROWS)
  const [serverHasMore, setServerHasMore] = useState(true)
  const [serverLoading, setServerLoading] = useState(false)
  const [serverSorting, setServerSorting] = useState<SortingState>([])
  const [serverGlobalFilter, setServerGlobalFilter] = useState('')
  const [serverOverrides, setServerOverrides] = useState(() => new Map<number, Partial<Employee>>())
  const serverOverridesRef = useRef(serverOverrides)
  const [serverLog, setServerLog] = useState<string[]>([
    'Client mode renders local rows. Server mode controls sorting, filtering, paging, and row updates through fetch callbacks.',
  ])
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const data = dataMode === 'server' ? serverRows : clientData

  const loadServerPage = useCallback(
    async (nextCursor: number, mode: 'replace' | 'append') => {
      setServerLoading(true)
      const result = await fetchServerEmployees({
        cursor: nextCursor,
        sorting: serverSorting,
        globalFilter: serverGlobalFilter,
        overrides: serverOverridesRef.current,
      })
      setServerRows((prev) => (mode === 'replace' ? result.rows : [...prev, ...result.rows]))
      setServerCursor(result.nextCursor)
      setServerHasMore(result.hasMore)
      setServerTotal(result.total)
      setServerLoading(false)
      setServerLog((prev) => [
        `Fetched ${result.rows.length} rows at cursor ${nextCursor}; sort=${serverSorting[0] ? `${serverSorting[0].id} ${serverSorting[0].desc ? 'desc' : 'asc'}` : 'none'}; filter="${serverGlobalFilter || 'none'}".`,
        ...prev,
      ])
    },
    [serverGlobalFilter, serverSorting],
  )

  const yableConfig = useMemo(
    () =>
      buildDesignerConfig({
        theme,
        compact,
        stickyHeader,
        bordered,
        striped,
        defaultColumnSize,
        rowHeight,
      }),
    [bordered, compact, defaultColumnSize, rowHeight, stickyHeader, striped, theme],
  )

  // Columns (rebuild when edit, selection, or cell-profile toggles change)
  const columns = useMemo(
    () => buildColumns(editMode, showSelection, columnCellConfigs, specialNameOverride),
    [columnCellConfigs, editMode, showSelection, specialNameOverride],
  )

  const table = useTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
    config: yableConfig,
    configProfile: tableProfile,
    enableRowClickSelection: rowClickSelection,
    enableCellSelection: cellSelection,
    enableVirtualization: dataMode === 'server',
    rowHeight: dataMode === 'server' ? 42 : undefined,
    overscan: dataMode === 'server' ? 10 : undefined,
    manualSorting: dataMode === 'server',
    manualFiltering: dataMode === 'server',
    state:
      dataMode === 'server'
        ? {
            sorting: serverSorting,
            globalFilter: serverGlobalFilter,
          }
        : undefined,
    onSortingChange:
      dataMode === 'server'
        ? (updater) => {
            setServerSorting((prev) => (typeof updater === 'function' ? updater(prev) : updater))
            setServerRows([])
            setServerCursor(0)
            setServerHasMore(true)
          }
        : undefined,
    onGlobalFilterChange:
      dataMode === 'server'
        ? (updater) => {
            setServerGlobalFilter((prev) =>
              typeof updater === 'function' ? updater(prev) : updater,
            )
            setServerRows([])
            setServerCursor(0)
            setServerHasMore(true)
          }
        : undefined,
  })
  const compactPreviewTable = useTable({
    data: data.slice(0, 5),
    columns,
    getRowId: (row) => `compact-${row.id}`,
    config: yableConfig,
    configProfile: 'compactVariant',
  })
  const reviewPreviewTable = useTable({
    data: data.slice(0, 5),
    columns,
    getRowId: (row) => `review-${row.id}`,
    config: yableConfig,
    configProfile: 'reviewGrid',
  })

  // Sync color scheme to <html> so CSS theme selectors work correctly
  // (only one ancestor data-yable-theme should exist at a time)
  useEffect(() => {
    document.documentElement.setAttribute('data-yable-theme', colorScheme)
  }, [colorScheme])

  useEffect(() => {
    serverOverridesRef.current = serverOverrides
  }, [serverOverrides])

  useEffect(() => {
    if (dataMode !== 'server') return
    void loadServerPage(0, 'replace')
  }, [dataMode, loadServerPage])

  useEffect(() => {
    if (dataMode !== 'server') return
    const container = tableContainerRef.current
    const scroller =
      container?.querySelector<HTMLElement>('.yable-virtual-scroll-container') ??
      container?.querySelector<HTMLElement>('.yable-main')
    if (!scroller) return

    const handleScroll = () => {
      const remaining = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
      if (remaining < 120 && serverHasMore && !serverLoading) {
        void loadServerPage(serverCursor, 'append')
      }
    }

    scroller.addEventListener('scroll', handleScroll)
    return () => scroller.removeEventListener('scroll', handleScroll)
  }, [dataMode, loadServerPage, serverCursor, serverHasMore, serverLoading])

  // Toggle pagination: show all rows when pagination is off
  useEffect(() => {
    if (dataMode === 'server') {
      table.setPageSize(data.length || SERVER_PAGE_SIZE)
      table.setPageIndex(0)
      return
    }
    if (!showPagination) {
      table.setPageSize(data.length)
      table.setPageIndex(0)
    } else {
      table.setPageSize(10)
      table.setPageIndex(0)
    }
  }, [dataMode, showPagination, data.length, table])

  const selectedCount = Object.keys(table.getState().rowSelection).length
  const pendingChanges = table.getAllPendingChanges()
  const hasPending = table.hasPendingChanges()
  const pendingCount = Object.keys(pendingChanges).length
  const generatedConfig = useMemo(
    () =>
      buildGeneratedConfig({
        config: yableConfig,
        tableProfile,
        columnCellConfigs,
        specialNameOverride,
        editMode,
        showSelection,
        rowClickSelection,
        cellSelection,
        dataMode,
      }),
    [
      cellSelection,
      columnCellConfigs,
      editMode,
      rowClickSelection,
      dataMode,
      showSelection,
      specialNameOverride,
      tableProfile,
      yableConfig,
    ],
  )

  const handleSave = useCallback(() => {
    if (!hasPending) return
    table.discardAllPending()
  }, [hasPending, table])

  const handleLoadMoreServerRows = useCallback(() => {
    if (dataMode !== 'server' || serverLoading || !serverHasMore) return
    void loadServerPage(serverCursor, 'append')
  }, [dataMode, loadServerPage, serverCursor, serverHasMore, serverLoading])

  const handleJumpNearRow800 = useCallback(() => {
    if (dataMode !== 'server') return
    void loadServerPage(760, 'replace')
    setServerLog((prev) => [
      'Jumped to cursor 760 to inspect rows around item 800 without loading earlier pages.',
      ...prev,
    ])
  }, [dataMode, loadServerPage])

  const handleEagerUpdateRow800 = useCallback(() => {
    const id = 800
    const patch: Partial<Employee> = {
      active: true,
      completion: 99,
      rating: 5,
      salary: 214000,
      startDate: new Date().toISOString(),
    }
    setServerOverrides((prev) => new Map(prev).set(id, { ...prev.get(id), ...patch }))
    setServerRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
    setServerLog((prev) => [
      'Eagerly updated row 800; loaded windows patch immediately and future fetches hydrate from server overrides.',
      ...prev,
    ])
  }, [])

  const handleProfileChange = useCallback((profileId: TableProfileId) => {
    setTableProfile(profileId)
    if (profileId === 'compactVariant') {
      setTheme('compact')
      setCompact(true)
      setBordered(false)
      setStickyHeader(false)
      setDefaultColumnSize(112)
      setRowHeight('compact')
    } else if (profileId === 'reviewGrid') {
      setCompact(false)
      setBordered(true)
      setStickyHeader(true)
      setDefaultColumnSize(180)
      setRowHeight('comfortable')
    } else {
      setTheme('midnight')
      setCompact(false)
      setBordered(true)
      setStickyHeader(true)
      setDefaultColumnSize(150)
      setRowHeight('comfortable')
    }
  }, [])

  return (
    <div className={s.playground}>
      {/* ── Control Panel ──────────────────────────────────────────────── */}
      <aside className={s.panel}>
        <div className={s.panelHeader}>
          <h1 className={s.panelTitle}>Yable Playground</h1>
          <p className={s.panelSub}>Interactive table workbench</p>
        </div>

        <Section title="Mode">
          <div className={s.toggleRow}>
            <ToggleButton
              active={designerMode === 'simple'}
              onClick={() => setDesignerMode('simple')}
              label="Simple"
            />
            <ToggleButton
              active={designerMode === 'advanced'}
              onClick={() => setDesignerMode('advanced')}
              label="Advanced"
            />
          </div>
        </Section>

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
          <div className={s.profileStack}>
            {Object.entries(TABLE_PROFILES).map(([id, item]) => (
              <button
                key={id}
                type="button"
                className={`${s.profileBtn} ${tableProfile === id ? s.profileBtnActive : ''}`}
                onClick={() => handleProfileChange(id as TableProfileId)}
              >
                <span>{item.label}</span>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
          <Switch label="Striped" checked={striped} onChange={setStriped} />
          <Switch label="Bordered" checked={bordered} onChange={setBordered} />
          <Switch label="Compact" checked={compact} onChange={setCompact} />
          <Switch label="Sticky Header" checked={stickyHeader} onChange={setStickyHeader} />
          <Switch label="Footer" checked={showFooter} onChange={setShowFooter} />
        </Section>

        {designerMode === 'advanced' && (
          <>
            <Section title="Column Defaults">
              <NumberControl
                label="Default width"
                value={defaultColumnSize}
                min={80}
                max={280}
                step={10}
                onChange={setDefaultColumnSize}
              />
              <div className={s.toggleRow}>
                <ToggleButton
                  active={rowHeight === 'comfortable'}
                  onClick={() => setRowHeight('comfortable')}
                  label="Comfort"
                />
                <ToggleButton
                  active={rowHeight === 'compact'}
                  onClick={() => setRowHeight('compact')}
                  label="Dense"
                />
              </div>
            </Section>

            <Section title="Column Cell Configs">
              {['name', 'email', 'department', 'salary', 'completion'].map((columnId) => (
                <SelectControl
                  key={columnId}
                  label={columnId}
                  value={columnCellConfigs[columnId] ?? 'default'}
                  options={Object.keys(CELL_PROFILES)}
                  onChange={(next) =>
                    setColumnCellConfigs((prev) => ({
                      ...prev,
                      [columnId]: next as CellProfileId,
                    }))
                  }
                />
              ))}
              <Switch
                label="Inline name override"
                checked={specialNameOverride}
                onChange={setSpecialNameOverride}
              />
            </Section>
          </>
        )}

        {/* Features */}
        <Section title="Features">
          <Switch label="Search / Filter" checked={showSearch} onChange={setShowSearch} />
          <Switch
            label="Pagination"
            checked={dataMode === 'server' ? false : showPagination}
            onChange={setShowPagination}
          />
          <Switch label="Selection Column" checked={showSelection} onChange={setShowSelection} />
          <Switch
            label="Row Click Selection"
            checked={rowClickSelection}
            onChange={setRowClickSelection}
          />
          <Switch
            label="Cell Range Selection"
            checked={cellSelection}
            onChange={setCellSelection}
          />
          <Switch label="Inline Editing" checked={editMode} onChange={setEditMode} />
        </Section>

        {/* Dataset */}
        <Section title="Dataset">
          <div className={s.toggleRow}>
            <ToggleButton
              active={dataMode === 'client'}
              onClick={() => setDataMode('client')}
              label="Client"
            />
            <ToggleButton
              active={dataMode === 'server'}
              onClick={() => setDataMode('server')}
              label="Server"
            />
          </div>
          <div className={s.datasetGrid}>
            {Object.keys(DATASETS).map((key) => (
              <button
                key={key}
                type="button"
                className={`${s.datasetBtn} ${dataSize === key && dataMode === 'client' ? s.datasetBtnActive : ''}`}
                onClick={() => setDataSize(key)}
                disabled={dataMode === 'server'}
              >
                {key}
              </button>
            ))}
          </div>
          {dataMode === 'server' && (
            <div className={s.serverMini}>
              <span>{SERVER_TOTAL_ROWS.toLocaleString()} remote rows</span>
              <span>{SERVER_PAGE_SIZE} rows per fetch</span>
            </div>
          )}
        </Section>

        {/* Live Stats */}
        <Section title="Live Stats">
          <div className={s.statGrid}>
            <Stat label={dataMode === 'server' ? 'Loaded' : 'Rows'} value={String(data.length)} />
            <Stat label="Columns" value={String(table.getVisibleLeafColumns().length)} />
            <Stat label="Selected" value={String(selectedCount)} />
            {dataMode === 'server' ? (
              <Stat label="Total" value={String(serverTotal)} />
            ) : (
              <Stat
                label="Page"
                value={`${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`}
              />
            )}
            {editMode && <Stat label="Pending" value={String(pendingCount)} accent />}
          </div>
        </Section>

        <div className={s.panelFooter}>
          <span className={s.footerBrand}>@zvndev/yable-react</span>
          <span className={s.footerVersion}>{`v${CURRENT_VERSION}`}</span>
        </div>
      </aside>

      {/* ── Table Area ─────────────────────────────────────────────────── */}
      <main className={s.stage}>
        <div className={s.stageHeader}>
          <div className={s.stageInfo}>
            <span className={s.stageThemeLabel}>{TABLE_PROFILES[tableProfile].label}</span>
            <span className={s.stagePropList}>
              {[
                tableProfile !== 'default' && `profile:${tableProfile}`,
                striped && 'striped',
                bordered && 'bordered',
                compact && 'compact',
                stickyHeader && 'stickyHeader',
                editMode && 'editable',
                dataMode === 'server' && 'serverMode',
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
              <button type="button" className={s.btnSave} onClick={handleSave}>
                Save ({pendingCount})
              </button>
            </div>
          )}
        </div>

        {showSearch && (
          <div className={s.searchBar}>
            <svg
              className={s.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path d="M10.8 10.8a4.8 4.8 0 1 1 .8-.8l3.2 3.2-.8.8-3.2-3.2Z" fill="currentColor" />
            </svg>
            <GlobalFilter table={table} placeholder="Search across all columns..." />
          </div>
        )}

        {dataMode === 'server' && (
          <div className={s.serverBar}>
            <div>
              <strong>Server mode</strong>
              <span>
                Manual sorting/filtering, cursor fetches, auto-load on scroll, and eager row updates
                use the same table + column definitions.
              </span>
            </div>
            <div className={s.serverActions}>
              <button
                type="button"
                className={s.btnGhost}
                onClick={handleLoadMoreServerRows}
                disabled={!serverHasMore || serverLoading}
              >
                {serverLoading ? 'Loading...' : 'Load next page'}
              </button>
              <button type="button" className={s.btnGhost} onClick={handleJumpNearRow800}>
                Jump near row 800
              </button>
              <button type="button" className={s.btnGhost} onClick={handleEagerUpdateRow800}>
                Eager update row 800
              </button>
            </div>
          </div>
        )}

        <div className={s.tableContainer} ref={tableContainerRef}>
          <Table
            table={table}
            config={yableConfig}
            configProfile={tableProfile}
            theme={theme}
            striped={striped}
            bordered={bordered}
            compact={compact}
            stickyHeader={stickyHeader}
            footer={showFooter}
          >
            {dataMode === 'client' && showPagination && <Pagination table={table} />}
          </Table>
        </div>

        {dataMode === 'server' && (
          <div className={s.serverLog}>
            <div className={s.serverLogHeader}>
              <span>Server Process</span>
              <span>
                cursor {serverCursor} / {serverTotal}
              </span>
            </div>
            {serverLog.slice(0, 4).map((entry, index) => (
              <div className={s.serverLogItem} key={`${entry}-${index}`}>
                {entry}
              </div>
            ))}
          </div>
        )}

        {designerMode === 'advanced' && (
          <div className={s.outputGrid}>
            <section className={`${s.outputPanel} ${s.previewPanel}`}>
              <div className={s.outputHeader}>
                <h2>Multi-table Preview</h2>
              </div>
              <div className={s.previewStack}>
                <div className={s.previewTable}>
                  <span>Compact variant</span>
                  <Table
                    table={compactPreviewTable}
                    config={yableConfig}
                    configProfile="compactVariant"
                  />
                </div>
                <div className={s.previewTable}>
                  <span>Review grid</span>
                  <Table
                    table={reviewPreviewTable}
                    config={yableConfig}
                    configProfile="reviewGrid"
                  />
                </div>
              </div>
            </section>
            <ConfigOutput title="Generated Yable Config" value={generatedConfig.config} />
            <ConfigOutput title="Row Config" value={generatedConfig.rows} />
            <ConfigOutput title="Column Cell Configs" value={generatedConfig.cells} />
          </div>
        )}
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={s.statCard}>
      <span className={s.statLabel}>{label}</span>
      <span className={`${s.statValue} ${accent ? s.statAccent : ''}`}>{value}</span>
    </div>
  )
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className={s.fieldRow}>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className={s.fieldRow}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function ConfigOutput({ title, value }: { title: string; value: string }) {
  return (
    <section className={s.outputPanel}>
      <div className={s.outputHeader}>
        <h2>{title}</h2>
      </div>
      <pre>
        <code>{value}</code>
      </pre>
    </section>
  )
}

function buildGeneratedConfig({
  config,
  tableProfile,
  columnCellConfigs,
  specialNameOverride,
  editMode,
  showSelection,
  rowClickSelection,
  cellSelection,
  dataMode,
}: {
  config: YableConfig<Employee>
  tableProfile: TableProfileId
  columnCellConfigs: Record<string, CellProfileId>
  specialNameOverride: boolean
  editMode: boolean
  showSelection: boolean
  rowClickSelection: boolean
  cellSelection: boolean
  dataMode: DataMode
}) {
  const configText = `import { createYableConfig } from '@zvndev/yable-react'

export const yableConfig = createYableConfig({
  table: ${formatObject(config.table, 2)},
  columns: ${formatObject(config.columns, 2)},
  rows: ${formatObject(config.rows, 2)},
  cells: ${formatObject(config.cells, 2)},
  profiles: ${formatObject(config.profiles, 2)},
})

// Global use:
// <YableProvider config={yableConfig} tableProfile="${tableProfile}">
//   <App />
// </YableProvider>

// Per-table use:
// const table = useTable({ data, columns, config: yableConfig, configProfile: "${tableProfile}" })
// <Table table={table} config={yableConfig} configProfile="${tableProfile}" />

// Server mode uses the same columns and table shell with controlled state:
// const table = useTable({
//   data: serverRows,
//   columns,
//   state: { sorting, globalFilter },
//   onSortingChange: fetchSortedRows,
//   onGlobalFilterChange: fetchFilteredRows,
//   manualSorting: true,
//   manualFiltering: true,
// })`

  const rowsText = `rows: ${formatObject(config.rows, 0)}

// Named profiles can override this:
profiles: {
  compactVariant: {
    rows: ${formatObject(config.profiles?.compactVariant?.rows, 4)}
  }
}`

  const cellsText = `const columns = [
${Object.entries(columnCellConfigs)
  .map(([columnId, cellConfig]) => {
    const override =
      columnId === 'name' && specialNameOverride
        ? `,\n    cellStyle: { color: 'var(--yable-color-accent)', fontWeight: 700 }`
        : ''
    return `  columnHelper.accessor('${columnId}', {
    header: '${toTitle(columnId)}',${
      cellConfig === 'default' ? '' : `\n    cellConfig: '${cellConfig}',`
    }${override}
  })`
  })
  .join(',\n')}
]

// Current feature toggles from the designer:
// dataMode: ${dataMode}
// selectionColumn: ${showSelection ? 'enabled' : 'disabled'}
// rowClickSelection: ${rowClickSelection ? 'enabled' : 'disabled'}
// cellRangeSelection: ${cellSelection ? 'enabled' : 'disabled'}
// inlineEditing: ${editMode ? 'enabled' : 'disabled'}`

  return { config: configText, rows: rowsText, cells: cellsText }
}

function formatObject(value: unknown, indent: number): string {
  const json = JSON.stringify(value ?? {}, null, 2)
  return json
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/^/gm, ' '.repeat(indent))
    .trimStart()
}

function toTitle(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
