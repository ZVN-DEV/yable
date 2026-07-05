---
'@zvndev/yable-react': patch
---

Render top and bottom pinned rows when row virtualization is enabled. The React body now virtualizes only the center row slice, keeps pinned rows outside the scroll window, avoids duplicate pinned rows, and preserves pretext height data for the virtualized center slice.
