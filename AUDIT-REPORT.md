# Yable -- Critical Product Review

*Conducted 2026-03-26. Brutally honest, investor-grade assessment.*

---

## 1. What Is It?

Yable is a TypeScript-first, framework-agnostic data table engine distributed as a monorepo of 4 packages: `@yable/core` (headless logic), `@yable/react` (React components + hooks), `@yable/vanilla` (DOM renderer), and `@yable/themes` (CSS design token system with 8 themes). It ships 21,439 lines of code across 31 core source files. Version 0.1.0. Not deployed, not published to npm, zero users. Built in a single sprint using parallel AI agents, modeled after AG Grid's feature surface and TanStack Table's architecture.

---

## 2. Is It Real?

**Yes -- substantially more real than most v0.1.0 libraries.** This is not a weekend prototype or a TODO-list-with-aspirations. The core engine has working implementations of genuinely complex features:

| Feature | Status | Complexity |
|---------|--------|------------|
| Sorting (multi-column, custom fns) | Working | Standard |
| Filtering (global + per-column, 12 built-in fns) | Working | Standard |
| Pagination (client + manual server mode) | Working | Standard |
| Cell editing (6 types, validation, parse/format) | Working | Medium |
| Column pinning (left/right, CSS sticky) | Working | Medium |
| Column grouping (multi-level headers) | Working | Medium |
| Column visibility/sizing/resize | Working | Standard |
| Row selection (single/multi) | Working | Standard |
| Aggregation (sum, avg, count, min, max, median) | Working | Medium |
| Undo/redo (configurable stack, events) | Working | Medium |
| Clipboard (copy/cut/paste, TSV format) | Working | Medium |
| Fill handle (pattern detection: linear, geometric) | Working | Hard |
| Formula engine (parser, evaluator, 80+ functions, circular ref detection) | Working | Very Hard |
| Tree data (hierarchical, expand/collapse, aggregation) | Working | Hard |
| Pivot tables (cross-tabs, subtotals, dynamic columns) | Working | Very Hard |
| Row spanning (computed span maps) | Working | Medium |
| Row dragging (reorder, drop indicator) | Working | Medium |
| Full row editing (edit entire rows, validation) | Working | Medium |
| Cell flash (change detection animation) | Working | Medium |
| i18n framework (English, custom locale creation) | Partial | Medium |
| 8 CSS themes (midnight, ocean, rose, forest, mono...) | Working | Medium |
| React components (26 components, 12 hooks) | Working | High |
| Vanilla JS renderer | Basic | Low |

**What's NOT built yet (planned but zero code):**
- Keyboard navigation (arrow keys, F2, Tab/Shift+Tab)
- Cell range selection (click-drag rectangular ranges)
- Column auto-size (fit-to-content)
- Row/column virtualization
- Server-side row models
- Excel/CSV export
- Floating filters
- State persistence

**Can someone use it today?** Technically yes -- the build system works, types are generated, ESM + CJS dual output. But it's not published to npm, there's no documentation, no README, and no examples that a human could follow. You'd need to clone the repo, read the source, and figure it out yourself.

**Tests?** One file. 817 lines. Covers core table operations. ~80% of the codebase -- all 14 feature modules, the entire React package, the vanilla renderer -- has zero test coverage.

**Verdict: Real code, real features, real architecture. Not yet a real product.**

---

## 3. Is It Offering Something Unique?

### What's genuinely differentiated

**1. Spreadsheet features in an MIT library.** No free/MIT table library ships a formula engine, fill handle, clipboard, AND undo/redo together. AG Grid charges $995+/dev/year for clipboard alone. Handsontable charges $899+/dev/year. Yable has all of these at zero cost. The formula engine is the standout -- 1,417 LOC with a proper tokenizer, AST parser, recursive evaluator, dependency tracking, and circular reference detection. This is not a toy.

**2. Pivot tables without a paywall.** AG Grid gates pivot behind Enterprise ($$$). MUI DataGrid gates it behind Premium ($399/dev/year). No MIT-licensed table library has a working pivot engine. Yable does -- cross-tabulation with row/column subtotals, grand totals, and expandable groups. 497 LOC of real logic.

**3. Headless core with batteries-included UI.** This is the structural differentiator. TanStack Table is headless but ships zero UI -- you build everything from scratch. AG Grid ships full UI but is monolithic and opinionated. Yable's architecture (`@yable/core` + `@yable/react` + `@yable/vanilla` + `@yable/themes`) means you can use the headless core with your own UI, or use the provided React components, or use the vanilla renderer. Nobody else does this.

**4. CSS design token theming that works with any framework.** 8 pre-built themes using CSS custom properties. `createTheme()` API for custom themes. Not locked to Material UI, not locked to any framework. Clean, framework-agnostic approach.

### What's NOT differentiated

- Sorting, filtering, pagination -- every table library does this
- Column pinning/visibility/sizing -- table stakes since 2020
- Row selection -- basic expectation
- Cell editing -- AG Grid, Handsontable, React Data Grid all do this
- Tree data -- AG Grid, Tabulator both have this
- Row grouping + aggregation -- AG Grid does this better
- React components -- dozens of React table components exist

**Differentiation verdict: The formula engine, pivot tables, fill handle, and undo/redo in an MIT-licensed, headless-first library is genuinely novel. Everything else is table stakes executed competently but unremarkably.**

---

## 4. Would People Use It? For What?

### Realistic target users

**1. Teams building internal tools / admin panels who need spreadsheet-like features but can't justify AG Grid's price.** This is the primary market. A 5-developer team building an internal CRM with editable tables, formulas, and pivot views would pay $5,000-$10,000/year for AG Grid Enterprise. Yable gives them the same features for free.

**2. Developers currently using TanStack Table who are tired of building everything from scratch.** The #1 complaint about TanStack Table (27.8k stars, 10M weekly downloads) is "I chose headless for flexibility and spent 3 months building what AG Grid gives for free." A headless library that ships real, working features out of the box directly addresses this pain.

**3. Open-source projects that need rich table functionality without commercial license restrictions.** Any OSS project that needs pivot, clipboard, or formulas is currently stuck -- AG Grid Community doesn't include these, and Handsontable's license prohibits commercial use without paying.

**4. Indie developers and startups building data-heavy MVPs.** People who need something that looks professional quickly -- the 8 pre-built themes and React components mean you can have a working, styled data table in minutes rather than weeks.

### Who would NOT use it

- **Enterprise teams with AG Grid budgets** -- they'll stick with AG Grid for the ecosystem, support contracts, and proven track record
- **Teams that need millions of rows** -- no virtualization means Yable chokes on large datasets. Glide Data Grid or AG Grid wins here
- **Teams deeply invested in TanStack ecosystem** -- TanStack Virtual + TanStack Table is a proven combo
- **Teams that need server-side row models today** -- not built yet
- **Anyone who needs guaranteed support/SLA** -- no company, no team, no support

**Market assessment: The addressable market is teams who need more than TanStack Table but less than AG Grid's price tag -- a real and underserved segment, but one that requires virtualization and documentation to actually capture.**

---

## 5. Security Audit

### CRITICAL -- None

No `eval()`, `new Function()`, or dynamic code execution. No server-side concerns (purely client-side). No authentication logic to break. Zero runtime dependencies in core/vanilla/themes. The attack surface is small.

### HIGH

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| H1 | **CSS injection via `createTheme()`** -- Token values interpolated into CSS strings with zero sanitization. Malicious value like `red; } body { display: none } .evil {` breaks out of the CSS rule. | `packages/themes/src/createTheme.ts:130-160` | Arbitrary CSS injection: data exfiltration via `url()`, phishing overlay, content hiding |
| H2 | **CSS injection via `usePrintLayout`** -- `additionalCSS` option injected directly as `<style>` textContent | `packages/react/src/hooks/usePrintLayout.ts:37-40` | Full CSS injection if value comes from untrusted source |
| H3 | **Vanilla renderer innerHTML pattern** -- Entire table built as HTML string and assigned via `innerHTML`. The `esc()` function is applied correctly at all current insertion points, but the pattern is inherently fragile. Any future code path that forgets `esc()` creates XSS. | `packages/vanilla/src/createTableDOM.ts:155` | Structural XSS risk: safe today, one missed escape away from exploitable |

### MEDIUM

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| M1 | **Theme name injection** -- Name interpolated into CSS selectors and `document.querySelector()` without validation | `packages/themes/src/createTheme.ts:147,180` | Selector escape, unexpected behavior |
| M2 | **No input validation on column definitions** -- No max depth guard in `getDeepValue()` for deeply nested accessor keys | `packages/core/src/utils.ts:69-80` | Performance DoS with crafted input |
| M3 | **Unbounded row model operations** -- Filter/sort/pagination pipeline operates on full dataset with no row count limits | `packages/core/src/core/table.ts:826-946` | Browser tab freeze with large datasets |
| M4 | **Formula recursion depth unlimited** -- Deeply nested formulas can stack-overflow the evaluator | `packages/core/src/features/formulas/evaluator.ts:32-76` | Crash via crafted formula |
| M5 | **`flattenArgs` unbounded recursion** in formula functions | `packages/core/src/features/formulas/functions.ts:255-267` | Stack overflow with nested arrays |
| M6 | **`rowSpan` callback runs uncaught** -- No try-catch around user-provided rowSpanFn | `packages/core/src/features/rowSpanning.ts:67-88` | Unhandled exception crashes table |

### LOW

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| L1 | Row IDs used in vanilla data-attributes without escaping | `packages/vanilla/src/renderer.ts:169` | Attribute breakout if ID contains `"` |
| L2 | `FlashCell` color props accept arbitrary CSS values (could include `url()`) | `packages/react/src/components/FlashCell.tsx:41-47` | Theoretical exfiltration via CSS |
| L3 | `useTable` never cleans up EventEmitter listeners on unmount | `packages/react/src/useTable.ts:87-100` | Minor memory leak on mount/unmount cycles |

### Positive findings

- React components use JSX exclusively -- no `dangerouslySetInnerHTML` anywhere
- Vanilla `esc()` function correctly escapes `&`, `<`, `>`, `"`, `'` at all current insertion points
- Formula engine has proper circular reference detection via DFS
- Zero third-party runtime dependencies in core/vanilla/themes
- No prototype pollution vectors found
- No ReDoS-vulnerable regex patterns found

**Security verdict: No critical vulnerabilities. The library is safe for use with trusted data from trusted developers. The CSS injection in `createTheme()` is the most actionable fix -- validate/sanitize theme token values before interpolation. The vanilla innerHTML pattern should be documented as a security-sensitive area for contributors.**

---

## 6. Engineering Quality

### What's good

**Architecture.** The 4-package monorepo is clean and well-separated. `@yable/core` has zero runtime dependencies. The headless core / UI adapter pattern is proven (TanStack pioneered it). Feature modules are properly isolated in `/features/`. The event system is typed. Build output is correct (ESM + CJS + DTS + sourcemaps).

**Build system.** tsup + Turborepo + pnpm workspaces. Multiple entry points for tree-shaking. Proper `exports` map in package.json with conditional `import`/`require` entries. TypeScript strict mode. This is done right.

**Formula engine.** 1,417 LOC of genuine computer science. Proper tokenizer → AST parser → recursive evaluator. 80+ built-in functions. Cell reference resolution. Dependency tracking. Circular reference detection. This is the single most impressive piece of the codebase.

**Memoization.** The `memo()` utility (modeled after TanStack's) is used throughout the row model pipeline. Column processing, visible columns, header groups, filtered/sorted/paginated rows are all memoized with shallow reference comparison. Correct approach.

**CSS theme system.** 8 distinct themes using CSS custom properties. Design tokens for colors, spacing, borders, typography. Utility classes for modifiers. RTL support. `createTheme()` API. This is genuinely well-designed.

### What's bad

**Testing: catastrophic gap.** One test file (817 LOC). ~20% code coverage. Zero tests for: all 14 feature modules (formulas, pivot, tree data, clipboard, fill handle, undo/redo, row dragging, full row editing, row spanning, cell flash), the entire React package (zero component tests, zero hook tests), vanilla renderer, column model, header model, i18n system, theme system. For an open-source library people would use in production, this is a dealbreaker.

**TypeScript: 120 `as any` casts.** For a library that claims TypeScript-first design, this is bad. Key offenders:
- `column.ts` has 20 `as any` casts -- nearly every access to `columnDef` properties bypasses type safety
- `table.ts` has 35 `as any` casts -- `makeStateUpdater` calls pass `{} as any` as instance parameters
- `cell.ts` accesses `meta?.alwaysEditable` and `rowSpan` via `(column.columnDef as any)`
- `getSortingFn()` and `getFilterFn()` on Column return `undefined as any` -- custom sort/filter functions from column defs are never actually wired through these methods
- Initial state has `editing: null as any` -- will crash if anything touches `editing.pendingValues` before initialization

**Performance: no virtualization, full re-render on every state change.**
- `TableBody.tsx` renders ALL rows with `rows.map(...)`. 10,000 rows = 10,000 DOM elements.
- `useTable` uses `useState` with no granular subscriptions. Every state change (sorting, filtering, editing one cell) re-renders the entire component tree.
- No `React.memo` on row/cell components. Every table re-render re-renders every visible row and cell.
- `getColumn(id)` is a linear scan called inside filter and sort loops. Should be an O(1) Map lookup.
- Global filter runs O(n * columns) string operations per keystroke with no built-in debounce.

**Error handling: nearly nonexistent.**
- `row.getValue()` silently returns `undefined as any` for invalid column IDs. No error, no warning.
- `data: undefined` or `data: null` crashes at `table.ts:803` with no guard.
- Only one place in the entire core throws an error (`getRow` when row not found).
- No error boundaries in React components -- a bad cell renderer crashes the entire table.

**Documentation: zero.**
- No README.md
- No JSDoc on any public API method
- No API reference
- No usage examples (that are documented)
- No contribution guide

**Dead architecture: `TableFeature` plugin system.** The types define a `TableFeature` interface and `_features` array on TableOptions, but `createTable()` never uses them. Features are hardcoded imports. The plugin architecture is aspirational dead code.

**i18n: unconnected.** The locale system defines 50+ strings but React components hardcode strings like `emptyMessage = 'No data'` instead of reading from the locale.

---

## 7. Competitive Reality Check

| Capability | Yable (MIT, free) | TanStack Table (MIT, free) | AG Grid Community (MIT, free) | AG Grid Enterprise (~$1K/dev/yr) | React Data Grid (MIT, free) | Tabulator (MIT, free) |
|---|---|---|---|---|---|---|
| **Headless core** | Yes | Yes | No | No | No | No |
| **React components** | 26 components | None (DIY) | Full | Full | Full | Wrapper |
| **Vanilla JS** | Basic renderer | None | Full | Full | None | Full |
| **Vue/Svelte/Angular** | Not yet | Yes (6 fws) | Yes (4 fws) | Yes (4 fws) | No | Wrappers |
| **Sorting** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Filtering** | Yes | Yes | Yes | Yes | Limited | Yes |
| **Pagination** | Yes | Yes | Yes | Yes | No | Yes |
| **Cell editing** | Yes (6 types) | No (DIY) | Yes | Yes | Yes | Yes |
| **Row grouping** | Yes | Yes | No | Yes ($) | Yes | Yes |
| **Pivot tables** | Yes | No | No | Yes ($) | No | No |
| **Tree data** | Yes | No | No | Yes ($) | No | Yes |
| **Formulas** | Yes (80+ fns) | No | No | No | No | No |
| **Clipboard** | Yes | No | No | Yes ($) | Yes | Yes |
| **Fill handle** | Yes | No | No | No | Yes | No |
| **Undo/redo** | Yes | No | No | No | No | No |
| **Row virtualization** | No | No (use TanStack Virtual) | Yes | Yes | Yes | Yes |
| **Column virtualization** | No | No | No | Yes ($) | No | No |
| **Keyboard navigation** | No | No (DIY) | Yes | Yes | Yes | Yes |
| **Cell range selection** | No | No | No | Yes ($) | Yes | No |
| **Server-side models** | No | Manual | No | Yes ($) | No | Yes (AJAX) |
| **Excel export** | No | No | No | Yes ($) | No | Yes |
| **CSS themes** | 8 themes | None | 4 themes | 4 themes | 2 modes | Built-in |
| **TypeScript** | Native | Native | Native | Native | Native | Definitions |
| **Bundle size** | ~TBD | ~15 kB | ~300 kB | ~520 kB | ~35 kB | ~99 kB |
| **GitHub stars** | 0 | 27.8k | 15.1k | 15.1k | 7.6k | 7.6k |
| **npm weekly** | 0 | 9.9M | 2M | - | 335k | 136k |
| **Test coverage** | ~20% | High | High | High | Moderate | Moderate |
| **Documentation** | None | Extensive | Excellent | Excellent | Good | Good |

**The honest picture:** Yable has the broadest free feature set of any MIT table library. But it lacks virtualization, keyboard nav, and documentation -- three things every serious user needs. Feature count means nothing without performance and usability.

---

## 8. The Verdict

### What Yable actually is

Yable is a well-architected data table engine with genuinely impressive advanced features (formula engine, pivot tables, fill handle) built in a single sprint. It occupies a real gap in the market -- the space between "TanStack's headless flexibility" and "AG Grid's batteries-included power." The code quality is solid for a v0.1.0. The architecture is sound. The feature ambition is genuine and partially delivered.

### What Yable is not

It is not a product anyone can use today. No documentation, no npm package, no tests for 80% of the code, no virtualization (hard ceiling at ~500 rows for usable performance), no keyboard navigation (accessibility requirement), and 120 type-safety bypasses in the core. The formula engine is impressive but untested. The pivot tables are impressive but untested. "Impressive but untested" is not a selling point -- it's a liability.

### Strategic advice

**1. Virtualization before anything else.** This is the single highest-priority item. Without row virtualization, the library is unusable for any dataset over a few hundred rows. Every competitor either has it or (TanStack) pairs with a virtualization library. This is not a nice-to-have -- it's existential. Kill every other planned feature and build this first.

**2. Write tests for the features you've built, not new features.** The formula engine (1,417 LOC), pivot system (497 LOC), and tree data (341 LOC) are your crown jewels and they have zero tests. One regression in the formula parser and your differentiation story collapses. Target 80% coverage on `@yable/core` before publishing to npm.

**3. Fix the React rendering performance before anyone benchmarks you.** Add `React.memo` to `TableRow` and cell components. Consider `useSyncExternalStore` for granular subscriptions. Replace `getColumn()` linear scan with a Map. Without these, anyone who benchmarks Yable against React Data Grid or AG Grid will publicly embarrass the project.

**4. Publish documentation, not code.** The biggest mistake open-source libraries make is shipping code without docs. TanStack Table's #1 weakness is documentation -- if Yable launches with better docs than TanStack, that alone drives adoption. Prioritize: (a) README with 5-minute quickstart, (b) interactive examples for each feature, (c) API reference with JSDoc, (d) migration guide from TanStack Table.

**5. Pick a name and publish.** "Yable" is fine. Get on npm. Ship `@yable/core@0.1.0` with a honest "alpha -- not production ready" warning. Early adopters will find bugs you never imagined. The formula engine and pivot tables will attract attention if people can actually install and try them.

**Bonus: Kill the vanilla renderer or make it real.** At 865 LOC with innerHTML patterns, it's a liability. Either invest in making it a proper DOM renderer with `document.createElement` (safe, testable) or drop it and focus on React. Half-baked framework support is worse than no framework support.

---

## 9. Rating

**As a prototype: 7.5/10**

Genuinely impressive breadth and depth for a v0.1.0 sprint. The formula engine, pivot tables, and headless architecture show real technical ambition and competence. The feature inventory beats every free competitor on paper. Clean monorepo setup, proper build system, solid TypeScript types (despite the `as any` count). This is what a strong prototype looks like.

**As a product: 3/10**

No documentation. No npm package. 80% untested code. No virtualization (hard perf ceiling). Full re-render on every state change. 120 type-safety bypasses. No keyboard navigation (accessibility failure). No README. Zero users. The gap between "impressive code" and "usable product" is enormous, and Yable has done almost nothing on the product side. A developer who discovers this library today would spend more time reading source code than building their app -- and that's exactly what they're trying to avoid by using a library.

**The 7.5 → 3 gap tells the story: excellent bones, not shippable.** The path from 3 to 6 is: virtualization + tests + docs + performance fixes. The path from 6 to 8 is: community adoption, real-world battle testing, and keyboard/accessibility support.
