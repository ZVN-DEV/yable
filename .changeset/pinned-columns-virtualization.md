---
'@zvndev/yable-react': minor
'@zvndev/yable-themes': minor
---

Fix pinned columns and the horizontal scrollbar under row virtualization.

Previously, when `enableVirtualization` was on, the header lived in the outer table (sticky against the outer scroll area) while the body rows lived in an inner container that scrolled only vertically. As a result, during horizontal scroll the pinned header cells stayed put but the pinned **body** cells rode away, and the horizontal scrollbar sat at the very bottom of the full dataset — unreachable without scrolling to the last row.

The virtualized table now renders inside a **single** `.yable-virtual-scroll-container` that wraps both the header and the body and scrolls on both axes. Header `th` and body `td` therefore resolve `position: sticky` against the same element, so:

- **Pinned columns stay stuck** to the left/right viewport edges during horizontal scroll — header and body cells move together.
- **The horizontal scrollbar sits at the bottom of the visible grid viewport** (the `virtualViewportHeight` box), reachable without vertically scrolling to the last row.

The header and body tables are both sized to the exact total column width with `table-layout: fixed` and a shared `<colgroup>`, so columns pixel-align without the old vertical-scrollbar width-compensation hack. The header stays pinned to the top of the viewport under virtualization even when `stickyHeader` is off, matching the previous layout where the header sat above the scrolling body.
