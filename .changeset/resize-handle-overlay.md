---
'@zvndev/yable-react': minor
'@zvndev/yable-themes': patch
---

Column resize handles now render in a single overlay layer above the header
instead of an absolutely-positioned child inside each header cell. Under sticky
headers (the `stickyHeader` prop and the row-virtualization surface) every `th`
formed an equal-`z` stacking context, so a neighbouring cell painted over the
previous handle's overhanging half — the resize hit zone (and the `col-resize`
cursor) only worked when grabbing from the inner side of the divider. Lifting
the handles into one higher layer makes each hit zone straddle its divider
symmetrically: the grab works identically from either side of the line, with the
cursor shown across the full zone. Handle positions are measured from the real
header rects, so alignment holds across sticky/non-sticky headers, pinned
columns, row/column virtualization, horizontal scroll, and RTL. The visible
indicator stays exactly on the divider.

The React table no longer renders the in-cell `.yable-resize-handle` element;
its handles are `.yable-resize-overlay-handle` inside `.yable-resize-overlay`.
Consumers who styled `.yable-resize-handle` for the React grid should target the
overlay classes instead. (The `@zvndev/yable-vanilla` package still renders
`.yable-resize-handle` inside the cell, and its styling is unchanged.)
