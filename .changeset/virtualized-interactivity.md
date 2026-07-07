---
'@zvndev/yable-themes': patch
---

Fix two interaction-killing CSS bugs in virtualized tables.

`.yable-virtual-spacer { pointer-events: none }` disabled every interactive element (checkboxes, buttons, links, inputs) inside virtualized table bodies — the spacer stays inert, but its mounted table now restores `pointer-events: auto`.

The header hover rule out-specificity'd the active sort-indicator rule, dimming the indicator to 0.4 opacity whenever the pointer was on the header — which is exactly where it is right after clicking to sort. Hover hinting now applies only to indicators that are not actively sorted.

Both are covered by a new real-pointer e2e interaction matrix (checkbox/button/input/link clicks, live resize tracking, visible sort indicators, hover states, deep-scroll interactivity, horizontal wheel reachability) that drives genuine pointer events in virtualized and non-virtualized grids.
