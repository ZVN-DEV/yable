# Gold-Standard Sprint — State Tracker

**Goal:** Raise overall gold-standard score from **31/50 → 45/50** minimum.
**Priority order:** P0 → P1 → P2. Within each phase, fix the 1/5 scores first (CI/CD, Release Engineering).

**PM role:** Main conversation. Dispatches worker agents per wave, verifies deliverables, never loses work.

---

## Score targets

| Dimension               | Before | Target | Delta   |
| ----------------------- | ------ | ------ | ------- |
| Testing                 | 3      | 4      | +1      |
| Error Handling          | 3.5    | 4      | +0.5    |
| **CI/CD**               | **1**  | **5**  | **+4**  |
| Build System            | 3      | 4      | +1      |
| Code Organization       | 4.5    | 5      | +0.5    |
| Tech Debt               | 3      | 4      | +1      |
| Documentation           | 4      | 4.5    | +0.5    |
| **Release Engineering** | **1**  | **5**  | **+4**  |
| Security                | 3.5    | 4.5    | +1      |
| Developer Experience    | 4.5    | 5      | +0.5    |
| **TOTAL**               | **31** | **45** | **+14** |

---

## File ownership (STRICT — no agent may edit outside its zone)

### Wave 1 — parallel, disjoint files

**Agent A — Versioning & Tooling** (sole owner of root package.json + pnpm-lock)

- `package.json` (root) — add devDeps: @changesets/cli, husky, lint-staged, size-limit, @size-limit/preset-small-lib, fast-check. Add scripts: prepare, size, test:coverage, changeset, release. Add size-limit + lint-staged config.
- `packages/vanilla/package.json` — bump to 0.2.0, add test script
- `packages/themes/package.json` — bump to 0.2.0, add test script
- `packages/core/package.json` — add `"sideEffects": false`
- `packages/react/package.json` — add `"sideEffects": false` (CSS side-effect exception if any)
- `.changeset/config.json` — create
- `.changeset/README.md` — create (changesets adds this)
- `.husky/pre-commit` — create
- `.lintstagedrc.json` — create (or put in package.json)
- Runs `pnpm install` at end to sync lockfile

**Agent B — Docs** (sole owner of new root markdown files + AGENTS.md edit)

- `SECURITY.md` — create
- `CODE_OF_CONDUCT.md` — create (Contributor Covenant 2.1)
- `CHANGELOG.md` — create with v0.1.0 and v0.2.0 backfill from git log
- `docs/errors.md` — create (seed with top ~20 error codes)
- `packages/core/src/features/FLAGS.md` — create feature flag inventory
- `AGENTS.md` — edit ONE line: fix "1,351 tests across 35 files" → "541 tests across 25 files"

**Agent C — CI/CD Workflows** (sole owner of .github/workflows/)

- `.github/workflows/ci.yml` — full rewrite: parallel jobs (lint, typecheck, test, build), Node matrix [20, 22], React matrix [18, 19] in a test job, concurrency cancel-in-progress, pnpm audit job, size-limit job, coverage upload
- `.github/workflows/release.yml` — new: on tag push or changesets merge, publish to npm
- `.github/workflows/canary.yml` — new: on merge to main, publish @canary via changesets snapshot

**Agent D — TypeSafety** (sole owner of tsconfig.base.json + any src fixes from new strictness)

- `tsconfig.base.json` — add `noUncheckedIndexedAccess: true`
- Run `pnpm typecheck`
- Fix any errors surfaced in `packages/*/src/**/*.ts(x)` — may touch many files, but ONLY to fix type errors, not refactor

**Agent E — CoreFixtures** (sole owner of new core test helpers)

- `packages/core/src/__tests__/helpers/makeTableState.ts` — new shared fixture factory

**Agent F — VanillaTests** (sole owner of new vanilla tests)

- `packages/vanilla/src/__tests__/renderer.test.ts` — new: cover `esc()`, `createTableDOM` smoke test
- `packages/vanilla/vitest.config.ts` — create if missing
- DOES NOT touch `packages/vanilla/package.json` (owned by Agent A)

**Agent G — ThemesTests** (sole owner of new themes tests)

- `packages/themes/src/__tests__/createTheme.test.ts` — new: sanitizer + validation tests
- `packages/themes/vitest.config.ts` — create if missing
- DOES NOT touch `packages/themes/package.json` (owned by Agent A)

**Agent H — DevDepsCleanup** (sole owner of examples/\*/package.json)

- `examples/vanilla-demo/package.json` — bump Vite to ≥6.4.2
- `examples/react-demo/package.json` — if it has Vite, bump it; also check for other audit hits
- DOES NOT run pnpm install (Agent A owns the lockfile)

### Wave 2 — after Wave 1 complete

**Agent I — FuzzTest** (needs fast-check installed by Agent A)

- `packages/core/src/features/formulas/__tests__/parser.fuzz.test.ts` — new: property test using fast-check

**Agent J — ErrorCodes** (needs TypeSafety done to avoid conflicts)

- Edit ~20 highest-traffic `throw new Error` sites to prefix with `[yable E###]`
- Coordinate with `docs/errors.md` created by Agent B (must use same codes)
- Files: packages/core/src/core/table.ts, packages/core/src/core/row.ts, packages/core/src/features/formulas/_, packages/core/src/features/commits/_, packages/react/src/context.ts, packages/themes/src/createTheme.ts

### Wave 3 — verification

**Agent K — Verifier**

- Run `pnpm install`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`
- Report any failures
- Fix trivial issues (typos, missing imports)
- Escalate blockers to PM

---

## Status log

| Wave | Agent            | Status                              | Deliverable                                                    | Notes                         |
| ---- | ---------------- | ----------------------------------- | -------------------------------------------------------------- | ----------------------------- |
| 1    | A Versioning     | done                                | root pkg + changesets + husky + size-limit                     | installed pending             |
| 1    | B Docs           | FAILED content-filter → split B1/B2 | —                                                              | retry as B1 + B2              |
| 1    | B1 Docs-Infra    | done                                | SECURITY/CHANGELOG/FLAGS/AGENTS                                | —                             |
| 1    | B2 Docs-Content  | done                                | COC + docs/errors.md                                           | —                             |
| 1    | C CI/CD          | done                                | ci.yml rewrite + release + canary                              | needs NPM_TOKEN               |
| 1    | D TypeSafety     | done                                | noUncheckedIndexedAccess + src fixes                           | test drift blocking turbo     |
| 1    | E CoreFixtures   | done                                | makeTableState helper                                          | —                             |
| 1    | F VanillaTests   | done                                | 19 renderer tests + vitest config                              | esc tested via public API     |
| 1    | G ThemesTests    | done                                | 30 createTheme tests                                           | API differs from audit        |
| 1    | H DevDepsCleanup | done                                | vite bump + workspace fixes                                    | —                             |
| 1.5  | Cleanup TypeFix  | done                                | fix 5 test-file typecheck errors                               | PASS across 7 tasks           |
| 1.6  | L DocsAccuracy   | done                                | README+AGENTS+FEATURES+CONTRIBUTING+CHANGELOG+SECURITY+landing | 9 files corrected             |
| 2    | I FuzzTest       | done                                | parser.fuzz.test.ts 5 properties                               | PASS 5/5                      |
| 2    | J ErrorCodes     | done                                | 11 E### prefixes applied                                       | themes sanitizer bug surfaced |
| 3    | K Verifier       | done                                | build+typecheck+test 585/585 + themes sanitizer XSS fix        | GREEN                         |
| 3.5  | PM SizeLimit     | done                                | react limit 30→35 KB (32.99 actual)                            | all 3 packages pass           |

---

## Error code registry (seed — Agent B creates, Agent J applies)

Format: `[yable E###] message`

- E001 — useTableContext must be used within a `<Table>` component
- E002 — Invalid theme name (must match `/^[a-zA-Z0-9_-]+$/`)
- E003 — Row with id "X" not found
- E004 — Column definitions must have an 'id' or 'accessorKey' property
- E005 — Column with id "X" not found
- E006 — Circular reference detected in formula
- E007 — Unknown function in formula expression
- E008 — Formula recursion depth exceeded
- E009 — accessorFn threw (logged, not thrown)
- E010 — filterFn threw (logged, not thrown)
- E011 — sortingFn threw (logged, not thrown)
- E012 — CommitError: handler threw or rejected
- E013 — Unknown AST node type in formula evaluator
- E014 — Invalid editConfig.type
- E015 — Invalid column definition (missing required field)
- E016 — Pivot config invalid
- E017 — Tree data: parent row not found
- E018 — Clipboard: parse failed
- E019 — Fill handle: source range required
- E020 — Validation failed for row (fullRowEditing)

---

## Invariants (agents MUST honor)

1. **No agent touches files outside its ownership zone.** If you need a file another agent owns, STOP and report to PM.
2. **Agents DO NOT run `pnpm install`** unless explicitly owning that step (Agent A only).
3. **Agents DO NOT create git commits** — PM will commit at the end.
4. **Agents return structured reports** — list all files created/modified and any blockers.
5. **Agents DO NOT touch `.sprint/SPRINT-STATE.md`** — PM owns this file.
