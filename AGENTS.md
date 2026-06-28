# Yable — Agent Instructions

## What This Is

Yable is a TypeScript-first, framework-agnostic data table engine. Monorepo with 4 packages:

- `@zvndev/yable-core` — Headless table logic (sorting, filtering, editing, formulas, pivot, tree data, clipboard, fill handle, undo/redo, keyboard navigation). Zero runtime deps.
- `@zvndev/yable-react` — 28 React components + 14 hooks. Uses `@zvndev/yable-core` under the hood.
- `@zvndev/yable-vanilla` — Vanilla JS DOM renderer.
- `@zvndev/yable-themes` — 8 CSS themes with 100+ design tokens. Pure CSS, no JS.

## Build & Test

```bash
pnpm install
pnpm build        # builds all 4 packages (ESM + CJS + DTS)
pnpm test         # runs vitest — 580 tests across 27 files
```

Demo: `pnpm dev --filter @zvndev/yable-react-demo` (Next.js on localhost, port varies)

## Architecture

```
packages/core/src/
  core/table.ts        — Main engine (createTable). ~1300 LOC. Uses `any` internally, typed on return.
  core/column.ts       — Column model. getSortingFn/getFilterFn wired to column defs.
  core/row.ts          — Row model with getValue, try-catch on accessorFn.
  core/cell.ts         — Cell context.
  core/headers.ts      — Header groups.
  core/resolvers.ts    — Sort/filter function resolvers (avoids circular imports).
  types.ts             — All type definitions. 1400+ LOC. The source of truth.
  features/            — Isolated feature modules (formulas/, pivot.ts, treeData.ts, etc.)
  i18n/                — Locale system (en.ts + locales.ts)

packages/react/src/
  useTable.ts          — Main hook. Creates table instance, manages state, cleanup.
  hooks/               — useVirtualization, useClipboard, useFillHandle, useRowDrag, etc.
  components/          — Table, TableBody, TableHeader, TableCell, Pagination, GlobalFilter, etc.

packages/themes/src/
  tokens.css           — Design token defaults (light + dark mode)
  base.css             — Structural CSS (2700+ LOC)
  utilities.css        — Modifier classes, responsive, print, animations
  themes/              — 8 theme files (midnight, ocean, rose, forest, mono, etc.)
```

## What's Done (don't redo)

- Core engine with 16+ working features
- Row virtualization (useVirtualization hook)
- Keyboard navigation (useKeyboardNavigation hook, arrow keys / Tab / F2 / Enter / Escape)
- React.memo on table rows with custom comparator
- ErrorBoundary + CellErrorBoundary
- Security: CSS injection fixed, theme validation, renderer hardening
- 580 tests across 27 files (formulas, pivot, tree data, clipboard, undo/redo, keyboard nav, edge cases)
- Documentation: README, QUICKSTART, FEATURES, API, async-commits, errors, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG
- Multi-config CI (Node 20/22), changesets-based release workflow, pre-commit hooks, bundle size tracking
- Production error codes E001–E020 documented in `docs/errors.md`
- 8 polished themes with light + dark variants
- 28 React components with SVG icons, accessibility, animations

## What Needs Building (priority order)

The engine and React adapter now cover most production grid needs: sorting, filtering
(incl. floating + set filters), pagination, cell editing with async commits, column
pinning/resizing/visibility, animated drag-to-reorder, row + column virtualization,
range selection, formulas, pivot accessor, fill handle, undo/redo, tree data, clipboard,
and export. Current focus:

### 1. Turnkey row grouping + aggregation render (P0)

- Group-row construction from `state.grouping` plus a `TableBody` pass that walks
  `subRows`, so grouped/aggregated rows render through `<Table>` (the aggregation fns
  and column API exist; the body renderer only walks top-level rows today)

### 2. Pivot rendered through `<Table>` (P1)

- `table.getPivotRowModel()` returns the pivot row model; swap in the dynamic pivot
  column defs from `generatePivotColumnDefs` so a pivot renders via `<Table>`, not just
  programmatically

### 3. Tree data with concurrent filter/sort (P1)

- Tree flattening runs before filter/sort today; make filter/sort preserve parent chains

### 4. 1.0 API stabilization + e2e (P1)

- Lock the public API; add a checked-in Playwright e2e suite (drag slide, virtualization,
  header/body width sync) and expand keyboard-navigation integration tests

## Code Patterns to Follow

- **Core features** go in `packages/core/src/features/` as standalone modules
- **React hooks** go in `packages/react/src/hooks/`
- **React components** go in `packages/react/src/components/`
- **Types** are defined in `packages/core/src/types.ts`, exported from `packages/core/src/index.ts`
- **CSS classes** use `yable-` prefix, reference `--yable-*` custom properties
- **Tests** go in `__tests__/` directories next to the source, use Vitest
- Use `as any` sparingly — only in table.ts for the incremental builder pattern
- Wrap user-provided callbacks in try-catch (see table.ts for the pattern)
- Export new types from `packages/core/src/index.ts`
- Export new components/hooks from `packages/react/src/index.ts`

## Don't Touch

- Security sanitization functions in `createTheme.ts`, `renderer.ts`, `FlashCell.tsx` — audited and correct
- The `table: any` pattern in `table.ts` — intentional, typed on return
- CSS custom property names — they're the public API
- Existing test files — add new ones, don't modify passing tests
