---
'@zvndev/yable-themes': patch
---

Fix: the column-resize handle now sits ON the column divider instead of slightly left of it.

`.yable-th` used `overflow: hidden` (for header-label ellipsis), which clipped the
absolutely-positioned resize handle to the cell box — forcing the visible bar and
its hit zone to sit flush _inside_ the divider, so users had to aim left of the
boundary to grab it. The label ellipsis now lives on the inner `.yable-th-content`
wrapper, and the handle is centered on the divider (via a transform, so the overhang
never inflates the grid's horizontal scroll width). The last column keeps its handle
flush inside, since its divider is the grid's own right edge.
