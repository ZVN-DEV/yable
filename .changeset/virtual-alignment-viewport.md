---
'@zvndev/yable-core': minor
'@zvndev/yable-react': patch
---

Fix header/body column misalignment and viewport overflow in virtualized tables.

Virtualized rows were absolutely positioned, which blockifies `<tr>` and detaches body cell widths from the shared colgroup — the header table stretched to the container while body cells kept raw pixel widths, desyncing columns whenever the container was wider than the summed column widths. Mounted rows now render as real table rows with the window offset applied once to the inner table, and the body table width-compensates for classic scrollbars, keeping header and body pixel-aligned at any container width (and restoring native rowSpan semantics inside the mounted window).

Adds a `virtualViewportHeight` table option to set the virtualized scroll viewport height explicitly, replacing the hardcoded ~800px heuristic that could overflow shorter styled containers and leave a clipped-but-still-scrollable region.
