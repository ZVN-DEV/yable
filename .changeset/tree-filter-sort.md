---
'@zvndev/yable-core': patch
---

Run tree-data filtering and sorting before flattening rows. Column and global filters now search the full tree and retain parent chains for matching descendants, even when ancestors are collapsed. Sorting now runs recursively within each sibling group so child rows stay under their parent while sorted tree tables still preserve hierarchy.
