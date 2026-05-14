// @zvndev/yable-react — useTablePersistence hook
// Persists selected table state slices to localStorage (or custom storage).

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { functionalUpdate, type TableState, type Updater } from '@zvndev/yable-core'

/** Keys from TableState that are safe to persist by default. */
const DEFAULT_PERSISTED_KEYS: (keyof TableState)[] = [
  'columnVisibility',
  'columnOrder',
  'columnSizing',
  'columnPinning',
]

export interface UseTablePersistenceOptions {
  /** Storage key used for getItem/setItem. */
  key: string
  /** Which TableState slices to persist. Defaults to column layout keys. */
  persistedKeys?: (keyof TableState)[]
  /** Milliseconds to debounce storage writes. Default: 100. */
  debounce?: number
  /** Schema version — bumping this discards any stale stored data. */
  version?: number
  /** Custom Storage implementation. Default: localStorage. */
  storage?: Storage
}

interface PersistedEnvelope {
  version: number
  state: Partial<TableState>
}

/**
 * Resolve storage safely (SSR-safe).
 * Returns `undefined` if running on the server or storage is unavailable.
 */
function resolveStorage(custom?: Storage): Storage | undefined {
  if (custom) return custom
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage
    } catch {
      return undefined
    }
  }
  return undefined
}

/**
 * Pick a subset of keys from an object.
 */
function pick<T extends Record<string, unknown>>(obj: T, keys: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {}
  for (const k of keys) {
    if (k in obj) {
      result[k] = obj[k]
    }
  }
  return result
}

/**
 * Read persisted state from storage.
 * Returns an empty object on any failure.
 */
function readState(
  storage: Storage | undefined,
  key: string,
  version: number,
  persistedKeys: (keyof TableState)[],
): Partial<TableState> {
  if (!storage) return {}
  try {
    const raw = storage.getItem(key)
    if (!raw) return {}
    const envelope: PersistedEnvelope = JSON.parse(raw)
    if (envelope.version !== version) {
      // Version mismatch — discard stale data
      storage.removeItem(key)
      return {}
    }
    return pick(envelope.state as Record<string, unknown>, persistedKeys) as Partial<TableState>
  } catch {
    // Corrupted data — log and move on
    if (typeof console !== 'undefined') {
      console.warn(`[yable] Failed to read persisted state for key "${key}"`)
    }
    return {}
  }
}

/**
 * Write persisted state to storage.
 * Silently swallows errors (e.g. quota exceeded).
 */
function writeState(
  storage: Storage | undefined,
  key: string,
  version: number,
  state: Partial<TableState>,
): void {
  if (!storage) return
  try {
    const envelope: PersistedEnvelope = { version, state }
    storage.setItem(key, JSON.stringify(envelope))
  } catch {
    if (typeof console !== 'undefined') {
      console.warn(`[yable] Failed to persist state for key "${key}" (storage may be full)`)
    }
  }
}

export interface UseTablePersistenceReturn {
  /**
   * Partial state hydrated from storage — pass to `useTable({ initialState })`.
   * Only useful when NOT passing `onStateChange` (i.e., uncontrolled mode).
   */
  initialState: Partial<TableState>
  /**
   * State-change handler that persists relevant slices on each update.
   * When passed to `useTable({ onStateChange })`, the persistence hook
   * takes over state management (controlled mode). You MUST also pass
   * `state` to useTable in this case.
   */
  onStateChange: (updater: Updater<TableState>) => void
  /**
   * Current table state managed by the persistence hook.
   * Pass to `useTable({ state })` alongside `onStateChange`.
   */
  state: Partial<TableState>
  /** Manually clear all persisted state for this key. */
  clearPersistedState: () => void
}

/**
 * React hook that persists selected table state slices to storage.
 *
 * Returns `initialState` (hydrated from storage), `state`, and
 * `onStateChange` — pass all three to `useTable` so that persisted
 * slices survive page reloads.
 *
 * @example
 * ```tsx
 * const persistence = useTablePersistence({ key: 'my-table', version: 1 })
 *
 * // Controlled mode (recommended) — persistence manages state:
 * const table = useTable({
 *   data,
 *   columns,
 *   initialState: persistence.initialState,
 *   state: persistence.state,
 *   onStateChange: persistence.onStateChange,
 * })
 *
 * // Uncontrolled mode — only hydrate, no live persistence:
 * const table = useTable({
 *   data,
 *   columns,
 *   initialState: persistence.initialState,
 * })
 * ```
 */
export function useTablePersistence(
  options: UseTablePersistenceOptions,
): UseTablePersistenceReturn {
  const {
    key,
    persistedKeys = DEFAULT_PERSISTED_KEYS,
    debounce: debounceMs = 100,
    version = 0,
    storage: customStorage,
  } = options

  const storage = useMemo(() => resolveStorage(customStorage), [customStorage])

  // Read initial state once (during first render, never re-computed).
  const initialState = useMemo(
    () => readState(storage, key, version, persistedKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally read only on mount
    [],
  )

  // Internal state — drives re-renders when useTable delegates to us
  const [state, setState] = useState<Partial<TableState>>(initialState)

  // Refs for debounced writes
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable refs for options so the callback identity never changes
  const keyRef = useRef(key)
  keyRef.current = key
  const versionRef = useRef(version)
  versionRef.current = version
  const persistedKeysRef = useRef(persistedKeys)
  persistedKeysRef.current = persistedKeys
  const debounceRef = useRef(debounceMs)
  debounceRef.current = debounceMs
  const storageRef = useRef(storage)
  storageRef.current = storage

  const onStateChange = useCallback((updater: Updater<TableState>) => {
    setState((prev) => {
      const next = functionalUpdate(updater, prev as TableState)

      // Debounced storage write
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        const sliced = pick(
          next as unknown as Record<string, unknown>,
          persistedKeysRef.current,
        ) as Partial<TableState>
        writeState(storageRef.current, keyRef.current, versionRef.current, sliced)
        timerRef.current = null
      }, debounceRef.current)

      return next
    })
  }, [])

  // Clean up pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const clearPersistedState = useCallback(() => {
    const s = storageRef.current
    if (s) {
      try {
        s.removeItem(keyRef.current)
      } catch {
        // Ignore
      }
    }
  }, [])

  return { initialState, state, onStateChange, clearPersistedState }
}
