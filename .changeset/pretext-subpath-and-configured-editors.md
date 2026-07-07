---
'@zvndev/yable-react': minor
---

Fix Next.js/Turbopack builds breaking on the optional `@chenglou/pretext` peer (#50), and render configured editors for styled cells (#58).

**#50 — Pretext moved to a subpath.** The Pretext measurement hooks (`usePretextMeasurement`, `useTableRowHeights`, `DEFAULT_TEXT_RECIPE`) now live behind the `@zvndev/yable-react/pretext` subpath. They hold the lazy `import('@chenglou/pretext')`, so keeping them out of the main entry means importing `@zvndev/yable-react` no longer forces a consumer's bundler (Next.js/Turbopack, webpack) to resolve the optional `@chenglou/pretext` peer — fixing `Module not found: Can't resolve '@chenglou/pretext'` at build time. The related TYPES remain exported from the main entry.

Migration: import the hooks from the subpath and install the peer only if you use Pretext measurement:

```ts
// before
import { useTableRowHeights } from '@zvndev/yable-react'
// after
import { useTableRowHeights } from '@zvndev/yable-react/pretext'
```

**#58 — `editConfig` now renders the editor even for styled cells.** A column that defines both a custom `cell` renderer and `editable` + `editConfig` now renders the configured built-in editor while the cell is in edit mode (the custom `cell` becomes the display-mode view). Previously the custom `cell` fn always won, so any column that styled its cells could never enter edit mode. The `editConfig.type` maps to the matching editor (text/number/select/toggle/checkbox/date), and `editConfig.render` (or `type: 'custom'`) supplies a fully custom editor. Default editable columns with only an `editConfig` (no custom `cell`) now render an editor too, without hand-wiring `<CellInput>`.
