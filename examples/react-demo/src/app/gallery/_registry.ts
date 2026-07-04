// Single source of truth for the gallery — used by the index grid and each demo frame.

export type DemoKind = 'simple' | 'complex'

export interface DemoMeta {
  slug: string
  title: string
  blurb: string
  tags: string[]
  theme: string // yable theme name (class = yable-theme-<theme>)
  accent: string
  kind: DemoKind
}

export const DEMOS: DemoMeta[] = [
  // ── simple ────────────────────────────────────────────────────────────────
  {
    slug: 'contacts',
    title: 'Contact directory',
    blurb: 'The 30-second table: sortable columns, instant search, badge + link cells.',
    tags: ['Sorting', 'Global filter', 'Cell types'],
    theme: 'stripe',
    accent: '#635bff',
    kind: 'simple',
  },
  {
    slug: 'pricing',
    title: 'Pricing comparison',
    blurb: 'A table that does not look like a table — grouped feature rows, check/cross cells.',
    tags: ['Custom cells', 'Grouped rows', 'Static'],
    theme: 'mono',
    accent: '#b8b0a4',
    kind: 'simple',
  },
  {
    slug: 'leaderboard',
    title: 'Live leaderboard',
    blurb: 'Read-only and proud: rank medals, rating stars, win-rate bars, tier badges.',
    tags: ['Rank column', 'Rating', 'Progress'],
    theme: 'rose',
    accent: '#f08d92',
    kind: 'simple',
  },
  {
    slug: 'adaptive',
    title: 'Adaptive account desk',
    blurb: 'One table instance becomes a desktop grid, tablet card board, and mobile card feed.',
    tags: ['Adaptive layout', 'Responsive', 'Selection'],
    theme: 'ocean',
    accent: '#57c6d8',
    kind: 'simple',
  },
  // ── complex ─────────────────────────────────────────────────────────────────
  {
    slug: 'spreadsheet',
    title: 'Budget spreadsheet',
    blurb: 'Real formula engine: type =SUM(B2:E2), drag the fill handle, paste a block.',
    tags: ['Formulas', 'Fill handle', 'Clipboard', 'Keyboard'],
    theme: 'compact',
    accent: '#76d8b7',
    kind: 'complex',
  },
  {
    slug: 'crm',
    title: 'Sales CRM',
    blurb: 'Inline editing with optimistic async commits — pending, saved, and error states.',
    tags: ['Inline edit', 'Async commits', 'Selects'],
    theme: 'default',
    accent: '#d8b46d',
    kind: 'complex',
  },
  {
    slug: 'grouping',
    title: 'Sales by region',
    blurb: 'The 0.6.0 feature: group by region → category, collapsible headers, rolled-up totals.',
    tags: ['Row grouping', 'Aggregation', 'Expand'],
    theme: 'ocean',
    accent: '#57c6d8',
    kind: 'complex',
  },
  {
    slug: 'org',
    title: 'Org chart',
    blurb: 'Hierarchical tree data with expand/collapse and headcount/budget roll-ups.',
    tags: ['Tree data', 'Nested rows', 'Roll-ups'],
    theme: 'forest',
    accent: '#8fc7a0',
    kind: 'complex',
  },
  {
    slug: 'pivot',
    title: 'Pivot analysis',
    blurb:
      'getPivotRowModel() cross-tabs revenue by region × quarter with subtotals + grand total.',
    tags: ['Pivot model', 'Cross-tab', 'Subtotals'],
    theme: 'midnight',
    accent: '#6ec7ff',
    kind: 'complex',
  },
  {
    slug: 'virtualized',
    title: '50,000 rows',
    blurb:
      'Row virtualization: sort, filter and scroll fifty thousand rows without breaking a sweat.',
    tags: ['Virtualization', 'Scale', 'Filtering'],
    theme: 'mono',
    accent: '#b8b0a4',
    kind: 'complex',
  },
  {
    slug: 'trading',
    title: 'Trading terminal',
    blurb: 'Pinned columns, cell-range selection, and prices that tick live with flash animation.',
    tags: ['Pinned columns', 'Range select', 'Live flash'],
    theme: 'midnight',
    accent: '#6ec7ff',
    kind: 'complex',
  },
  {
    slug: 'projects',
    title: 'Project tracker',
    blurb: 'Master/detail rows expand into task lists, with progress bars, status, and pagination.',
    tags: ['Master/detail', 'Progress', 'Pagination'],
    theme: 'stripe',
    accent: '#635bff',
    kind: 'complex',
  },
  {
    slug: 'themes',
    title: 'Theme switcher',
    blurb: 'One dataset, eight shipped themes, live striped/bordered/compact toggles.',
    tags: ['8 themes', 'Density', 'Live'],
    theme: 'default',
    accent: '#d8b46d',
    kind: 'complex',
  },
]

export const getDemo = (slug: string): DemoMeta | undefined => DEMOS.find((d) => d.slug === slug)
