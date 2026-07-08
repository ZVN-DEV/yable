---
'@zvndev/yable-react': minor
---

Add `autoColumnWidth.fitThreshold` — native small-overflow compression.

When columns' natural widths overflow the container by a small amount, a few-pixel
horizontal scrollbar is almost always an accident. `fitThreshold` (a fraction of
the container width, e.g. `0.15` = 15%) declares "keep it in view if it nearly
fits": overflow within the threshold is resolved by proportionally compressing
columns to fit **without wrapping** (respecting `minSize`), instead of scrolling.
Above the threshold, the normal `overflow` behavior applies.

Because compression is pure width math — no wrapped-row heights to measure — it
applies **even under row virtualization** (unlike `overflow: 'fit'`, which wraps and
falls back to `scroll` when virtualized). It runs inside the measurement pass, so
async re-measures preserve it, and it never overrides a user-resized column.
