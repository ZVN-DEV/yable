# Sprint Plan -- Yable Product Review Sprint

Generated: 2026-04-07
Based on: Product review findings from current conversation (rating: 7/10)

## Sprint Goal

Fix all credibility-damaging README claims, patch the one security vulnerability, and fill the three biggest engineering gaps (package metadata, CI/CD, React tests) so Yable can be published to npm as a credible alpha.

## Success Criteria

- [ ] All P0 issues resolved (README honesty, CellLink XSS)
- [ ] All P1 issues resolved (package metadata, CI/CD, linting, React tests)
- [ ] README formula count matches reality (17 functions, not 80+)
- [ ] AG Grid comparison table is accurate
- [ ] CellLink validates href against dangerous protocols
- [ ] All 4 packages have description, keywords, license, author, repository fields
- [ ] GitHub Actions CI runs tests + typecheck + build on push/PR
- [ ] ESLint + Prettier configs exist and enforce style
- [ ] React adapter has baseline test coverage (20+ tests)
- [ ] `pnpm build` passes clean across all packages

## Dev Tracks

---

### Track 1: README Honesty -- Documentation Corrections

**Files touched:** `README.md`

**Tasks:**

- [ ] T1-01 (P0): Fix formula engine claim -- change "80+ spreadsheet functions" to "17 built-in functions (extensible)" in Why Yable section (line 22) and Features section (line 140)
- [ ] T1-02 (P0): Fix AG Grid comparison table (lines 30-52):
  - Column pinning: AG Grid Community = "Yes" (not "No")
  - Undo/Redo: AG Grid Community = "Yes" (not "No")
  - Formula engine: AG Grid Enterprise = "Yes" (not "No") -- added in v35, Dec 2025
- [ ] T1-03 (P0): Fix "AG Grid doesn't even offer this" claim about formulas (line 22) -- AG Grid Enterprise v35 now has formulas. Reword to emphasize Yable's is free/MIT
- [ ] T1-04 (P1): Fix themes package description -- says "3 built-in themes" (line 127) but there are actually 8
- [ ] T1-05 (P1): Update Status section (lines 168-177) -- keyboard navigation is implemented, virtualization hook exists, 8 themes ship. Reflect actual state.
- [ ] T1-06 (P1): Add the async commit system to the Why Yable section and comparison table -- this is the strongest differentiator and isn't mentioned

---

### Track 2: Security Fix -- CellLink XSS

**Files touched:** `packages/react/src/cells/CellLink.tsx`

**Tasks:**

- [ ] T2-01 (P0): Add URL protocol validation to CellLink -- reject javascript:, data:text/html, and vbscript: schemes before passing to href attribute. Add a `isSafeUrl()` helper inline.

---

### Track 3: Package Metadata -- npm Publishing Readiness

**Files touched:** `packages/core/package.json`, `packages/react/package.json`, `packages/vanilla/package.json`, `packages/themes/package.json`

**Tasks:**

- [ ] T3-01 (P1): Add to all 4 package.json files: `description`, `keywords`, `license: "MIT"`, `author`, `repository` fields. Use appropriate per-package descriptions and keywords.

---

### Track 4: CI/CD + Linting Infrastructure

**Files touched (all new):** `.github/workflows/ci.yml`, `eslint.config.js`, `.prettierrc`, root `package.json` (lint script only)

**Tasks:**

- [ ] T4-01 (P1): Create GitHub Actions CI workflow at `.github/workflows/ci.yml` -- run on push/PR to main: pnpm install, build, typecheck, test. Use pnpm, Node 20, cache pnpm store.
- [ ] T4-02 (P1): Create `eslint.config.js` (flat config) with TypeScript + React support. Use @typescript-eslint/parser and basic recommended rules.
- [ ] T4-03 (P1): Create `.prettierrc` with sensible defaults (singleQuote, semi, tabWidth: 2, trailingComma: all).
- [ ] T4-04 (P1): Add eslint + prettier devDependencies and a working lint script to root package.json.

---

### Track 5: React Component Tests -- Baseline Coverage

**Files touched (all new):** `packages/react/src/__tests__/*.test.tsx`

**Tasks:**

- [ ] T5-01 (P1): Table rendering tests -- renders with data, renders empty state (NoRowsOverlay), renders loading state (LoadingOverlay), renders with striped/bordered/compact props. Target: 6+ tests.
- [ ] T5-02 (P1): Sorting interaction tests -- clicking header triggers sort, shift-click enables multi-sort, sort indicator renders. Target: 4+ tests.
- [ ] T5-03 (P1): Pagination tests -- renders page controls, page navigation works, page size change works. Target: 4+ tests.
- [ ] T5-04 (P1): Cell editing tests -- double-click enters edit mode, Enter commits, Escape cancels, pending value tracked. Target: 4+ tests.
- [ ] T5-05 (P1): CellStatusBadge tests -- renders error state with retry/dismiss, renders conflict state, renders pending opacity. Target: 4+ tests.

---

## File Ownership Matrix (No Conflicts)

| Path | Track 1 | Track 2 | Track 3 | Track 4 | Track 5 |
|---|---|---|---|---|---|
| `README.md` | OWN | - | - | - | - |
| `packages/react/src/cells/CellLink.tsx` | - | OWN | - | - | - |
| `packages/*/package.json` | - | - | OWN | - | - |
| `.github/workflows/ci.yml` (NEW) | - | - | - | OWN | - |
| `eslint.config.js` (NEW) | - | - | - | OWN | - |
| `.prettierrc` (NEW) | - | - | - | OWN | - |
| Root `package.json` | - | - | - | OWN | - |
| `packages/react/src/__tests__/*.test.tsx` (NEW) | - | - | - | - | OWN |

**Zero file conflicts between tracks.**

## Summary

| Priority | Count | Tracks |
|----------|-------|--------|
| P0 | 4 tasks | T1 (3), T2 (1) |
| P1 | 11 tasks | T1 (3), T3 (1), T4 (4), T5 (5) -- note T4-04 adds devDeps |
| **Total** | **15 tasks** | **5 tracks** |

## Intentionally Skipped

- **table.ts decomposition** -- risky refactor, better as a standalone task
- **Storybook expansion** -- polish, not credibility
- **`any` type cleanup** -- code quality, not blocking
- **Accessibility improvements** -- important but needs dedicated audit + sprint
- **Vanilla renderer docs** -- low usage, defer
- **Formula function expansion** -- architecture is ready, functions can be added incrementally
- **Performance benchmarks** -- needed eventually, not for this sprint
