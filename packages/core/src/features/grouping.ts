// @zvndev/yable-core — Row Grouping
// Builds grouped row models from flat (filtered+sorted) rows by one or more
// columns (`state.grouping`), creating synthetic group header rows whose cells
// expose the group value and per-column aggregates.
//
// The model exposes two row lists with distinct contracts:
//   - `rows`: the FLATTENED, VISIBLE list (group headers interleaved with their
//     expanded descendants, per `state.expanded`) — what the renderer maps over.
//   - `flatRows`: EVERY row (all group headers + all leaf rows), independent of
//     expansion — what selection/iteration consumers (e.g. select-all) walk so
//     collapsed leaves remain reachable.

import type { RowData, Row, Table, RowModel } from '../types'
import { createRow } from '../core/row'

function isExpanded(id: string, expanded: Record<string, boolean> | true): boolean {
  return expanded === true || (typeof expanded === 'object' && !!expanded[id])
}

/**
 * Build a flattened grouped row model from already filtered+sorted leaf rows.
 * When `grouping` is empty the input rows are returned unchanged.
 */
export function getGroupedRowModel<TData extends RowData>(
  table: Table<TData>,
  sortedRows: Row<TData>[],
  grouping: string[],
  expanded: Record<string, boolean> | true,
): RowModel<TData> {
  if (!grouping || grouping.length === 0) {
    const rowsById: Record<string, Row<TData>> = {}
    for (const r of sortedRows) rowsById[r.id] = r
    return { rows: sortedRows, flatRows: sortedRows, rowsById }
  }

  let counter = 0
  // Every synthetic group row created across all levels (collapse-independent).
  const allGroupRows: Row<TData>[] = []

  // Recursively build the group tree. At `level >= grouping.length` the input
  // rows are the leaves and are returned as-is.
  function build(rows: Row<TData>[], level: number, parentId: string | undefined): Row<TData>[] {
    if (level >= grouping.length) return rows

    const colId = grouping[level]!
    // Bucket by the RAW group value (not its string form) so distinct objects,
    // `null` vs `"null"`, `1` vs `"1"`, etc. never collapse into one group.
    const order: unknown[] = []
    const buckets = new Map<unknown, { value: unknown; rows: Row<TData>[] }>()

    for (const r of rows) {
      const value = r.getValue(colId)
      let bucket = buckets.get(value)
      if (!bucket) {
        bucket = { value, rows: [] }
        buckets.set(value, bucket)
        order.push(value)
      }
      bucket.rows.push(r)
    }

    // Ancestor grouping columns whose value every leaf in this group shares.
    const ancestorCols = grouping.slice(0, level)

    const groupRows: Row<TData>[] = []
    let bucketIndex = 0
    for (const value of order) {
      const bucket = buckets.get(value)!
      // Collision-free id: a per-bucket index disambiguates even when distinct
      // values share a `String(value)` form (e.g. objects), and the parent id —
      // itself built this way — keeps the path unique across levels. The
      // `colId:value` prefix stays human-readable for debugging.
      const segment = `${colId}:${String(value)}~${bucketIndex}`
      const groupId = parentId ? `${parentId}/${segment}` : segment
      bucketIndex++

      const leafRows = bucket.rows // every data row in this group (across deeper levels)
      const childTree = build(bucket.rows, level + 1, groupId)

      const groupRow = createRow(table, groupId, {} as TData, counter++, level, childTree, parentId)
      groupRow.groupingColumnId = colId
      groupRow.groupingValue = bucket.value
      groupRow.getLeafRows = () => leafRows
      // Group header rows are never directly selectable.
      groupRow.getCanSelect = () => false
      // The synthetic row has no backing data: serve the group value for the
      // grouping column, the shared value for any ancestor grouping column, and
      // the aggregate for any column with an aggregationFn.
      groupRow.getValue = ((cId: string) => {
        if (cId === colId) return bucket.value
        if (ancestorCols.includes(cId)) return leafRows[0]?.getValue(cId)
        const col = table.getColumn(cId)
        const aggFn = col?.getAggregationFn?.()
        if (aggFn) {
          try {
            return aggFn(cId, leafRows, childTree)
          } catch (err) {
            console.error(`[yable E060] aggregationFn threw for column "${cId}":`, err)
            return undefined
          }
        }
        return undefined
      }) as Row<TData>['getValue']

      allGroupRows.push(groupRow)
      groupRows.push(groupRow)
    }
    return groupRows
  }

  const tree = build(sortedRows, 0, undefined)

  // Flatten to VISIBLE rows, descending into expanded group rows only.
  const rows: Row<TData>[] = []
  function flatten(list: Row<TData>[]) {
    for (const r of list) {
      rows.push(r)
      if (r.getIsGrouped() && r.subRows.length > 0 && isExpanded(r.id, expanded)) {
        flatten(r.subRows)
      }
    }
  }
  flatten(tree)

  // flatRows = every group row + every leaf row, regardless of expansion, so
  // selection/iteration consumers can reach collapsed leaves.
  const flatRows: Row<TData>[] = [...allGroupRows, ...sortedRows]
  const rowsById: Record<string, Row<TData>> = {}
  for (const r of flatRows) rowsById[r.id] = r

  return { rows, flatRows, rowsById }
}
