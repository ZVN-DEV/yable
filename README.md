<p align="center">
  <strong>Yable</strong>
</p>

<h3 align="center">The open-source data table engine with spreadsheet-grade features</h3>

<p align="center">
  <!-- npm version -->
  <!-- license: MIT -->
  <!-- bundle size -->
  <!-- TypeScript -->
</p>

---

**TanStack's philosophy, AG Grid's features, neither's price tag.**

Yable is a TypeScript-first, framework-agnostic data table engine. It ships a headless core with sorting, filtering, editing, formulas, pivot tables, and more -- all MIT-licensed. Use it with React today, or wire it to any framework through the vanilla renderer.

## Why Yable?

- **Formula engine** -- 17 built-in spreadsheet functions (extensible) with a parser, evaluator, and dependency tracker. Free and MIT-licensed -- AG Grid's formula support requires an Enterprise license.
- **Async cell commits** -- built-in optimistic saves with pending, error, and conflict cell states. Retry, dismiss, and conflict resolution out of the box. No other React grid ships this.
- **Pivot tables, fill handle, clipboard, undo/redo** -- features that AG Grid locks behind a $1,000+/dev/year Enterprise license. Yable ships them for free under MIT.
- **Headless core + batteries-included UI** -- TanStack Table is headless but ships zero components. Yable gives you a headless `@zvndev/yable-core` *and* ready-to-use React components with styled themes.
- **TypeScript from the ground up** -- deep key inference on accessors, fully typed state slices, and generic-safe column helpers.
- **Framework-agnostic** -- `@zvndev/yable-core` has zero dependencies. `@zvndev/yable-react` and `@zvndev/yable-vanilla` are thin adapters.

## Comparison

| Feature | Yable | TanStack Table | AG Grid Community | AG Grid Enterprise |
|---|:---:|:---:|:---:|:---:|
| Sorting | Yes | Yes | Yes | Yes |
| Filtering (column + global) | Yes | Yes | Yes | Yes |
| Pagination | Yes | Yes | Yes | Yes |
| Cell editing | Yes | DIY | Yes | Yes |
| Column pinning | Yes | Yes | Yes | Yes |
| Column resizing | Yes | Yes | Yes | Yes |
| Row selection | Yes | Yes | Yes | Yes |
| Row grouping | Yes | Plugin | No | Yes |
| Aggregation | Yes | Plugin | No | Yes |
| Pivot tables | Yes | No | No | Yes |
| Formula engine | Yes | No | No | Yes |
| Fill handle | Yes | No | No | Yes |
| Clipboard | Yes | No | No | Yes |
| Undo / Redo | Yes | No | Yes | Yes |
| Async cell commits | Yes | No | No | No |
| Tree data | Yes | Yes | No | Yes |
| Export (CSV / JSON) | Yes | No | Yes | Yes |
| Themes / design tokens | Yes | No | Yes | Yes |
| React components | Yes | No | Yes | Yes |
| Vanilla JS renderer | Yes | No | No | No |
| MIT license | Yes | Yes | Yes | No |
| Price | **Free** | **Free** | **Free** | **$1,000+/dev/yr** |

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
import '@zvndev/yable-themes'

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

Click a column header to sort. Hold Shift to multi-sort. See the [Quickstart Guide](./docs/QUICKSTART.md) for a step-by-step walkthrough including filtering, editing, and theming.

## Packages

| Package | Description |
|---|---|
| [`@zvndev/yable-core`](./packages/core) | Headless table engine -- sorting, filtering, editing, formulas, pivot, tree data, clipboard, and more. Zero dependencies. |
| [`@zvndev/yable-react`](./packages/react) | React adapter -- `useTable` hook, `<Table>` component tree, form controls, pagination, global filter. |
| [`@zvndev/yable-vanilla`](./packages/vanilla) | Vanilla JS/DOM renderer -- `renderTable()` and `renderPagination()` for non-framework use. |
| [`@zvndev/yable-themes`](./packages/themes) | CSS design token system -- 8 built-in themes (default, stripe, compact, forest, midnight, rose, ocean, mono) with 100+ customizable CSS custom properties. Dark mode included. |

## Features

### Data Management
- Sorting -- single and multi-column, 6 built-in comparators, custom sort functions
- Filtering -- column filters, global search, 11 built-in filter functions, custom predicates
- Pagination -- client-side and server-side, configurable page sizes
- Grouping -- row grouping by any column with 9 built-in aggregation functions
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
- Pivot tables -- transform flat data into cross-tabulated views

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

Yable is in **early alpha** (v0.1.0). The core API is taking shape but may still change. We are actively working on:

- Virtualization polish and benchmarking for large datasets (10k+ rows)
- Server-side data source adapters
- Storybook examples and interactive docs

## License

MIT -- see [LICENSE](./LICENSE) for details.

## Contributing

We welcome contributions! See the [Contributing Guide](./CONTRIBUTING.md) to get started.
