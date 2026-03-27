# Sprint Plan — Yable Table Library

Generated: 2026-03-27
Based on: AUDIT-REPORT.md (7.5/10 prototype, 3/10 product)

## Sprint Goal

Take Yable from 3/10 product to 7+/10 by adding virtualization, comprehensive tests, React performance optimization, security hardening, and documentation — making it publishable to npm as a credible alpha.

## Success Criteria

- [ ] Row virtualization works with 10k+ rows
- [ ] All P0 security findings resolved (H1, H2, H3)
- [ ] Test coverage > 70% on @yable/core (from ~20%)
- [ ] React re-render optimized (React.memo, Map lookup, Error Boundary)
- [ ] README + quickstart documentation exists
- [ ] `pnpm build` passes clean across all packages
- [ ] Formula engine, pivot tables, tree data all have test suites

## Dev Tracks

---

### Track 1: Core Engine Hardening — Type Safety, Error Handling, Performance

**Agent specialty:** Core TypeScript engine work
**Files touched:**
- `packages/core/src/core/table.ts`
- `packages/core/src/core/column.ts`
- `packages/core/src/core/cell.ts`
- `packages/core/src/core/row.ts`
- `packages/core/src/core/headers.ts`
- `packages/core/src/types.ts`
- `packages/core/src/utils.ts`
- `packages/core/src/index.ts`
- `packages/core/src/i18n/en.ts`
- `packages/core/src/i18n/locales.ts`
- `packages/core/src/events/EventEmitter.ts`
- `packages/core/src/sortingFns.ts`
- `packages/core/src/filterFns.ts`
- `packages/core/src/aggregationFns.ts`
- `packages/core/src/columnHelper.ts`
- `packages/core/src/features/formulas/evaluator.ts`
- `packages/core/src/features/formulas/parser.ts`
- `packages/core/src/features/formulas/functions.ts`
- `packages/core/src/features/formulas/engine.ts`
- `packages/core/src/features/formulas/cellRef.ts`
- `packages/core/src/features/rowSpanning.ts`
- `packages/core/src/features/pivot.ts`
- `packages/core/src/features/treeData.ts`
- `packages/core/src/features/clipboard.ts`
- `packages/core/src/features/fillHandle.ts`
- `packages/core/src/features/undoRedo.ts`
- `packages/core/src/features/rowDragging.ts`
- `packages/core/src/features/fullRowEditing.ts`
- `packages/core/src/features/cellFlash.ts`
- `packages/core/tsup.config.ts` (if needed for new entry points)

**Tasks:**

- [ ] T1-01 (P0): Replace `getColumn(id)` linear scan with O(1) Map lookup in table.ts
- [ ] T1-02 (P0): Fix `editing: null as any` crash risk — initialize with proper default state
- [ ] T1-03 (P1): Reduce `as any` casts — fix column.ts (20 casts), table.ts (35 casts), cell.ts, row.ts. Target: <20 total remaining across core
- [ ] T1-04 (P1): Wire custom sortFn/filterFn from column defs through getSortingFn()/getFilterFn() — currently return `undefined as any` and custom fns are never called
- [ ] T1-05 (P1): Add data validation guards — handle `data: undefined/null`, `columns: []`, invalid column IDs in sort/filter state
- [ ] T1-06 (P1): Wire i18n locale strings into core engine — table should read from getDefaultLocale() instead of hardcoded strings
- [ ] T1-07 (P2): Add formula depth limit (max 100) in parser and evaluator to prevent stack overflow
- [ ] T1-08 (P2): Add `flattenArgs` recursion depth limit (max 50) in formula functions
- [ ] T1-09 (P2): Wrap user-provided callbacks (rowSpanFn, filterFn, sortFn, accessorFn) in try-catch with meaningful errors
- [ ] T1-10 (P2): Add `maxRows` warning — console.warn when dataset > 10k rows without virtualization enabled
- [ ] T1-11 (P2): Clean up dead `TableFeature` plugin architecture (remove _features from types if unused, or wire it up properly)

---

### Track 2: React Virtualization + Performance

**Agent specialty:** React rendering, hooks, performance
**Files touched:**
- `packages/react/src/useTable.ts`
- `packages/react/src/components/Table.tsx`
- `packages/react/src/components/TableBody.tsx`
- `packages/react/src/components/TableCell.tsx`
- `packages/react/src/components/TableHeader.tsx`
- `packages/react/src/components/TableFooter.tsx`
- `packages/react/src/types.ts`
- `packages/react/src/context.ts`
- `packages/react/src/index.ts`
- NEW: `packages/react/src/hooks/useVirtualization.ts`
- NEW: `packages/react/src/components/ErrorBoundary.tsx`

**Tasks:**

- [ ] T2-01 (P0): Implement row virtualization — useVirtualization hook that calculates visible rows based on scroll position, row height, and container height. Render only visible rows + overscan buffer. Support fixed and variable row heights.
- [ ] T2-02 (P0): Integrate virtualization into TableBody — when `enableVirtualization` is true, use virtual row window instead of rendering all rows. Add scroll container with proper total height spacer.
- [ ] T2-03 (P1): Add React.memo to TableRow and cell-level components in TableBody.tsx — prevent re-render when row data hasn't changed
- [ ] T2-04 (P1): Add useCallback to event handlers in TableBody.tsx (handleClick, handleDoubleClick, handleDragStart etc.)
- [ ] T2-05 (P1): Add ErrorBoundary component that catches render errors in cells/rows without crashing the whole table — show fallback UI per-cell
- [ ] T2-06 (P1): Clean up EventEmitter listeners in useTable on unmount — add useEffect cleanup
- [ ] T2-07 (P2): Optimize useTable — prevent resolvedOptions recomputation every render by memoizing options object properly
- [ ] T2-08 (P2): Export ErrorBoundary and useVirtualization from package index

---

### Track 3: Security Hardening

**Agent specialty:** Security, input validation, XSS prevention
**Files touched:**
- `packages/themes/src/createTheme.ts`
- `packages/react/src/hooks/usePrintLayout.ts`
- `packages/react/src/components/FlashCell.tsx`
- `packages/vanilla/src/renderer.ts`
- `packages/vanilla/src/createTableDOM.ts`
- `packages/vanilla/src/events.ts`
- `packages/vanilla/src/index.ts`

**Tasks:**

- [ ] T3-01 (P0-H1): Fix CSS injection in createTheme() — sanitize token values by stripping/escaping semicolons, curly braces, `url()`, `@import`, `expression()` before CSS interpolation
- [ ] T3-02 (P0-H2): Fix CSS injection in usePrintLayout — validate additionalCSS parameter, add documentation warning that it must be developer-provided only
- [ ] T3-03 (P0-H3): Harden vanilla renderer — audit all innerHTML paths, ensure esc() is called on every user-data insertion, add comment markers for security-sensitive sections
- [ ] T3-04 (P1-M1): Validate theme names — restrict to `/^[a-zA-Z0-9_-]+$/`, throw on invalid names in createTheme(), switchTheme(), removeTheme()
- [ ] T3-05 (P1-L1): Escape row.id and column.id in vanilla renderer data-attributes
- [ ] T3-06 (P2-L2): Validate FlashCell color props — restrict to CSS color formats (hex, rgb, hsl, named colors), reject values containing `url()` or `expression()`

---

### Track 4: Comprehensive Test Suite

**Agent specialty:** Testing, edge cases, coverage
**Files touched (ALL NEW FILES — no source modifications):**
- NEW: `packages/core/src/features/__tests__/formulas.test.ts`
- NEW: `packages/core/src/features/__tests__/pivot.test.ts`
- NEW: `packages/core/src/features/__tests__/treeData.test.ts`
- NEW: `packages/core/src/features/__tests__/clipboard.test.ts`
- NEW: `packages/core/src/features/__tests__/fillHandle.test.ts`
- NEW: `packages/core/src/features/__tests__/undoRedo.test.ts`
- NEW: `packages/core/src/features/__tests__/rowSpanning.test.ts`
- NEW: `packages/core/src/features/__tests__/rowDragging.test.ts`
- NEW: `packages/core/src/features/__tests__/fullRowEditing.test.ts`
- NEW: `packages/core/src/features/__tests__/cellFlash.test.ts`
- NEW: `packages/core/src/core/__tests__/column.test.ts`
- NEW: `packages/core/src/core/__tests__/headers.test.ts`
- NEW: `packages/core/src/core/__tests__/row.test.ts`
- NEW: `packages/core/src/core/__tests__/cell.test.ts`

**Tasks:**

- [ ] T4-01 (P0): Formula engine tests — tokenizer, parser (operator precedence, nested expressions), evaluator (all operators), cell references (A1, ranges), circular reference detection, error handling. Target: 40+ test cases
- [ ] T4-02 (P0): Formula built-in functions tests — test all 80+ functions (SUM, AVERAGE, IF, VLOOKUP, DATE, TEXT functions etc.) with edge cases (empty arrays, type mismatches, division by zero)
- [ ] T4-03 (P0): Pivot table tests — basic pivot, row/column subtotals, grand totals, multiple value fields, empty data, single-value pivot. Target: 15+ test cases
- [ ] T4-04 (P0): Tree data tests — buildTreeFromPaths, flattenTree, filterTreeData (preserving hierarchy), sortTreeData, aggregateTreeValues. Target: 15+ test cases
- [ ] T4-05 (P1): Clipboard tests — serializeCells (TSV format), parseClipboardText, copy/paste round-trip, empty cells, special characters in values. Target: 10+ test cases
- [ ] T4-06 (P1): Fill handle tests — pattern detection (linear sequence, geometric, repeating), direction (down, right), edge cases (single cell, mixed types). Target: 10+ test cases
- [ ] T4-07 (P1): Undo/redo tests — push/undo/redo, max stack size, clearHistory, multiple operations, undo past stack. Target: 10+ test cases
- [ ] T4-08 (P1): Row spanning tests — basic span, edge cases (span exceeding row count), span map computation. Target: 8+ test cases
- [ ] T4-09 (P1): Row dragging tests — moveRow reorder logic, edge cases (move to same position, first/last). Target: 6+ test cases
- [ ] T4-10 (P1): Full row editing tests — start/commit/cancel edit, validation, pending values. Target: 8+ test cases
- [ ] T4-11 (P2): Cell flash tests — detect changes, flash state management. Target: 5+ test cases
- [ ] T4-12 (P2): Column model tests — createColumn, getSortingFn, getFilterFn, visibility, pinning. Target: 10+ test cases
- [ ] T4-13 (P2): Edge case tests across core — empty data, null values, undefined columns, concurrent state mutations, extreme page sizes

---

### Track 5: Documentation + README

**Agent specialty:** Technical writing, developer experience
**Files touched (ALL NEW FILES):**
- NEW: `README.md` (project root)
- NEW: `packages/core/README.md`
- NEW: `packages/react/README.md`
- NEW: `packages/vanilla/README.md`
- NEW: `packages/themes/README.md`
- NEW: `CONTRIBUTING.md`
- NEW: `docs/QUICKSTART.md`
- NEW: `docs/API.md`
- NEW: `docs/FEATURES.md`

**Tasks:**

- [ ] T5-01 (P1): Root README.md — project overview, feature highlights (with the differentiators: formula engine, pivot, fill handle, free MIT), installation, quickstart code example (create table → render → sort → edit), package overview, comparison table vs competitors, license
- [ ] T5-02 (P1): Package READMEs — @yable/core (API reference with key types and functions), @yable/react (component list with props, hook signatures), @yable/vanilla (basic usage), @yable/themes (theme list with screenshots description, createTheme API)
- [ ] T5-03 (P1): Quickstart guide — step-by-step from `npm install` to a working table with sorting, filtering, editing in under 5 minutes
- [ ] T5-04 (P2): Feature documentation — one section per major feature (formulas, pivot, tree data, clipboard, fill handle, undo/redo) with code examples
- [ ] T5-05 (P2): API reference — document all public exports from @yable/core with types, descriptions, and examples
- [ ] T5-06 (P2): CONTRIBUTING.md — how to set up dev environment, run tests, add features, code style guide

---

## File Ownership Matrix (No Conflicts)

| Package/Path | Track 1 | Track 2 | Track 3 | Track 4 | Track 5 |
|---|---|---|---|---|---|
| `packages/core/src/core/*.ts` | OWN | - | - | - | - |
| `packages/core/src/features/*.ts` | OWN | - | - | - | - |
| `packages/core/src/types.ts` | OWN | - | - | - | - |
| `packages/core/src/utils.ts` | OWN | - | - | - | - |
| `packages/core/src/i18n/*.ts` | OWN | - | - | - | - |
| `packages/core/src/index.ts` | OWN | - | - | - | - |
| `packages/react/src/useTable.ts` | - | OWN | - | - | - |
| `packages/react/src/components/Table*.tsx` | - | OWN | - | - | - |
| `packages/react/src/components/TableFooter.tsx` | - | OWN | - | - | - |
| `packages/react/src/types.ts` | - | OWN | - | - | - |
| `packages/react/src/context.ts` | - | OWN | - | - | - |
| `packages/react/src/index.ts` | - | OWN | - | - | - |
| `packages/themes/src/createTheme.ts` | - | - | OWN | - | - |
| `packages/react/src/hooks/usePrintLayout.ts` | - | - | OWN | - | - |
| `packages/react/src/components/FlashCell.tsx` | - | - | OWN | - | - |
| `packages/vanilla/src/*` | - | - | OWN | - | - |
| `packages/core/src/**/__tests__/*` (NEW) | - | - | - | OWN | - |
| `README.md`, `docs/*`, `CONTRIBUTING.md` (NEW) | - | - | - | - | OWN |
| `packages/*/README.md` (NEW) | - | - | - | - | OWN |

**Zero file conflicts between tracks.**

## Summary

| Priority | Count | Tracks |
|----------|-------|--------|
| P0 | 12 tasks | T1 (2), T2 (2), T3 (3), T4 (4), T5 (0) |
| P1 | 19 tasks | T1 (4), T2 (4), T3 (2), T4 (5), T5 (3) |
| P2 | 12 tasks | T1 (4), T2 (2), T3 (1), T4 (3), T5 (2) |
| **Total** | **43 tasks** | **5 tracks** |

## Intentionally Skipped

- **Keyboard navigation** — Full feature, not a fix. Sprint focuses on making existing code production-quality.
- **Cell range selection** — Same reasoning. New feature, not hardening.
- **Server-side row models** — Complex feature requiring API design decisions. Post-sprint.
- **Excel/CSV export** — Nice-to-have, not required for alpha.
- **Vue/Svelte adapters** — Focus on React quality before expanding frameworks.
