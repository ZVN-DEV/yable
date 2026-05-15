/**
 * Merges edit-commit changes into a data array, returning a new array
 * with matching rows shallow-merged. Rows without changes keep their
 * original reference so downstream memoisation works.
 *
 * @param data     Current data array
 * @param changes  Map of row ID -> partial row values (same shape as `onEditCommit`)
 * @param getRowId Optional row-ID resolver; defaults to string index
 */
export function mergeEditChanges<TData>(
  data: TData[],
  changes: Record<string, Partial<TData>>,
  getRowId: (row: TData, index: number) => string = (_, i) => String(i),
): TData[] {
  // Fast path: nothing to apply
  const changeKeys = Object.keys(changes)
  if (changeKeys.length === 0) return data

  return data.map((row, i) => {
    const id = getRowId(row, i)
    const patch = changes[id]
    return patch ? { ...row, ...patch } : row
  })
}
