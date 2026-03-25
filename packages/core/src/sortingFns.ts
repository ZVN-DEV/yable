// @yable/core — Built-in sorting functions

import type { RowData, Row, SortingFn } from './types'

export const sortingFns = {
  alphanumeric: <TData extends RowData>(
    rowA: Row<TData>,
    rowB: Row<TData>,
    columnId: string
  ): number => {
    return compareAlphanumeric(
      toString(rowA.getValue(columnId)),
      toString(rowB.getValue(columnId))
    )
  },

  alphanumericCaseSensitive: <TData extends RowData>(
    rowA: Row<TData>,
    rowB: Row<TData>,
    columnId: string
  ): number => {
    return compareAlphanumeric(
      toString(rowA.getValue(columnId)),
      toString(rowB.getValue(columnId)),
      false
    )
  },

  text: <TData extends RowData>(
    rowA: Row<TData>,
    rowB: Row<TData>,
    columnId: string
  ): number => {
    const a = toString(rowA.getValue(columnId)).toLowerCase()
    const b = toString(rowB.getValue(columnId)).toLowerCase()
    return a.localeCompare(b)
  },

  textCaseSensitive: <TData extends RowData>(
    rowA: Row<TData>,
    rowB: Row<TData>,
    columnId: string
  ): number => {
    const a = toString(rowA.getValue(columnId))
    const b = toString(rowB.getValue(columnId))
    return a.localeCompare(b)
  },

  datetime: <TData extends RowData>(
    rowA: Row<TData>,
    rowB: Row<TData>,
    columnId: string
  ): number => {
    const a = rowA.getValue<Date | string | number>(columnId)
    const b = rowB.getValue<Date | string | number>(columnId)
    return toDate(a).getTime() - toDate(b).getTime()
  },

  basic: <TData extends RowData>(
    rowA: Row<TData>,
    rowB: Row<TData>,
    columnId: string
  ): number => {
    const a = rowA.getValue(columnId)
    const b = rowB.getValue(columnId)
    return compareBasic(a as any, b as any)
  },
} as const satisfies Record<string, SortingFn<any>>

export type BuiltInSortingFn = keyof typeof sortingFns

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toString(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? '1' : '0'
  return String(val)
}

function toDate(val: Date | string | number): Date {
  if (val instanceof Date) return val
  return new Date(val)
}

function compareBasic(a: number | string, b: number | string): number {
  if (a === b) return 0
  if (a > b) return 1
  return -1
}

/**
 * Alphanumeric comparison that handles mixed text and numbers.
 * "item2" comes before "item10".
 */
function compareAlphanumeric(
  a: string,
  b: string,
  caseInsensitive = true
): number {
  const aStr = caseInsensitive ? a.toLowerCase() : a
  const bStr = caseInsensitive ? b.toLowerCase() : b

  const reNum = /(\d+)/
  const aParts = aStr.split(reNum)
  const bParts = bStr.split(reNum)

  const len = Math.min(aParts.length, bParts.length)

  for (let i = 0; i < len; i++) {
    const aPart = aParts[i]!
    const bPart = bParts[i]!

    const aNum = parseInt(aPart, 10)
    const bNum = parseInt(bPart, 10)

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum
    } else {
      if (aPart !== bPart) return aPart.localeCompare(bPart)
    }
  }

  return aParts.length - bParts.length
}
