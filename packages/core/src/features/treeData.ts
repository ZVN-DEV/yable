// @yable/core — Tree Data Feature
// Hierarchical parent-child data support.
// `getDataPath` callback returns array path (e.g., ['USA', 'California', 'San Francisco'])
// Auto-builds tree from flat data. Supports expand/collapse, indent by depth,
// aggregation roll-up, and filter-with-parent-chain retention.

import type { RowData, Row, Table, RowModel } from '../types'
import { createRow } from '../core/row'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TreeNode<TData extends RowData> {
  /** The path segments for this node */
  path: string[]
  /** The original data (may be synthetic for intermediate nodes) */
  data: TData
  /** Child nodes */
  children: TreeNode<TData>[]
  /** Depth in the tree (0-based) */
  depth: number
  /** Whether this node is a leaf (has no children) */
  isLeaf: boolean
  /** Unique key derived from the full path */
  key: string
}

export interface TreeDataOptions<TData extends RowData> {
  /** Callback that returns the path array for a data item */
  getDataPath: (data: TData) => string[]
  /** Whether to auto-expand all nodes initially */
  autoExpandAll?: boolean
  /** Maximum depth to auto-expand */
  autoExpandDepth?: number
}

// ---------------------------------------------------------------------------
// buildTreeFromPaths
// ---------------------------------------------------------------------------

/**
 * Build a tree structure from flat data using path arrays.
 * Each data item's path defines its position in the hierarchy.
 *
 * @example
 * ```
 * const data = [
 *   { name: 'USA', value: 100 },
 *   { name: 'California', value: 50 },
 *   { name: 'San Francisco', value: 20 },
 * ]
 * // With getDataPath returning:
 * // ['USA'] for first item
 * // ['USA', 'California'] for second
 * // ['USA', 'California', 'San Francisco'] for third
 * ```
 */
export function buildTreeFromPaths<TData extends RowData>(
  data: TData[],
  getDataPath: (item: TData) => string[]
): TreeNode<TData>[] {
  const rootNodes: TreeNode<TData>[] = []
  const nodeMap = new Map<string, TreeNode<TData>>()

  // Sort data by path length to ensure parents come before children
  const sortedData = [...data].sort((a, b) => {
    const pathA = getDataPath(a)
    const pathB = getDataPath(b)
    return pathA.length - pathB.length
  })

  for (const item of sortedData) {
    const path = getDataPath(item)
    const key = path.join('/')

    const node: TreeNode<TData> = {
      path,
      data: item,
      children: [],
      depth: path.length - 1,
      isLeaf: true,
      key,
    }

    nodeMap.set(key, node)

    if (path.length === 1) {
      // Root-level node
      rootNodes.push(node)
    } else {
      // Find parent by constructing parent path
      const parentPath = path.slice(0, -1)
      const parentKey = parentPath.join('/')
      const parentNode = nodeMap.get(parentKey)

      if (parentNode) {
        parentNode.children.push(node)
        parentNode.isLeaf = false
      } else {
        // No explicit parent exists — create synthetic intermediate nodes
        let currentPath: string[] = []
        let currentParent: TreeNode<TData>[] = rootNodes

        for (let i = 0; i < path.length - 1; i++) {
          currentPath = [...currentPath, path[i]!]
          const currentKey = currentPath.join('/')

          let existing = nodeMap.get(currentKey)
          if (!existing) {
            // Create synthetic node
            existing = {
              path: [...currentPath],
              data: { [path[i]!]: path[i] } as unknown as TData,
              children: [],
              depth: i,
              isLeaf: false,
              key: currentKey,
            }
            nodeMap.set(currentKey, existing)
            currentParent.push(existing)
          }

          existing.isLeaf = false
          currentParent = existing.children
        }

        currentParent.push(node)
      }
    }
  }

  return rootNodes
}

// ---------------------------------------------------------------------------
// flattenTree — Convert tree back to flat row array
// ---------------------------------------------------------------------------

/**
 * Flatten a tree of nodes into a row array, respecting expanded state.
 * Only includes children of expanded nodes.
 */
export function flattenTree<TData extends RowData>(
  table: Table<TData>,
  treeNodes: TreeNode<TData>[],
  expanded: Record<string, boolean> | true
): Row<TData>[] {
  const rows: Row<TData>[] = []
  let index = 0

  function walk(nodes: TreeNode<TData>[], parentId?: string) {
    for (const node of nodes) {
      const rowId = node.key
      const subRows: Row<TData>[] = []

      const row = createRow(table, rowId, node.data, index, node.depth, subRows, parentId)

      // Attach tree metadata to the row
      ;(row as any)._treeDepth = node.depth
      ;(row as any)._isLeaf = node.isLeaf
      ;(row as any)._treePath = node.path
      ;(row as any)._treeKey = node.key
      ;(row as any)._hasChildren = node.children.length > 0

      rows.push(row)
      index++

      const isExpanded =
        expanded === true ||
        (typeof expanded === 'object' && expanded[rowId])

      if (isExpanded && node.children.length > 0) {
        const childRows: Row<TData>[] = []
        const startIndex = index
        walk(node.children, rowId)
        // Collect child rows added since startIndex
        for (let i = startIndex; i < index; i++) {
          childRows.push(rows[i]!)
        }
        row.subRows = childRows
      }
    }
  }

  walk(treeNodes)
  return rows
}

// ---------------------------------------------------------------------------
// filterTreeData — Filter with parent chain retention
// ---------------------------------------------------------------------------

/**
 * Filter tree data, keeping parent chain visible when a child matches.
 * Returns a new tree with only matching nodes and their ancestors.
 */
export function filterTreeData<TData extends RowData>(
  nodes: TreeNode<TData>[],
  predicate: (node: TreeNode<TData>) => boolean
): TreeNode<TData>[] {
  const result: TreeNode<TData>[] = []

  for (const node of nodes) {
    // Recursively filter children first
    const filteredChildren = filterTreeData(node.children, predicate)

    // Include this node if it matches OR any of its children matched
    if (predicate(node) || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren,
        isLeaf: filteredChildren.length === 0 && node.children.length === 0,
      })
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// sortTreeData — Sort while preserving tree hierarchy
// ---------------------------------------------------------------------------

/**
 * Sort tree data recursively. Children are sorted independently at each level.
 */
export function sortTreeData<TData extends RowData>(
  nodes: TreeNode<TData>[],
  compareFn: (a: TreeNode<TData>, b: TreeNode<TData>) => number
): TreeNode<TData>[] {
  const sorted = [...nodes].sort(compareFn)

  return sorted.map((node) => ({
    ...node,
    children:
      node.children.length > 0
        ? sortTreeData(node.children, compareFn)
        : node.children,
  }))
}

// ---------------------------------------------------------------------------
// getTreeRowModel — Builds a RowModel from tree data
// ---------------------------------------------------------------------------

/**
 * Create a RowModel from tree data, applying the full tree processing pipeline.
 */
export function getTreeRowModel<TData extends RowData>(
  table: Table<TData>,
  data: TData[],
  getDataPath: (item: TData) => string[]
): RowModel<TData> {
  // 1. Build tree from flat data
  const tree = buildTreeFromPaths(data, getDataPath)

  // 2. Get expanded state
  const expanded = table.getState().expanded

  // 3. Flatten for rendering, respecting expanded state
  const rows = flattenTree(table, tree, expanded as Record<string, boolean>)

  // 4. Build lookup maps
  const flatRows = rows
  const rowsById: Record<string, Row<TData>> = {}
  for (const row of flatRows) {
    rowsById[row.id] = row
  }

  return { rows, flatRows, rowsById }
}

// ---------------------------------------------------------------------------
// Row helper extensions
// ---------------------------------------------------------------------------

/**
 * Get the tree depth for a row (shortcut for row._treeDepth).
 */
export function getTreeDepth<TData extends RowData>(
  row: Row<TData>
): number {
  return (row as any)._treeDepth ?? row.depth
}

/**
 * Check if a row is a leaf node (no children).
 */
export function isLeafRow<TData extends RowData>(
  row: Row<TData>
): boolean {
  return (row as any)._isLeaf ?? row.subRows.length === 0
}

/**
 * Get the parent row by looking up parentId in the row model.
 */
export function getParentRow<TData extends RowData>(
  row: Row<TData>,
  table: Table<TData>
): Row<TData> | undefined {
  if (!row.parentId) return undefined
  try {
    return table.getRow(row.parentId, true)
  } catch {
    return undefined
  }
}

/**
 * Aggregate values from leaf rows to parent nodes.
 */
export function aggregateTreeValues<TData extends RowData>(
  nodes: TreeNode<TData>[],
  _columnId: string,
  aggregationFn: (values: unknown[]) => unknown,
  getValueFromData: (data: TData) => unknown
): Map<string, unknown> {
  const aggregated = new Map<string, unknown>()

  function walk(nodeList: TreeNode<TData>[]): unknown[] {
    const values: unknown[] = []
    for (const node of nodeList) {
      if (node.isLeaf) {
        const val = getValueFromData(node.data)
        values.push(val)
        aggregated.set(node.key, val)
      } else {
        const childValues = walk(node.children)
        const aggValue = aggregationFn(childValues)
        aggregated.set(node.key, aggValue)
        values.push(aggValue)
      }
    }
    return values
  }

  walk(nodes)
  return aggregated
}
