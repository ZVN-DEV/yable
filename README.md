<p align="center">
  <strong>Yable</strong>
</p>

<h3 align="center">The only table package you'll ever need.</h3>

<p align="center">
  AG&nbsp;Grid-class features. TanStack-class control. MIT-licensed, no paywall, zero-dependency core.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@zvndev/yable-react"><img src="https://img.shields.io/npm/v/@zvndev/yable-react?color=2563eb&label=npm" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@zvndev/yable-core?color=22c55e" alt="MIT license" /></a>
  <a href="https://bundlephobia.com/package/@zvndev/yable-react"><img src="https://img.shields.io/bundlephobia/minzip/@zvndev/yable-react?label=react%20gzip" alt="bundle size" /></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="TypeScript strict" />
</p>

---

**Headless core, batteries-included UI -- the control of a headless engine with the polish of a finished grid.**

Yable is a TypeScript-first, framework-agnostic data grid. The `@zvndev/yable-core` engine is headless and zero-dependency; `@zvndev/yable-react` ships the finished components -- sortable/filterable columns, animated **drag-to-reorder**, inline editing with **async commits**, pinning, grouping, and **virtualized** rendering for large datasets. The features other grids gate behind an Enterprise license -- clipboard, the fill handle, and a formula engine -- ship in Yable's MIT core. Use it with React today, or any framework through the vanilla renderer.

## Why Yable?

- **No paywall on the good stuff** -- clipboard copy/paste, the Excel-style fill handle, a formula engine, plus column pinning and resizing, all ship in the MIT-licensed core. AG Grid puts clipboard and the fill handle behind a $999/dev Enterprise license; MUI X puts pinning and resizing behind Pro. Yable charges $0.
- **Interactions that ship done** -- animated column drag-to-reorder (a floating ghost with the header and body sliding into place in lockstep), 3-state header sort, and inline editing with **async cell commits** (per-cell pending / error / conflict states, plus retry and dismiss) -- built in, not left as an app-level exercise.
- **Headless core + batteries-included UI** -- `@zvndev/yable-core` stays headless and zero-dependency, while `@zvndev/yable-react`, `@zvndev/yable-vanilla`, and `@zvndev/yable-themes` give you a finished, themed grid. You don't choose between control and convenience.
- **Spreadsheet-grade engine** -- a formula engine (17 built-in functions, extensible) with parser, evaluator, and dependency tracking, plus the Excel-style fill handle and rendered pivot tables -- all in the MIT core.
- **TypeScript from the ground up** -- deep key inference on accessors, fully typed state slices, and generic-safe column helpers.
- **Framework-agnostic** -- `@zvndev/yable-core` has zero (0) dependencies. `@zvndev/yable-react` and `@zvndev/yable-vanilla` are thin adapters.

## Comparison

Built-in feature snapshot. `DIY` means the library ships the engine/accessor, but you assemble the UI yourself.

| Feature                     |  Yable   | TanStack Table | AG Grid Community | AG Grid Enterprise |
| --------------------------- | :------: | :------------: | :---------------: | :----------------: |
| Sorting                     |   Yes    |      Yes       |        Yes        |        Yes         |
| Filtering (column + global) |   Yes    |      Yes       |        Yes        |        Yes         |
| Pagination                  |   Yes    |      Yes       |        Yes        |        Yes         |
| Cell editing                |   Yes    |      DIY       |        Yes        |        Yes         |
| Column pinning              |   Yes    |      Yes       |        Yes        |        Yes         |
| Column resizing             |   Yes    |      Yes       |        Yes        |        Yes         |
| Column drag-to-reorder      | Animated |      DIY       |       Basic       |       Basic        |
| Row selection               |   Yes    |      Yes       |        Yes        |        Yes         |
| Row grouping                |   Yes    |     Plugin     |        No         |        Yes         |
| Aggregation                 |   Yes    |     Plugin     |        No         |        Yes         |
| Pivot tables                |   DIY    |       No       |        No         |        Yes         |
| Formula engine              |   Yes    |       No       |        No         |        Yes         |
| Fill handle                 |   Yes    |       No       |        No         |        Yes         |
| Clipboard                   |   Yes    |       No       |        No         |        Yes         |
| Undo / Redo                 |   Yes    |       No       |        Yes        |        Yes         |
| Row virtualization          |   Yes    |      DIY       |        Yes        |        Yes         |
| Keyboard navigation         |   Yes    |       No       |        Yes        |        Yes         |
| Async cell commits          |   Yes    |       No       |        No         |         No         |
| Tree data                   |   Yes    |      Yes       |        No         |        Yes         |
| Export (CSV / JSON)         |   Yes    |       No       |        Yes        |        Yes         |
| Themes / design tokens      |   Yes    |       No       |        Yes        |        Yes         |
| React components            |   Yes    |       No       |        Yes        |        Yes         |
| Vanilla JS renderer         |   Yes    |       No       |        No         |         No         |
| MIT license                 |   Yes    |      Yes       |        Yes        |         No         |
| Price                       | **Free** |    **Free**    |     **Free**      |      **Paid**      |

## Installation

```bash
npm install @zvndev/yable-core @zvndev/yable-react @zvndev/yable-themes
```

Or with pnpm / yarn:

```bash
pnpm add @zvndev/yable-core @zvndev/yable-react @zvndev/yable-themes
yarn add @zvndev/yable-core @zvndev/yable-react @zvndev/yable-themes
```

## Quick Start

```tsx
import { createColumnHelper } from '@zvndev/yable-react'
import { useTable, Table, Pagination, GlobalFilter } from '@zvndev/yable-react'
import '@zvndev/yable-themes/default.css'

// 1. Define your data type
interface Person {
  name: string
  age: number
  email: string
}

// 2. Create a column helper
const columnHelper = createColumnHelper<Person>()

// 3. Define columns
const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    enableSorting: true,
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    enableSorting: true,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
  }),
]

// 4. Sample data
const data: Person[] = [
  { name: 'Alice', age: 32, email: 'alice@example.com' },
  { name: 'Bob', age: 27, email: 'bob@example.com' },
  { name: 'Charlie', age: 45, email: 'charlie@example.com' },
]

// 5. Build your table component
function MyTable() {
  const table = useTable({ data, columns })

  return (
    <Table table={table} striped stickyHeader>
      <Pagination table={table} />
    </Table>
  )
}
```

Click a column header to cycle sort (ascending -> descending -> unsorted); hold Shift to multi-sort; drag a header to reorder columns. See the [Quickstart Guide](./docs/QUICKSTART.md) for a step-by-step walkthrough including filtering, editing, drag-to-reorder, and theming.

## Packages

| Package                                       | Description                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@zvndev/yable-core`](./packages/core)       | Headless table engine -- sorting, filtering, editing, formulas, pivot, tree data, clipboard, and more. Zero dependencies.                                                      |
| [`@zvndev/yable-react`](./packages/react)     | React adapter -- `useTable` hook, `<Table>` component tree, form controls, pagination, global filter.                                                                          |
| [`@zvndev/yable-vanilla`](./packages/vanilla) | Vanilla JS/DOM renderer -- `renderTable()` and `renderPagination()` for non-framework use.                                                                                     |
| [`@zvndev/yable-themes`](./packages/themes)   | CSS design token system -- 8 built-in themes (default, stripe, compact, forest, midnight, rose, ocean, mono) with 100+ customizable CSS custom properties. Dark mode included. |

## Features

### Data Management

- Sorting -- single and multi-column, 6 built-in comparators, custom sort functions
- Filtering -- column filters, global search, 11 built-in filter functions, custom predicates
- Pagination -- client-side and server-side, configurable page sizes
- Server state -- same columns/table surface with manual sorting, filtering, pagination, cursor loading, and optimistic row updates via `useServerTable`
- Row grouping -- group rows by one or more columns with collapsible group headers and leaf counts, rendered turnkey through `<Table>`
- Aggregation -- 9 built-in aggregation functions (sum, min, max, mean, count, and more) that roll up automatically on group rows
- Tree data -- nested/hierarchical row support with expand/collapse

### Spreadsheet Features

- Cell editing -- text, number, select, checkbox, toggle, date, and custom editors with validation
- Formula engine -- 17 built-in functions (extensible), expression parser, dependency graph, circular reference detection
- Fill handle -- drag to auto-fill cells (like Excel)
- Clipboard -- copy/paste support
- Undo / Redo -- full edit history
- Async cell commits -- optimistic saves with pending, error, and conflict cell states, retry, and conflict resolution

### Layout & Interaction

- Column pinning -- freeze columns to left or right edges
- Column resizing -- drag-to-resize with onChange or onEnd modes
- Column ordering -- reorder columns programmatically
- Column visibility -- show/hide columns
- Row selection -- single, multi, and sub-row selection
- Row pinning -- pin rows to top or bottom
- Row expanding -- master/detail pattern with custom detail panels
- Pivot -- cross-tabulated row model via `getPivotRowModel()` and direct React `<Table>` rendering

### Export & Presentation

- Export -- CSV and JSON formats
- Themes -- design token system with light/dark mode and 100+ CSS custom properties
- Event system -- cell, row, header click/context menu events
- ARIA -- built-in accessibility attributes

## Documentation

- [Quickstart Guide](./docs/QUICKSTART.md) -- from zero to working table in 10 steps
- [Feature Documentation](./docs/FEATURES.md) -- detailed guide for every feature
- [API Reference](./docs/API.md) -- full reference for all public exports
- [Contributing Guide](./CONTRIBUTING.md) -- how to develop, test, and submit PRs

## Status

Yable is **pre-1.0** but already covers most production grid needs. Current npm line: `@zvndev/yable-core` at **0.6.0**, `@zvndev/yable-react` at **0.6.1**, `@zvndev/yable-themes` at **0.4.2**, and `@zvndev/yable-vanilla` at **0.3.4**. Turnkey row grouping with aggregated headers, animated column drag-to-reorder, 3-state sorting, row/column pinning, master/detail, pivots, formulas, fill handle, clipboard, async commits, row and column virtualization, set/floating filters, and the themed React/vanilla adapters are all shipping. The API may still change before a stable 1.0. Near-term focus:

- 1.0 API stabilization
- Expanded keyboard-navigation coverage
- A checked-in Playwright end-to-end suite

## License

MIT -- see [LICENSE](./LICENSE) for details.

## Contributing

We welcome contributions! See the [Contributing Guide](./CONTRIBUTING.md) to get started.
