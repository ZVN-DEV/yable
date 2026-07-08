---
'@zvndev/yable-core': minor
'@zvndev/yable-react': patch
'@zvndev/yable-themes': patch
---

Add `resizeMaxSize` and stop the header ellipsis from clipping label-less headers

- **core:** New per-column `resizeMaxSize` caps USER drag-resize independently of
  `maxSize` (defaults to `maxSize`, fully back-compatible). `maxSize` still caps
  auto-sizing/stretch; set `resizeMaxSize` (e.g. `Infinity`, or app-wide via
  `defaultColumnDef`) to let a human drag a column past its auto-size cap.
- **react/themes:** The header-label ellipsis now only applies to string headers
  (marked `.yable-th-label`). Component/empty headers such as a selection-column
  checkbox are no longer collapsed and cropped.
