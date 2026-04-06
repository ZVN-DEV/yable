// @yable/core — Tree Data Tests

import { describe, it, expect } from 'vitest'
import {
  buildTreeFromPaths,
  filterTreeData,
  sortTreeData,
  aggregateTreeValues,
  getTreeDepth,
  isLeafRow,
} from '../treeData'
import type { TreeNode } from '../treeData'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

interface LocationData {
  name: string
  value: number
}

const flatLocations: LocationData[] = [
  { name: 'USA', value: 100 },
  { name: 'California', value: 50 },
  { name: 'San Francisco', value: 20 },
  { name: 'Los Angeles', value: 30 },
  { name: 'New York', value: 40 },
  { name: 'Manhattan', value: 25 },
  { name: 'Brooklyn', value: 15 },
]

function getLocationPath(item: LocationData): string[] {
  const paths: Record<string, string[]> = {
    USA: ['USA'],
    California: ['USA', 'California'],
    'San Francisco': ['USA', 'California', 'San Francisco'],
    'Los Angeles': ['USA', 'California', 'Los Angeles'],
    'New York': ['USA', 'New York'],
    Manhattan: ['USA', 'New York', 'Manhattan'],
    Brooklyn: ['USA', 'New York', 'Brooklyn'],
  }
  return paths[item.name] ?? [item.name]
}

// ===========================================================================
// buildTreeFromPaths
// ===========================================================================

describe('buildTreeFromPaths', () => {
  it('should build a tree with a single root node', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)
    expect(tree).toHaveLength(1)
    expect(tree[0]!.path).toEqual(['USA'])
  })

  it('should set correct depth values', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)
    const usa = tree[0]!
    expect(usa.depth).toBe(0)

    const california = usa.children.find((c) => c.path[1] === 'California')!
    expect(california.depth).toBe(1)

    const sf = california.children.find((c) =>
      c.path.includes('San Francisco')
    )!
    expect(sf.depth).toBe(2)
  })

  it('should correctly identify leaf nodes', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)
    const usa = tree[0]!
    expect(usa.isLeaf).toBe(false)

    const california = usa.children.find((c) => c.path[1] === 'California')!
    expect(california.isLeaf).toBe(false)

    const sf = california.children.find((c) =>
      c.path.includes('San Francisco')
    )!
    expect(sf.isLeaf).toBe(true)
  })

  it('should assign correct unique keys', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)
    const usa = tree[0]!
    expect(usa.key).toBe('USA')

    const california = usa.children.find((c) => c.key === 'USA/California')!
    expect(california).toBeDefined()

    const sf = california.children.find(
      (c) => c.key === 'USA/California/San Francisco'
    )!
    expect(sf).toBeDefined()
  })

  it('should create correct children structure', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)
    const usa = tree[0]!
    expect(usa.children).toHaveLength(2) // California, New York
    const childNames = usa.children.map((c) => c.path[c.path.length - 1])
    expect(childNames).toContain('California')
    expect(childNames).toContain('New York')
  })

  it('should handle empty data', () => {
    const tree = buildTreeFromPaths([], getLocationPath)
    expect(tree).toHaveLength(0)
  })

  it('should handle flat data (all root-level)', () => {
    const data = [
      { name: 'A', value: 1 },
      { name: 'B', value: 2 },
      { name: 'C', value: 3 },
    ]
    const tree = buildTreeFromPaths(data, (item) => [item.name])
    expect(tree).toHaveLength(3)
    tree.forEach((node) => {
      expect(node.isLeaf).toBe(true)
      expect(node.depth).toBe(0)
    })
  })

  it('should create synthetic parent nodes for orphaned children', () => {
    // If we have only children without explicit parent data
    const orphanData = [
      { name: 'Child1', value: 10 },
      { name: 'Child2', value: 20 },
    ]
    const tree = buildTreeFromPaths(orphanData, (item) => [
      'SyntheticParent',
      item.name,
    ])
    // Should create synthetic parent "SyntheticParent"
    expect(tree).toHaveLength(1)
    expect(tree[0]!.children).toHaveLength(2)
  })

  it('should handle deeply nested trees (10 levels)', () => {
    const deepData = Array.from({ length: 10 }, (_, i) => ({
      name: `level${i}`,
      value: i,
    }))
    const tree = buildTreeFromPaths(deepData, (item) => {
      const idx = parseInt(item.name.replace('level', ''))
      return Array.from({ length: idx + 1 }, (_, j) => `level${j}`)
    })
    expect(tree).toHaveLength(1)
    expect(tree[0]!.depth).toBe(0)

    // Walk to deepest node
    let node = tree[0]!
    let maxDepth = 0
    while (node.children.length > 0) {
      node = node.children[node.children.length - 1]!
      maxDepth = node.depth
    }
    expect(maxDepth).toBe(9)
  })
})

// ===========================================================================
// filterTreeData
// ===========================================================================

describe('filterTreeData', () => {
  it('should keep parent hierarchy when child matches', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)

    const filtered = filterTreeData(tree, (node) =>
      node.data.name === 'San Francisco'
    )

    expect(filtered).toHaveLength(1) // USA
    expect(filtered[0]!.children).toHaveLength(1) // California only
    expect(filtered[0]!.children[0]!.children).toHaveLength(1) // San Francisco only
  })

  it('should return empty array when nothing matches', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)

    const filtered = filterTreeData(tree, () => false)
    expect(filtered).toHaveLength(0)
  })

  it('should return all nodes when all match', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)

    const filtered = filterTreeData(tree, () => true)
    expect(filtered).toHaveLength(tree.length)
  })

  it('should keep sibling matched nodes together', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)

    const filtered = filterTreeData(
      tree,
      (node) =>
        node.data.name === 'San Francisco' ||
        node.data.name === 'Los Angeles'
    )

    const california = filtered[0]!.children[0]!
    expect(california.children).toHaveLength(2)
  })

  it('should handle empty tree', () => {
    const filtered = filterTreeData([], () => true)
    expect(filtered).toHaveLength(0)
  })
})

// ===========================================================================
// sortTreeData
// ===========================================================================

describe('sortTreeData', () => {
  it('should sort nodes at each level independently', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)

    // Sort children by name descending
    const sorted = sortTreeData(tree, (a, b) =>
      b.data.name.localeCompare(a.data.name)
    )

    const sortedUsa = sorted[0]!
    const childNames = sortedUsa.children.map(
      (c) => c.path[c.path.length - 1]
    )
    // New York should come before California in descending order
    expect(childNames[0]).toBe('New York')
    expect(childNames[1]).toBe('California')
  })

  it('should sort leaf-level nodes', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)

    const sorted = sortTreeData(tree, (a, b) =>
      a.data.name.localeCompare(b.data.name)
    )

    const ca = sorted[0]!.children.find((c) => c.key === 'USA/California')!
    const caChildNames = ca.children.map((c) => c.data.name)
    expect(caChildNames).toEqual(['Los Angeles', 'San Francisco'])
  })

  it('should not modify original tree', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)
    const originalFirstChildKey = tree[0]!.children[0]!.key

    sortTreeData(tree, (a, b) =>
      b.data.name.localeCompare(a.data.name)
    )

    expect(tree[0]!.children[0]!.key).toBe(originalFirstChildKey)
  })
})

// ===========================================================================
// aggregateTreeValues
// ===========================================================================

describe('aggregateTreeValues', () => {
  it('should aggregate leaf values up to parents', () => {
    const tree = buildTreeFromPaths(flatLocations, getLocationPath)

    const aggregated = aggregateTreeValues(
      tree,
      'value',
      (values: unknown[]) =>
        (values as number[]).reduce((a, b) => a + b, 0),
      (data) => data.value
    )

    // San Francisco (leaf) = 20
    expect(aggregated.get('USA/California/San Francisco')).toBe(20)
    // California = SF(20) + LA(30) = 50
    expect(aggregated.get('USA/California')).toBe(50)
    // New York = Manhattan(25) + Brooklyn(15) = 40
    expect(aggregated.get('USA/New York')).toBe(40)
    // USA = California(50) + New York(40) = 90
    expect(aggregated.get('USA')).toBe(90)
  })

  it('should handle empty tree', () => {
    const aggregated = aggregateTreeValues<LocationData>(
      [],
      'value',
      (values: unknown[]) =>
        (values as number[]).reduce((a, b) => a + b, 0),
      (data) => data.value
    )
    expect(aggregated.size).toBe(0)
  })

  it('should handle single node tree', () => {
    const single: TreeNode<LocationData>[] = [
      {
        path: ['Root'],
        data: { name: 'Root', value: 42 },
        children: [],
        depth: 0,
        isLeaf: true,
        key: 'Root',
      },
    ]

    const aggregated = aggregateTreeValues(
      single,
      'value',
      (values: unknown[]) =>
        (values as number[]).reduce((a, b) => a + b, 0),
      (data) => data.value
    )

    expect(aggregated.get('Root')).toBe(42)
  })
})

// ===========================================================================
// Row helper utilities
// ===========================================================================

describe('Row helper utilities', () => {
  it('getTreeDepth should return _treeDepth when present', () => {
    const mockRow = { _treeDepth: 3, depth: 0 } as any
    expect(getTreeDepth(mockRow)).toBe(3)
  })

  it('getTreeDepth should fall back to row.depth', () => {
    const mockRow = { depth: 2 } as any
    expect(getTreeDepth(mockRow)).toBe(2)
  })

  it('isLeafRow should return _isLeaf when present', () => {
    const mockRow = { _isLeaf: true, subRows: [{}] } as any
    expect(isLeafRow(mockRow)).toBe(true)
  })

  it('isLeafRow should fall back to subRows check', () => {
    const mockRow = { subRows: [] } as any
    expect(isLeafRow(mockRow)).toBe(true)

    const mockRowWithChildren = { subRows: [{}] } as any
    expect(isLeafRow(mockRowWithChildren)).toBe(false)
  })
})
