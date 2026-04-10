# Yable Marketing + Docs — SEO Audit & Drizzle-Terse Redesign

**Date:** 2026-04-09
**Status:** Design approved, pending spec review
**Scope:** `examples/react-demo` (the de facto marketing site)
**Out of scope:** Core library packages, existing demo pages (`/playground`, `/pretext-demo`, `/tailwind-demo`, `/commit-stories`) beyond adding metadata + inbound links

---

## 1. Problem statement

Yable's landing page (`examples/react-demo/src/app/page.tsx`, 1475 lines) reads like a literary gallery catalogue instead of a developer-tool landing. It also has no meaningful SEO foundations: no `sitemap.ts`, no `robots.ts`, no `metadataBase`, no JSON-LD, no per-page `metadata` exports (the landing is a client component, so metadata is structurally impossible there today), and no keyword coverage for "React data table" / "open-source data grid" / "AG Grid alternative" in the H1 or title.

The user's call: _"It's a bit gay with words right now."_ Translation: the editorial Cormorant Garamond + theme-critic copy is fighting the dev-tool positioning.

The rot is **concentrated**, not diffuse. Three blocks produce most of the problem:

1. 8 theme-note paragraphs (`page.tsx:261-349`) — ~900 words of literary criticism about colors.
2. Showcase sidebar "field notes" (`page.tsx:225-259, 929-960`) — meta-commentary about the demo.
3. Showcase section description (`page.tsx:892-896`) — marketing writing _about_ the marketing page.

And three structural misses:

4. Hero shows zero code (`page.tsx:800-850`) — fatal for dev-tool landing.
5. Comparison table buried at section 6 of 7 (`page.tsx:964-975`) — the strongest visual argument is hidden.
6. Eight sections with one visual rhythm — nothing resolves.

---

## 2. Goals

- Rebuild the landing to a **Drizzle-terse, code-heavy dev-tool** format while preserving Yable's warm brand palette (Path B).
- Collapse 8 sections to **5**. Delete ~400 lines of flowery prose.
- Put the **comparison table** at slot 2, the **code snippet** above the fold, the **install command** one click away.
- Land **SEO foundations**: sitemap, robots, metadataBase, per-page metadata, JSON-LD, openGraph.
- Target keywords: "react data table", "react data grid", "open source data grid", "ag grid alternative", "ag grid free alternative", "react table with formulas", "react pivot table", "async cell commit react table".
- **Polish** (not rebuild) the `/docs` reading experience.
- Preserve every line of copy explicitly marked "keep" in the content-writer brief.

## 3. Non-goals

- Deploying to a live URL (no `yable.dev` yet — spec leaves production URL as `<PROD_URL>` placeholder for a future commit).
- Redesigning `/docs` structure or content.
- Touching `packages/core`, `packages/react`, `packages/vanilla`, `packages/themes`.
- Rebuilding `/playground`, `/pretext-demo`, `/tailwind-demo`, `/commit-stories` — they get metadata + inbound links only.
- Adding new dependencies beyond: `shiki` (code highlighting for hero + feature cards), `gray-matter` (docs frontmatter). No animation libraries, no chart libraries, no CMS.

## 4. Constraints

- **Visual path:** Path B — Warm-amber Drizzle hybrid.
  - Keep: IBM Plex Sans body + IBM Plex Mono code + warm amber palette (`#0a0706` bg, `#f3eadb` text, `#d8a86a` accent).
  - Drop: Cormorant Garamond entirely. Remove from `layout.tsx:18-23` and every `page.module.css` reference.
  - Drop: section background gradients, stagger animations on sections 2-5, decorative grid overlays.
- **PM strictness:** Hold the line. Up to 4 rounds of iteration per PM note before escalation.
- **Dependency budget:** 2 new packages max (`shiki`, `gray-matter`).
- **No destructive git operations.** The uncommitted `page.tsx` / `page.module.css` changes in the working tree are effectively obsolete once the rebuild lands, but the Wave 0 agent **must** `git diff` them first so the rebuild incorporates anything valuable before overwriting.

---

## 5. Design decisions (locked)

| #   | Decision                                                                              | Rationale                                                                                     |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| D1  | Split `page.tsx` into server + `HomeClient.tsx` client                                | Structural prerequisite for per-page `metadata` export                                        |
| D2  | Drop Cormorant Garamond from the landing                                              | The serif display IS the editorial voice — removing it kills 50% of the problem visually      |
| D3  | Keep the warm amber palette                                                           | Already in `/docs`, distinctive among dev-tool landings, no rebuild cost for docs             |
| D4  | Move `CompareTable` to slot 2                                                         | It's the strongest argument; burying it wastes the viewer's first 5 seconds                   |
| D5  | Hero gets a tabbed code block (Install / Basic / Edit / Formula / Pivot)              | Code-first hero is the Drizzle/Hono/Bun table-stakes for dev tools                            |
| D6  | Delete all 8 theme-note paragraphs                                                    | ~130 lines of literary criticism about colors. Flat swatches replace them.                    |
| D7  | Delete showcase sidebar "field notes"                                                 | Self-referential meta-copy; competes with the demo for attention                              |
| D8  | Delete `packageBand` section                                                          | Monorepo trivia is not a value prop                                                           |
| D9  | Add install snippet + GitHub star fetch + trust strip to hero                         | No install command currently exists anywhere on the landing                                   |
| D10 | Ship JSON-LD (`SoftwareApplication` on `/`, `TechArticle` + `BreadcrumbList` on docs) | Zero structured data across the app today                                                     |
| D11 | Add sitemap.ts + robots.ts + metadataBase                                             | All three are missing; gate every other SEO improvement                                       |
| D12 | Preserve the hero headline verbatim                                                   | "Spreadsheet muscle. Product taste. Zero enterprise tax." is the single best line on the page |
| D13 | Preserve `SpeedShowcase`, `CompareTable`, "Ship a table by lunch." CTA                | Already at the right voice                                                                    |
| D14 | Docs: polish only, no rebuild                                                         | `/docs` is in decent shape; the landing is where the work is                                  |
| D15 | Preserve Cormorant Garamond in `/docs` H1s only                                       | Long-form reading genuinely benefits from the serif; no change needed to `docs.module.css`    |

---

## 6. New landing architecture

### 6.1 Section layout

```
┌─────────────────────────────────────────────────────────┐
│ 1. HERO  (2-col 55/45)                                  │
│    ┌─────────────────────┐  ┌────────────────────────┐  │
│    │ Kicker              │  │                        │  │
│    │ H1 (3 lines, sans)  │  │   Tabbed code block    │  │
│    │ Lead (1 sentence)   │  │   [Install|Basic|Edit  │  │
│    │ `npm i …` + copy    │  │    |Formula|Pivot]     │  │
│    │ [Docs] [GitHub ★N]  │  │                        │  │
│    │ ─── trust strip ─── │  │   (Shiki highlighted)  │  │
│    │ stars · kB · dl/wk  │  │                        │  │
│    └─────────────────────┘  └────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│ 2. COMPARISON TABLE  (promoted from slot 6)             │
│    Intro: "Yable vs libraries you already know."       │
│    <CompareTable/> (unchanged)                          │
├─────────────────────────────────────────────────────────┤
│ 3. CROWN JEWELS + LIVE DEMO  (merged featureShowcase +  │
│    showcase, sidebar stripped)                          │
│    [Formula] [Pivot] [Async Commits] — real code cards  │
│    ─── Live demo tabs: Data | Editing | Themes ───      │
│    Themes tab = 8 flat swatches, one-word label each    │
├─────────────────────────────────────────────────────────┤
│ 4. SPEED SHOWCASE  (unchanged structure, trimmed copy)  │
│    "Measured in milliseconds." — SpeedShowcase          │
├─────────────────────────────────────────────────────────┤
│ 5. CTA FOOTER                                           │
│    "Ship a table by lunch." card                        │
│    + orphan-fix link row                                │
└─────────────────────────────────────────────────────────┘
```

### 6.2 File moves

| Action  | File                          | Notes                                                                                                                                        |
| ------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Rewrite | `src/app/page.tsx`            | Server component. Exports `metadata`. Renders `<HomeClient/>` + JSON-LD `<script>`                                                           |
| New     | `src/app/HomeClient.tsx`      | `'use client'`. Owns all interactive state                                                                                                   |
| Rewrite | `src/app/page.module.css`     | Reduced from 1779 → target ~800 lines. Drop gradient panels, drop per-section animations except hero, drop all Cormorant Garamond references |
| Edit    | `src/app/layout.tsx:9-16`     | Import only `default.css` + `forest.css`; lazy-load the other 6 themes where used                                                            |
| Edit    | `src/app/layout.tsx:18-23`    | Delete the `Cormorant_Garamond` font declaration and `--font-display` variable                                                               |
| Edit    | `src/app/layout.tsx:39`       | Add `metadataBase`, `openGraph`, `twitter`, `icons`, `alternates.canonical`, rename title (drop "Demo")                                      |
| New     | `src/app/sitemap.ts`          | Generate from `DOCS` in `src/lib/docs.ts:169`                                                                                                |
| New     | `src/app/robots.ts`           | Point to sitemap                                                                                                                             |
| New     | `public/og.png`               | 1200×630 static image, placeholder OK for v1 (can be a rendered screenshot of the new hero)                                                  |
| New     | `src/lib/code-highlighter.ts` | Shiki singleton loader (to avoid bundling the whole `shiki` lib)                                                                             |

### 6.3 Sections that disappear

- `packageBand` section and all 4 package-layer entries (`page.tsx:78-99, 852-861`) — demoted to one-line footer
- `themeNotes` object (`page.tsx:261-349`) — deleted wholesale
- `fieldNotes` object (`page.tsx:225-259`) — deleted wholesale
- Showcase sidebar JSX (`page.tsx:929-960`) — sidebar grid collapses to single column
- `HeroPreview` component wrapping (`page.tsx:845-849`) — replaced by code block, live table moves to section 3

### 6.4 Sections preserved verbatim

- `CompareTable` component and its data (`page.tsx:113-174, 1139-1211`)
- `SpeedShowcase` component and Pretext integration
- `<BasicDemo/>`, `<EditableDemo/>`, `<ThemeGallery/>` subcomponents (used in section 3)
- All `Person` / `people` / `departments` data imports

---

## 7. Typography + palette (Path B)

### 7.1 Fonts (update `layout.tsx`)

```ts
const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // add 700 for display use
  display: 'swap',
  variable: '--font-body',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
})

// DELETED: Cormorant_Garamond import + const display + --font-display variable
```

### 7.2 CSS custom properties (new `globals.css` or `page.module.css`)

```css
:root {
  --bg-0: #0a0706;
  --bg-1: #161110;
  --bg-2: #201916;
  --fg-0: #f3eadb;
  --fg-1: #c9bfae;
  --fg-2: #807365;
  --accent: #d8a86a;
  --accent-bright: #ecc287;
  --line: rgba(243, 234, 219, 0.08);
  --line-strong: rgba(243, 234, 219, 0.14);
  --ok: #8fc7a0;
  --warn: #ecc287;
  --error: #f0a0a0;

  --font-sans: var(--font-body), system-ui, sans-serif;
  --font-mono: var(--font-mono), 'SF Mono', 'JetBrains Mono', monospace;
}
```

### 7.3 Type scale

| Role       | Size                          | Weight                                   | Font      |
| ---------- | ----------------------------- | ---------------------------------------- | --------- |
| H1 hero    | `clamp(2.5rem, 5vw, 4rem)`    | 700                                      | Plex Sans |
| H2 section | `clamp(1.75rem, 3vw, 2.5rem)` | 600                                      | Plex Sans |
| H3 card    | `1.125rem`                    | 600                                      | Plex Sans |
| Body       | `0.9375rem`                   | 400                                      | Plex Sans |
| Lead       | `1.125rem`                    | 400                                      | Plex Sans |
| Mono code  | `0.8125rem`                   | 400                                      | Plex Mono |
| Eyebrow    | `0.6875rem`                   | 500, `letter-spacing: 0.14em`, uppercase | Plex Mono |

Total: **3 font files** (down from 4 — Cormorant removed).

### 7.4 Visual rules

- **No section background gradients.** Flat `--bg-0` throughout with `--bg-1` cards and `--bg-2` for hover states.
- **One accent use per section max.** Amber is a highlight, not a wash.
- **Borders:** `1px solid var(--line)` for cards, `1px solid var(--line-strong)` for primary CTAs.
- **Shadows:** none on the page surface. One subtle shadow allowed on the hero code block to separate it from the background.
- **Animations:** stagger `fadeRise` on hero hero only. Sections 2-5 render static.

---

## 8. Content voice guide (for the content writer)

### 8.1 Principles

1. **Lead with the verb or the noun that matters.**
   - ✅ "Ships pivot tables, formulas, and clipboard under MIT."
   - ❌ "Themes are a system, not a screenshot."
2. **Cut every word describing how something feels.**
3. **Use concrete nouns, function names, numbers.** A dev should be able to Ctrl-F for APIs.
4. **Write like a README, not a gallery label.**
5. **Every sentence must survive the "so what?" test.**

### 8.2 Banlist

Do not use any of: _feel, feels, feeling, cinematic, editorial, archival, distinctive, calm, warmth, restraint, softness, drama, polish, productized, intentional, leans, pushes, rides on, carries meaning, the system shifts, pure hierarchy, visual authority, surface (as UI-noun), rhythm, front door, gallery, showcase one/two/three._

Limit: max one "not X but Y" construction on the entire page. Max one em-dash aside per paragraph, max 4 words inside the aside.

### 8.3 Preferred vocabulary

_MIT, free, zero-dep, TypeScript, headless, pivot, formula engine, fill handle, clipboard, TSV, undo/redo, async commit, `onCommit`, virtualization, keyboard nav, `useFillHandle`, `PivotEngine`, `FormulaEngine`, `useClipboard`, `UndoStack`, ships, runs, supports, exports, batches, retries, commits._

### 8.4 Structural rules

- Headlines: max 8 words. No subordinate clauses.
- Section descriptions: max 2 sentences, max 20 words total.
- Feature card copy: max 2 sentences, max 25 words.
- Paragraphs: one sentence per paragraph unless the second is a code snippet.
- No rhetorical questions.

### 8.5 Lines preserved verbatim (do NOT rewrite)

- Hero headline `page.tsx:809-811` — "Spreadsheet muscle. / Product taste. / Zero enterprise tax."
- Kicker `page.tsx:803` — "v0.2 · MIT licensed"
- Crown jewels title `page.tsx:868-870` — "Three things every other free table makes you build yourself."
- Speed title `page.tsx:1041` — "Measured in milliseconds."
- CTA title `page.tsx:981` — "Ship a table by lunch."
- Compare title `page.tsx:967` — "Yable versus the libraries you already know."
- Compare subtitle `page.tsx:968-971`
- "What ships free" sidebar `page.tsx:944-958` (moved to under the CTA card as a pill row)
- `heroSignals` numbers `page.tsx:353-374` (but render in mono, not serif)

### 8.6 Hero lead rewrite (locked)

**Current** (`page.tsx:814-818`):

> Yable is a TypeScript-first data table that ships pivot tables, formulas, clipboard, fill handle, undo/redo and async commits in the same MIT package. The features others charge $1,000+/dev/year for — free here, on contact.

**Replacement:**

> The open-source React data table with pivot tables, formulas, fill handle, clipboard, undo/redo, and async commits. TypeScript-first. MIT-licensed. Zero runtime deps.

Two SEO-relevant head-terms ("open-source React data table", "pivot tables") land in the lead. Brand name is used once per section maximum.

### 8.7 H1 SEO variant

Keep the existing three-line headline visually (it's the best line on the page). Append a `<span className="sr-only">` for crawlers:

```tsx
<h1 className={s.heroTitle}>
  <span className={s.heroLine}>Spreadsheet muscle.</span>
  <span className={s.heroLine}>Product taste.</span>
  <span className={`${s.heroLine} ${s.heroLineAccent}`}>Zero enterprise tax.</span>
  <span className="sr-only">
    Open-source React data table with spreadsheet features — MIT alternative to AG Grid.
  </span>
</h1>
```

The `sr-only` class is a standard screen-reader utility and will need to be added to `globals.css` if it isn't already present.

---

## 9. SEO fix list (ordered, actionable)

### Phase 1 — Foundations (Wave 0 agent)

| #   | File                     | Change                                                                                                                                                                                                                                                                     |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | `src/app/page.tsx`       | Split into server component + `HomeClient.tsx`. Export `metadata`.                                                                                                                                                                                                         |
| S2  | `src/app/HomeClient.tsx` | New file. Move all `'use client'` content here.                                                                                                                                                                                                                            |
| S3  | `src/app/sitemap.ts`     | Generate from `DOCS` in `src/lib/docs.ts:169`. Include `/`, `/docs`, every `/docs/<slug>`, every `/docs/<slug>/<section>`, `/playground`, `/tailwind-demo`, `/pretext-demo`, `/commit-stories`, every `/commit-stories/<story>`.                                           |
| S4  | `src/app/robots.ts`      | `export default () => ({ rules: [{ userAgent: '*', allow: '/' }], sitemap: '<PROD_URL>/sitemap.xml' })`                                                                                                                                                                    |
| S5  | `src/app/layout.tsx:39`  | Add `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')`, `openGraph`, `twitter`, `icons`, `alternates: { canonical: '/' }`, `authors`. Change title to `{ default: 'Yable — The open-source React data table', template: '%s · Yable' }`. |

### Phase 2 — Landing SEO (Wave 1 dev agent, alongside redesign)

| #   | File                                    | Change                                                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S6  | `src/app/page.tsx`                      | Export `metadata = { title: 'Yable — Open-source React data table with pivot tables, formulas, and async commits', description: (content-writer delivers a 140-160 char description; must include "React data table" or "React data grid" plus at least one of "pivot tables / formulas / async commits / MIT"), alternates: { canonical: '/' } }` |
| S7  | `HomeClient.tsx` (hero)                 | Weave "React data table" and "React data grid" naturally into lead + install strip labels                                                                                                                                                                                                                                                          |
| S8  | `page.tsx` (end of JSX)                 | Inject JSON-LD `<script type="application/ld+json">` with `SoftwareApplication` (name, description, applicationCategory: 'DeveloperApplication', operatingSystem: 'Browser', offers.price: 0, license: MIT, softwareVersion: '0.2.1')                                                                                                              |
| S9  | `HomeClient.tsx` section 5 (CTA footer) | Add orphan-fix link row: `/docs`, `/docs/api`, `/playground`, `/tailwind-demo`, `/pretext-demo`, `/commit-stories`                                                                                                                                                                                                                                 |

### Phase 3 — Orphan pages + docs (Wave 2 agent)

| #   | File                                          | Change                                                                                                                     |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| S10 | `src/app/playground/page.tsx`                 | Split client/server. Export `metadata` targeting "react data table playground".                                            |
| S11 | `src/app/tailwind-demo/page.tsx`              | Same split. Metadata targeting "tailwind data table" + "react data grid with tailwind".                                    |
| S12 | `src/app/pretext-demo/page.tsx`               | Same split. Metadata targeting "virtualized react table with variable row heights".                                        |
| S13 | `src/app/commit-stories/page.tsx`             | Add `metadata` targeting "async cell commit react table examples".                                                         |
| S14 | `src/app/commit-stories/*/page.tsx`           | Per-story metadata.                                                                                                        |
| S15 | `src/lib/docs.ts:48-111`                      | Accept `gray-matter` frontmatter (`title`, `description`, `updated`, `seoKeywords`); fall back to hard-coded registry.     |
| S16 | `src/app/docs/[doc]/[section]/page.tsx:25-29` | Use first-paragraph excerpt (stripped of markdown) as description — no more duplicate "part of the Yable … documentation." |
| S17 | `src/app/docs/[doc]/[section]/page.tsx`       | Add JSON-LD `TechArticle` + `BreadcrumbList` scripts.                                                                      |
| S18 | `src/app/docs/[doc]/page.tsx`                 | Add JSON-LD `BreadcrumbList` script.                                                                                       |
| S19 | `src/app/docs/page.tsx:5`                     | Rename title to "Yable Docs — React Data Table Documentation"; add openGraph.                                              |
| S20 | `src/app/layout.tsx:9-16`                     | Import only `default.css` + `forest.css` at root; lazy-import the other 6 where actually used. LCP fix.                    |
| S21 | `public/og.png`                               | Create a 1200×630 static OG image. Placeholder for v1 is acceptable.                                                       |

---

## 10. Docs polish list

| #    | File                                         | Change                                                                           |
| ---- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| DOC1 | `src/app/docs/docs.module.css:515-542`       | Code block `background: #0a0604 !important` → `#0a0706` to match new `--bg-0`.   |
| DOC2 | `src/app/docs/docs.module.css` (prose color) | `--text-color` opacity 0.88 → 0.92.                                              |
| DOC3 | `src/app/docs/OnThisPage.tsx`                | Add IntersectionObserver active-section highlighting on scroll.                  |
| DOC4 | `src/app/docs/SidebarNav.tsx`                | Sidebar always-expanded single level (remove `isWithinDoc` gating).              |
| DOC5 | `src/app/docs/DocPage.tsx` / layout          | Ensure Cormorant Garamond is preserved ONLY inside `/docs` layout, not globally. |

---

## 11. Multi-agent orchestration

### Wave 0 — Foundation (sequential, 1 agent)

**Agent: foundation-split**

Scope:

- S1, S2 (split page.tsx / HomeClient.tsx)
- S3 (sitemap.ts)
- S4 (robots.ts)
- S5 (layout.tsx metadata)
- Install `shiki` via `pnpm add shiki` in `examples/react-demo`

Stops when: `pnpm build` succeeds from the demo root with the split in place. `HomeClient.tsx` can initially be a verbatim copy of the old `page.tsx` content — content will be rebuilt in Wave 1. No visual changes, just the structural split + SEO foundations. This is a pure refactor + infra agent.

### Wave 1 — Parallel execution (3 agents)

**Agent A: dev-redesign**

Scope:

- Rebuild `HomeClient.tsx` to the 5-section structure (section 6.1)
- Rewrite `page.module.css` to Path B (section 7)
- Remove Cormorant Garamond from `layout.tsx`
- Delete `packageBand`, `themeNotes`, `fieldNotes`, showcase sidebar, `HeroPreview` wrapper
- Add tabbed hero code block (Install / Basic / Edit / Formula / Pivot) using Shiki
- Add install snippet + copy button + GitHub star fetch + trust strip
- Add orphan-fix link row in section 5
- Wire JSON-LD `SoftwareApplication` script in `page.tsx`
- Pull final copy from `content-writer/final-copy.md` (produced by Agent B)
- Apply S6, S7, S8, S9

Dependencies:

- Wave 0 complete
- Blocks: waits until Agent B produces `content-writer/final-copy.md` before final copy integration (but can scaffold structure with placeholder text)

**Agent B: content-writer**

Scope:

- Produce `docs/superpowers/specs/content/2026-04-09-landing-final-copy.md` (directory will be created as needed) containing final copy for every block referenced in the wordiness catalogue
- The wordiness catalogue (80+ copy blocks graded ✅/⚠️/🔴/🗑) lives in the content-inventory audit agent's report. The dispatching turn must embed the catalogue verbatim in the agent's prompt, or instruct the agent to SendMessage to agent `aff79f008823e5904` to retrieve it
- Follow the voice guide (section 8 of this spec)
- Deliverables in the markdown file:
  - Hero lead (section 8.6 is the locked version; content writer may refine wording within constraints)
  - Crown jewel card copy (3 cards: Formula Engine, Pivot Engine, Async Commits) — max 25 words each
  - Section 2 intro (1 sentence)
  - Section 3 intro (1 sentence)
  - Section 4 intro (trim current, max 15 words)
  - Section 5 CTA body (max 25 words)
  - Theme swatch labels (8 × one-word)
  - Trust strip microcopy (stars, kB, dl/wk labels)
  - Orphan link row labels (6 entries, max 3 words each)
  - `meta description` for the landing page (140-160 chars, must contain "React data table" or "data grid")
- No code. Just a markdown file the dev agent pulls from.

Dependencies: Wave 0 complete. Runs in parallel with Agent A.

**Agent C: pm**

Scope:

- Holds this spec as the source of truth
- Waits for Agent A to reach "ready for review" state
- Runs a review pass against every item in sections 6, 7, 8, 9, 10
- Produces a numbered punch list in `docs/superpowers/specs/reviews/2026-04-09-pm-round-N.md`
- Re-dispatches fixes to Agent A (or to a new dev micro-agent per note)
- Up to 4 rounds per note before escalation to me
- Final sign-off when every note is resolved or explicitly waived by me

Dependencies: Waits for Agent A's first draft.

### Wave 2 — SEO phase 3 + docs polish (sequential, 1 agent)

**Agent: seo-polish**

Scope:

- S10-S21 (orphan page metadata, docs frontmatter, JSON-LD, lazy theme CSS, OG image placeholder)
- DOC1-DOC5 (docs polish)
- Runs after Wave 1 + PM sign-off

### Iteration protocol

- PM review is strict. Up to 4 rounds per note.
- Each PM note becomes a TaskCreate item.
- Dev iterates until PM signs off OR hits round 4.
- If round 4 still fails, PM escalates to me with a blocker note; I decide.
- Content writer does not iterate on round-trips; PM sends line-level feedback and content writer produces a round-2 file.
- No agent self-merges to main branch. All changes visible in the working tree for human review before commit.

---

## 12. Verification gates

Before any commit:

1. **Build:** `pnpm build` from `/Users/macbookpro-kirby/Desktop/Coding/ZVN/table` root (all 4 packages + demo)
2. **Typecheck:** `pnpm typecheck` from repo root
3. **Lint:** `pnpm lint` from repo root
4. **Tests:** `pnpm test` — 580 tests must still pass (not expected to fail, but catch regressions in packages if a shared file accidentally changes)
5. **Dev server smoke:** `pnpm dev --filter @zvndev/yable-react-demo`
6. **Visual regression:** Playwright screenshots at 1440px desktop + 420px mobile for:
   - `/` (landing)
   - `/docs`
   - `/docs/quickstart`
   - `/docs/features`
   - `/docs/api`
   - `/docs/async-commits`
7. **Diff against baselines:** Compare against existing screenshots in repo root (`after-redesign-desktop.png`, `after-redesign-mobile.png`, etc.) — visual diff is expected and desired; review for unintended regressions only.
8. **Manual smoke checklist:**
   - Theme switcher swaps live
   - Demo tabs switch without flicker
   - `SpeedShowcase` virtualization still 60fps at 25k rows
   - Install snippet copy button copies to clipboard
   - GitHub CTA links to correct URL
   - All orphan-fix links resolve to 200s
   - JSON-LD validates in Google's Rich Results Test (offline check: paste into https://validator.schema.org/)
9. **PM sign-off** on every spec item
10. **User final approval** before commit

---

## 13. Open questions (none blocking)

None. All decisions are locked for the start of implementation. Future decisions that can be deferred:

- Production URL for `metadataBase` (placeholder env var for now)
- Final OG image design (static placeholder OK for v1)
- Live GitHub star count source (fetch at build time vs. runtime — dev agent can pick)

---

## 14. Appendix — Audit citations

### SEO findings (full report from audit agent)

_See agent output captured 2026-04-09; 19 deep-linkable fixes, ranked by impact × effort. Key structural blocker: every page except docs routes is `'use client'`, so per-page metadata is impossible without a split._

### Design critique (full report from audit agent)

_See agent output captured 2026-04-09; 14 ranked design problems. Three redesign archetypes proposed; user selected Option A (Drizzle-terse) with Path B palette override (warm amber preserved)._

### Content inventory (full report from audit agent)

_See agent output captured 2026-04-09; wordiness catalogue of 80+ copy blocks, voice analysis with tic counts, banlist + preferred list, 3 rewritten hero options._

The three audit agents can be re-invoked via SendMessage to their agent IDs if clarification is needed during implementation:

- SEO audit agent: `a0820ebce2b158e40`
- Design critique agent: `a662db9e689e02f76`
- Content inventory agent: `aff79f008823e5904`
