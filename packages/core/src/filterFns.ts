// @zvndev/yable-core — Built-in filter functions

import type { RowData, Row, FilterFn } from './types'

export const filterFns = {
  includesString: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = String(row.getValue(columnId) ?? '').toLowerCase()
    return value.includes(String(filterValue ?? '').toLowerCase())
  },

  includesStringSensitive: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = String(row.getValue(columnId) ?? '')
    return value.includes(String(filterValue ?? ''))
  },

  equalsString: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = String(row.getValue(columnId) ?? '').toLowerCase()
    return value === String(filterValue ?? '').toLowerCase()
  },

  equalsStringSensitive: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = String(row.getValue(columnId) ?? '')
    return value === String(filterValue ?? '')
  },

  arrIncludes: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = row.getValue<unknown[]>(columnId)
    return Array.isArray(value) && value.includes(filterValue)
  },

  arrIncludesAll: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = row.getValue<unknown[]>(columnId)
    const arr = filterValue as unknown[]
    return (
      Array.isArray(value) &&
      Array.isArray(arr) &&
      arr.every((v) => value.includes(v))
    )
  },

  arrIncludesSome: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = row.getValue<unknown[]>(columnId)
    const arr = filterValue as unknown[]
    return (
      Array.isArray(value) &&
      Array.isArray(arr) &&
      arr.some((v) => value.includes(v))
    )
  },

  equals: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    return row.getValue(columnId) === filterValue
  },

  weakEquals: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    // eslint-disable-next-line eqeqeq
    return row.getValue(columnId) == filterValue
  },

  inNumberRange: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = row.getValue<number>(columnId)
    const [min, max] = filterValue as [number | undefined, number | undefined]
    if (value == null) return false
    if (min != null && value < min) return false
    if (max != null && value > max) return false
    return true
  },

  inDateRange: <TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    filterValue: unknown
  ): boolean => {
    const value = row.getValue<Date | string>(columnId)
    if (value == null) return false
    const date = value instanceof Date ? value : new Date(value)
    const [min, max] = filterValue as [Date | string | undefined, Date | string | undefined]
    if (min != null) {
      const minDate = min instanceof Date ? min : new Date(min)
      if (date < minDate) return false
    }
    if (max != null) {
      const maxDate = max instanceof Date ? max : new Date(max)
      if (date > maxDate) return false
    }
    return true
  },
} as const satisfies Record<string, FilterFn<any>>

export type BuiltInFilterFn = keyof typeof filterFns
