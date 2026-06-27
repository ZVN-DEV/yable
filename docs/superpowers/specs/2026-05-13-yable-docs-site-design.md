# Yable Documentation Site — Design Spec

**Date:** 2026-05-13
**Stack:** Fumadocs + Next.js 15, deployed to Vercel
**Location:** `apps/docs/` in the YableTable monorepo

---

## Goal

Ship a hosted documentation site for Yable at a Vercel subdomain. The site converts the existing `docs/*.md` files into a navigable, searchable docs experience with live interactive table demos. It should make Yable feel like a serious, well-documented OSS project.

---

## Architecture

- **Framework:** [Fumadocs](https://fumadocs.vercel.app) — MDX-based docs framework built on Next.js
- **Location:** `apps/docs/` — standalone Next.js app within the monorepo, own `package.json`
- **Styling:** Tailwind CSS v4 (Fumadocs default) + Yable themes for demos
- **Search:** Fumadocs built-in full-text search
- **Deployment:** Vercel, auto-deploy from `main` branch
- **Domain:** Vercel subdomain initially (e.g., `yable-docs.vercel.app`), custom domain later

No turborepo or monorepo tooling required. The docs app is independent — it installs `@zvndev/yable-core`, `@zvndev/yable-react`, and `@zvndev/yable-themes` from npm (published v0.3.0) for live demos.

---

## Content Structure

The existing 6 doc files get reorganized into Fumadocs' content source structure. The two large files (`FEATURES.md` at 1,204 lines, `API.md` at 1,147 lines) are split into individual pages per section.

```
apps/docs/
├── app/
│   ├── layout.tsx              # Root layout with Fumadocs provider
│   ├── (home)/
│   │   └── page.tsx            # Landing page
│   └── docs/
│       ├── layout.tsx          # Docs layout with sidebar
│       └── [[...slug]]/
│           └── page.tsx        # Dynamic MDX page renderer
├── content/docs/
│   ├── meta.json               # Navigation ordering
│   ├── index.mdx               # Introduction / overview
│   ├── quickstart.mdx          # from docs/QUICKSTART.md (576 lines)
│   ├── features/
│   │   ├── meta.json           # Feature nav ordering
│   │   ├── index.mdx           # Feature overview + links
│   │   ├── sorting.mdx
│   │   ├── filtering.mdx
│   │   ├── pagination.mdx
│   │   ├── cell-editing.mdx
│   │   ├── column-pinning.mdx
│   │   ├── column-resizing.mdx
│   │   ├── column-visibility.mdx
│   │   ├── column-ordering.mdx
│   │   ├── column-grouping.mdx
│   │   ├── aggregation.mdx
│   │   ├── row-selection.mdx
│   │   ├── row-expanding.mdx
│   │   ├── row-pinning.mdx
│   │   ├── tree-data.mdx
│   │   ├── pivot-tables.mdx
│   │   ├── undo-redo.mdx
│   │   ├── clipboard.mdx
│   │   ├── fill-handle.mdx
│   │   ├── formulas.mdx
│   │   ├── async-commits.mdx   # merges docs/async-commits.md content
│   │   ├── export.mdx
│   │   ├── event-system.mdx
│   │   └── i18n.mdx
│   ├── api/
│   │   ├── meta.json           # API nav ordering
│   │   ├── index.mdx           # API overview
│   │   ├── create-table.mdx
│   │   ├── column-helper.mdx
│   │   ├── table-options.mdx
│   │   ├── table-instance.mdx
│   │   ├── column-instance.mdx
│   │   ├── row-instance.mdx
│   │   ├── cell-instance.mdx
│   │   ├── header.mdx
│   │   ├── state-types.mdx
│   │   ├── sorting-functions.mdx
│   │   ├── filter-functions.mdx
│   │   ├── aggregation-functions.mdx
│   │   ├── column-definition-types.mdx
│   │   ├── async-commit-types.mdx
│   │   ├── event-types.mdx
│   │   └── utility-functions.mdx
│   ├── migration.mdx           # from docs/MIGRATION.md (402 lines)
│   └── errors.mdx              # from docs/errors.md (171 lines)
├── components/
│   ├── live-demo.tsx            # Interactive code editor + preview
│   └── sample-data.ts          # Shared demo data (Employee type, rows)
├── lib/
│   └── source.ts               # Fumadocs content source config
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Navigation Sidebar

```
Introduction
Quickstart
Features
  ├── Sorting
  ├── Filtering
  ├── Pagination
  ├── Cell Editing
  ├── Column Pinning
  ├── Column Resizing
  ├── Column Visibility
  ├── Column Ordering
  ├── Column Grouping
  ├── Aggregation
  ├── Row Selection
  ├── Row Expanding
  ├── Row Pinning
  ├── Tree Data
  ├── Pivot Tables
  ├── Undo / Redo
  ├── Clipboard
  ├── Fill Handle
  ├── Formulas
  ├── Async Commits
  ├── Export
  ├── Event System
  └── i18n
API Reference
  ├── createTable
  ├── createColumnHelper
  ├── Table Options
  ├── Table Instance
  ├── Column Instance
  ├── Row Instance
  ├── Cell Instance
  ├── Header & HeaderGroup
  ├── State Types
  ├── Sorting Functions
  ├── Filter Functions
  ├── Aggregation Functions
  ├── Column Definition Types
  ├── Async Commit Types
  ├── Event Types
  └── Utility Functions
Migration from TanStack Table
Error Reference
```

---

## Live Demos

### Component: `<LiveDemo>`

A React component that renders an editable code block with a live preview of the rendered Yable table. Built with `react-live`.

**Props:**

- `code: string` — the initial source code
- `scope?: Record<string, unknown>` — additional modules available in the sandbox (defaults include all `@zvndev/yable-react` exports and sample data)
- `height?: string` — preview container height (default `"300px"`)

**Default scope (always available in demos):**

- All exports from `@zvndev/yable-react` (`useTable`, `Table`, `createColumnHelper`, `Pagination`, `GlobalFilter`, etc.)
- `@zvndev/yable-themes` CSS (loaded globally)
- `sampleData` and `Employee` type from `components/sample-data.ts`
- `React` and common hooks

**Usage in MDX:**

```mdx
import { LiveDemo } from '@/components/live-demo'

<LiveDemo code={`
const columnHelper = createColumnHelper<Employee>()

const columns = [
columnHelper.accessor('name', { header: 'Name' }),
columnHelper.accessor('department', { header: 'Department' }),
columnHelper.accessor('salary', { header: 'Salary' }),
]

function Demo() {
const table = useTable({ data: sampleData, columns })
return <Table table={table} />
}

render(<Demo />)
`} />
```

### Which pages get live demos

Priority pages for live demos (launch):

- Quickstart (basic table)
- Sorting (click-to-sort demo)
- Filtering (global + column filter demo)
- Cell Editing (editable cells demo)
- Column Resizing (drag-to-resize demo)

All other feature pages use static code blocks initially. Demos can be added incrementally.

---

## Landing Page

Simple, clean landing page with:

- Yable logo/wordmark
- One-liner tagline: "The open-source data table engine with spreadsheet-grade features"
- Install command with copy button
- 3 feature highlights (formulas, async commits, MIT-licensed)
- "Get Started" button → quickstart
- npm badges, GitHub stars link
- Comparison table (from README)

---

## Theming & Design

- Fumadocs default theme (clean, professional)
- Dark/light mode toggle in header
- GitHub repo link in header nav
- npm version badge on landing page
- Code blocks use Fumadocs' built-in syntax highlighting (Shiki)
- Live demo areas have a subtle border to distinguish from static code

---

## Known Issues to Document

The Bevrly alt-ui project attempted a full AG Grid → Yable migration (13 pages converted, v0.3.0). The following issues were encountered and should be documented as troubleshooting guidance and/or fixed in Yable core:

### 1. Column drag accidentally hides columns

Users dragging columns can unintentionally hide them. The workaround is setting `lockVisible: true` in column meta and `enableHiding: false` on critical columns. AG Grid has `suppressDragLeaveHidesColumns` — Yable should either document the equivalent pattern or add a first-class option.

### 2. Row height drift during virtualization scroll

Row heights change visibly as the user scrolls when using virtualization. The alt-ui team built a `useTableRowHeights` hook that pre-computes heights before rendering (using font metrics, line height, padding). Default recipe: `{ font: '400 13px Inter', lineHeight: 20, padding: 16 }`, min 40px, estimated 48px. This should be documented as a pattern for dynamic row heights.

### 3. Header/body column width desync

Because Yable renders header and body as separate DOM trees, column widths can desync. The alt-ui team wrote a manual ResizeObserver-based `<colgroup>` sync (querying `.yable-thead .yable-th` and injecting widths into the body table). This is fragile and breaks if Yable's internal DOM structure changes. This is a core architecture issue that should be documented as a known limitation.

### 4. State persistence pattern

Column widths, visibility, and order need to be saved/restored across sessions. The alt-ui team uses `localforage` with debounced saves (100ms). Sort state is intentionally NOT persisted. This is a common need that should be documented as a recipe.

### 5. AG Grid column adapter

Converting AG Grid column definitions to Yable requires an adapter for `cellRenderer`, `valueFormatter`, `field` (nested dot-path access), and metadata (`pinned`, `flex`, `suppressMovable`, `lockVisible`). Class-component cellRenderers can fail — needs try-catch fallback. Document the migration adapter pattern.

These issues will be incorporated into a **Troubleshooting** or **Common Patterns** section of the docs site.

---

## Agent Dispatch Plan

Five parallel agents in isolated worktrees:

| Agent                                           | Responsibility                                                                         | Key files                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **1. Scaffold**                                 | `create-fumadocs-app`, configure Next.js, layout, landing page, tailwind, package.json | `apps/docs/app/`, `apps/docs/package.json`, `apps/docs/next.config.mjs` |
| **2. Content: Quickstart + Migration + Errors** | Convert 3 standalone markdown files to MDX with frontmatter                            | `apps/docs/content/docs/quickstart.mdx`, `migration.mdx`, `errors.mdx`  |
| **3. Content: Features**                        | Split `FEATURES.md` into 22 individual MDX pages + index + meta.json                   | `apps/docs/content/docs/features/`                                      |
| **4. Content: API**                             | Split `API.md` into 16 individual MDX pages + index + meta.json                        | `apps/docs/content/docs/api/`                                           |
| **5. LiveDemo + Samples**                       | Build `react-live` component, sample data, wire into scope                             | `apps/docs/components/live-demo.tsx`, `sample-data.ts`                  |

After all agents complete, a review agent verifies the build compiles and pages render.

---

## Out of Scope

- Custom domain setup (future)
- Algolia/DocSearch (Fumadocs built-in search is sufficient for now)
- Blog section
- Versioned docs (only v0.3.0 exists)
- CI/CD pipeline for docs (Vercel handles this automatically)
