---
'@zvndev/yable-react': patch
'@zvndev/yable-themes': patch
---

Stripe rows by absolute display index under virtualization, and actually emit `state:change`.

Rows now carry `data-row-parity` (from the same display index as `data-row-index`), and the `striped` styles key off it when present — DOM `nth-child` parity shifts with the mounted virtual window, which made stripes swap colors while scrolling. Renderers that don't stamp the attribute (vanilla) keep the `nth-child` behavior. The attribute also lets consumers build custom zebra/selected/hover row styling that stays correct after sorting and scrolling.

The `state:change` event has been part of the typed event map but was never emitted, so subscribers (e.g. column-layout persistence) never fired. The React binding now emits it after every state update.
