// @zvndev/yable-core — Built-in aggregation functions

import type { RowData, Row, AggregationFn } from './types'

function getLeafValues(columnId: string, leafRows: Row<any>[]): unknown[] {
  return leafRows.map((row) => row.getValue(columnId))
}

function getNumericValues(columnId: string, leafRows: Row<any>[]): number[] {
  return getLeafValues(columnId, leafRows)
    .map(Number)
    .filter((v) => !isNaN(v))
}

export const aggregationFns = {
  sum: <TData extends RowData>(
    columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): number => {
    return getNumericValues(columnId, leafRows).reduce((sum, val) => sum + val, 0)
  },

  min: <TData extends RowData>(
    columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): number => {
    const nums = getNumericValues(columnId, leafRows)
    return nums.length ? Math.min(...nums) : 0
  },

  max: <TData extends RowData>(
    columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): number => {
    const nums = getNumericValues(columnId, leafRows)
    return nums.length ? Math.max(...nums) : 0
  },

  extent: <TData extends RowData>(
    columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): [number, number] => {
    const nums = getNumericValues(columnId, leafRows)
    return nums.length ? [Math.min(...nums), Math.max(...nums)] : [0, 0]
  },

  mean: <TData extends RowData>(
    columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): number => {
    const nums = getNumericValues(columnId, leafRows)
    return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : 0
  },

  median: <TData extends RowData>(
    columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): number => {
    const nums = getNumericValues(columnId, leafRows).sort((a, b) => a - b)
    if (nums.length === 0) return 0
    const mid = Math.floor(nums.length / 2)
    return nums.length % 2 !== 0
      ? nums[mid]!
      : (nums[mid - 1]! + nums[mid]!) / 2
  },

  unique: <TData extends RowData>(
    columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): unknown[] => {
    return [...new Set(getLeafValues(columnId, leafRows))]
  },

  uniqueCount: <TData extends RowData>(
    columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): number => {
    return new Set(getLeafValues(columnId, leafRows)).size
  },

  count: <TData extends RowData>(
    _columnId: string,
    leafRows: Row<TData>[],
    _childRows: Row<TData>[]
  ): number => {
    return leafRows.length
  },
} as const satisfies Record<string, AggregationFn<any>>

export type BuiltInAggregationFn = keyof typeof aggregationFns
