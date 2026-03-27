// @yable/core — Core utility functions

import type { RowData, Updater, DeepKeys, DeepValue, ColumnDef } from './types'

// ---------------------------------------------------------------------------
// State Updater
// ---------------------------------------------------------------------------

export function functionalUpdate<T>(updater: Updater<T>, input: T): T {
  return typeof updater === 'function'
    ? (updater as (prev: T) => T)(input)
    : updater
}

// ---------------------------------------------------------------------------
// Memoisation
// ---------------------------------------------------------------------------

/**
 * Lightweight memo — returns a function that caches its result.
 * Re-computes only when `getDeps()` returns different values (shallow compare).
 */
export function memo<TResult>(
  getDeps: () => any[],
  fn: (...deps: any[]) => TResult,
  opts?: {
    key?: string
    debug?: () => boolean
    onChange?: (result: TResult) => void
  }
): () => TResult {
  let deps: any[] | undefined
  let result: TResult | undefined

  return () => {
    const newDeps = getDeps()
    const depsChanged =
      !deps ||
      newDeps.length !== deps.length ||
      newDeps.some((dep, i) => dep !== deps![i])

    if (depsChanged) {
      if (opts?.debug?.()) {
        const depChanges = newDeps.map((dep, i) => ({
          old: deps?.[i],
          new: dep,
          changed: deps ? dep !== deps[i] : true,
        }))
        console.info(`[yable:memo] '${opts.key}' deps changed:`, depChanges)
      }

      deps = newDeps
      result = fn(...newDeps)
      opts?.onChange?.(result!)
    }

    return result!
  }
}

// ---------------------------------------------------------------------------
// Deep Key Accessor
// ---------------------------------------------------------------------------

/**
 * Access a deeply-nested value from an object using dot-notation key.
 * e.g. `getDeepValue(row, 'address.city')` → `row.address.city`
 */
export function getDeepValue<T, K extends DeepKeys<T>>(
  obj: T,
  key: K
): DeepValue<T, K> {
  const parts = (key as string).split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null) return undefined as DeepValue<T, K>
    current = (current as Record<string, unknown>)[part]
  }
  return current as DeepValue<T, K>
}

// ---------------------------------------------------------------------------
// Column ID Resolution
// ---------------------------------------------------------------------------

export function resolveColumnId<TData extends RowData>(
  columnDef: ColumnDef<TData, any>
): string {
  if (columnDef.id) return columnDef.id
  if ('accessorKey' in columnDef && columnDef.accessorKey) {
    return typeof columnDef.accessorKey === 'string'
      ? columnDef.accessorKey
      : String(columnDef.accessorKey)
  }
  throw new Error(
    '[yable] Column definitions must have an `id` or `accessorKey` property.'
  )
}

// ---------------------------------------------------------------------------
// Row ID Resolution
// ---------------------------------------------------------------------------

export function resolveRowId<TData extends RowData>(
  row: TData,
  index: number,
  getRowId?: (originalRow: TData, index: number, parent?: unknown) => string,
  parent?: unknown
): string {
  if (getRowId) return getRowId(row, index, parent)
  return String(index)
}

// ---------------------------------------------------------------------------
// Cell Value Accessor
// ---------------------------------------------------------------------------

export function getCellValue<TData extends RowData>(
  row: TData,
  columnDef: ColumnDef<TData, any>
): unknown {
  if ('accessorFn' in columnDef && columnDef.accessorFn) {
    return columnDef.accessorFn(row, 0)
  }
  if ('accessorKey' in columnDef && columnDef.accessorKey) {
    return getDeepValue(row, columnDef.accessorKey as DeepKeys<TData>)
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Shallow Comparison
// ---------------------------------------------------------------------------

export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (a === null || b === null) return false

  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is(objA[key], objB[key])
    ) {
      return false
    }
  }

  return true
}

// ---------------------------------------------------------------------------
// Array Utilities
// ---------------------------------------------------------------------------

export function makeStateUpdater<K extends keyof any, V>(
  key: K,
  instance: {
    setState: (updater: Updater<any>) => void
    getState: () => any
    options: { [P in `on${Capitalize<string & K>}Change`]?: (updater: Updater<V>) => void }
  }
): (updater: Updater<V>) => void {
  return (updater: Updater<V>) => {
    // Check if there's a direct onChange handler
    const onChangeKey = `on${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}Change` as keyof typeof instance.options
    const onChange = instance.options[onChangeKey] as ((updater: Updater<V>) => void) | undefined

    if (onChange) {
      onChange(updater)
      return
    }

    // Otherwise update internal state
    instance.setState((old: any) => ({
      ...old,
      [key]: functionalUpdate(updater, old[key]),
    }))
  }
}

// ---------------------------------------------------------------------------
// Misc Helpers
// ---------------------------------------------------------------------------

/** No-op function */
export const noop = () => {}

/** Identity function */
export const identity = <T>(x: T): T => x

/** Check if a value is a function */
export function isFunction(val: unknown): val is (...args: any[]) => any {
  return typeof val === 'function'
}

/** Create a range [start..end) */
export function range(start: number, end: number): number[] {
  const result: number[] = []
  for (let i = start; i < end; i++) {
    result.push(i)
  }
  return result
}

/** Flatten a tree of items that have children */
export function flattenBy<T>(
  items: T[],
  getChildren: (item: T) => T[]
): T[] {
  const result: T[] = []
  const recurse = (list: T[]) => {
    for (const item of list) {
      result.push(item)
      const children = getChildren(item)
      if (children.length) recurse(children)
    }
  }
  recurse(items)
  return result
}

/** Unique values from an array */
export function uniqueBy<T, K>(arr: T[], getKey: (item: T) => K): T[] {
  const seen = new Set<K>()
  return arr.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
