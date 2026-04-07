// @zvndev/yable-core — Pivot Mode Feature
// Full pivot tables with auto-generated columns.
// User selects row fields, column fields, value fields (with aggregation).
// Generates cross-tabulation: row groups -> rows, column groups -> dynamic columns.

import type { RowData, Row, Table, RowModel, ColumnDef, AggregationFn } from '../types'
import { aggregationFns } from '../aggregationFns'
import { createRow } from '../core/row'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PivotFieldConfig {
  /** The column/field id */
  field: string
  /** Optional label override for display */
  label?: string
}

export interface PivotValueConfig {
  /** The column/field id to aggregate */
  field: string
  /** Aggregation function name or custom function */
  aggregation: keyof typeof aggregationFns | AggregationFn<any>
  /** Optional label override */
  label?: string
}

export interface PivotConfig {
  /** Fields to use as row groups (left-side grouping) */
  rowFields: PivotFieldConfig[]
  /** Fields to use as column groups (generate dynamic columns) */
  columnFields: PivotFieldConfig[]
  /** Fields to aggregate as values in the cross-tab cells */
  valueFields: PivotValueConfig[]
  /** Whether to show row subtotals */
  showRowSubtotals?: boolean
  /** Whether to show column subtotals */
  showColumnSubtotals?: boolean
  /** Whether to show grand total row */
  showGrandTotal?: boolean
}

export interface PivotState {
  /** Whether pivot mode is active */
  enabled: boolean
  /** Pivot configuration */
  config: PivotConfig
  /** Expanded row groups (by path key) */
  expandedRowGroups: Record<string, boolean>
  /** Expanded column groups (by path key) */
  expandedColumnGroups: Record<string, boolean>
}

export interface PivotColumn {
  /** Unique column id */
  id: string
  /** Display header */
  header: string
  /** Path of column group values */
  path: string[]
  /** Which value field this column represents */
  valueField: string
  /** Aggregation function for this column */
  aggregation: keyof typeof aggregationFns | AggregationFn<any>
  /** Whether this is a subtotal column */
  isSubtotal?: boolean
}

export interface PivotRow {
  /** Unique row id */
  id: string
  /** Row group path */
  path: string[]
  /** Display label for the row group */
  label: string
  /** Depth in the row grouping hierarchy */
  depth: number
  /** Whether this row has children (more specific groupings) */
  hasChildren: boolean
  /** Whether this is a subtotal row */
  isSubtotal?: boolean
  /** Whether this is the grand total row */
  isGrandTotal?: boolean
  /** Aggregated values keyed by pivot column id */
  values: Record<string, unknown>
  /** Original data rows that feed into this pivot row */
  sourceRows: any[]
}

// ---------------------------------------------------------------------------
// PivotEngine
// ---------------------------------------------------------------------------

export class PivotEngine<TData extends RowData> {
  private config: PivotConfig
  private data: TData[]
  private getValueFn: (row: TData, field: string) => unknown

  constructor(
    data: TData[],
    config: PivotConfig,
    getValueFn: (row: TData, field: string) => unknown
  ) {
    this.data = data
    this.config = config
    this.getValueFn = getValueFn
  }

  // -----------------------------------------------------------------------
  // Generate pivot columns
  // -----------------------------------------------------------------------

  generateColumns(): PivotColumn[] {
    const { columnFields, valueFields } = this.config
    const columns: PivotColumn[] = []

    if (columnFields.length === 0) {
      // No column fields — just create value columns directly
      for (const vf of valueFields) {
        columns.push({
          id: `pivot_val_${vf.field}`,
          header: vf.label ?? `${vf.field} (${typeof vf.aggregation === 'string' ? vf.aggregation : 'custom'})`,
          path: [],
          valueField: vf.field,
          aggregation: vf.aggregation,
        })
      }
      return columns
    }

    // Collect unique column group paths
    const columnPaths = this.getUniqueColumnPaths()

    for (const path of columnPaths) {
      for (const vf of valueFields) {
        const pathLabel = path.join(' / ')
        const aggLabel = typeof vf.aggregation === 'string' ? vf.aggregation : 'custom'
        columns.push({
          id: `pivot_${path.join('_')}_${vf.field}`,
          header: valueFields.length > 1
            ? `${pathLabel} - ${vf.label ?? vf.field} (${aggLabel})`
            : pathLabel,
          path,
          valueField: vf.field,
          aggregation: vf.aggregation,
        })
      }
    }

    // Add subtotal columns if configured
    if (this.config.showColumnSubtotals && columnFields.length > 1) {
      for (const vf of valueFields) {
        columns.push({
          id: `pivot_subtotal_${vf.field}`,
          header: `Total - ${vf.label ?? vf.field}`,
          path: [],
          valueField: vf.field,
          aggregation: vf.aggregation,
          isSubtotal: true,
        })
      }
    }

    return columns
  }

  // -----------------------------------------------------------------------
  // Generate pivot rows
  // -----------------------------------------------------------------------

  generateRows(): PivotRow[] {
    const { rowFields } = this.config
    const pivotColumns = this.generateColumns()

    if (rowFields.length === 0) {
      // No row fields — single row with all data
      const values: Record<string, unknown> = {}
      for (const col of pivotColumns) {
        values[col.id] = this.aggregate(this.data, col)
      }

      return [{
        id: 'pivot_all',
        path: [],
        label: 'All',
        depth: 0,
        hasChildren: false,
        values,
        sourceRows: this.data,
      }]
    }

    const rows: PivotRow[] = []
    this.buildRowGroups(this.data, rowFields, 0, [], pivotColumns, rows)

    // Add grand total
    if (this.config.showGrandTotal) {
      const values: Record<string, unknown> = {}
      for (const col of pivotColumns) {
        values[col.id] = this.aggregate(this.data, col)
      }

      rows.push({
        id: 'pivot_grand_total',
        path: ['__grand_total__'],
        label: 'Grand Total',
        depth: 0,
        hasChildren: false,
        isGrandTotal: true,
        values,
        sourceRows: this.data,
      })
    }

    return rows
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private getUniqueColumnPaths(): string[][] {
    const { columnFields } = this.config
    const pathSet = new Set<string>()
    const paths: string[][] = []

    for (const row of this.data) {
      const path = columnFields.map((cf) => String(this.getValueFn(row, cf.field) ?? ''))
      const key = path.join('|||')
      if (!pathSet.has(key)) {
        pathSet.add(key)
        paths.push(path)
      }
    }

    // Sort paths lexicographically
    paths.sort((a, b) => {
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const cmp = (a[i] ?? '').localeCompare(b[i] ?? '')
        if (cmp !== 0) return cmp
      }
      return 0
    })

    return paths
  }

  private buildRowGroups(
    data: TData[],
    rowFields: PivotFieldConfig[],
    depth: number,
    parentPath: string[],
    pivotColumns: PivotColumn[],
    result: PivotRow[]
  ): void {
    if (depth >= rowFields.length) return

    const field = rowFields[depth]!
    const groups = new Map<string, TData[]>()

    for (const item of data) {
      const value = String(this.getValueFn(item, field.field) ?? '')
      if (!groups.has(value)) {
        groups.set(value, [])
      }
      groups.get(value)!.push(item)
    }

    // Sort group keys
    const sortedKeys = [...groups.keys()].sort()

    for (const key of sortedKeys) {
      const groupData = groups.get(key)!
      const path = [...parentPath, key]
      const hasMoreFields = depth < rowFields.length - 1

      // Aggregate values for this row group
      const values: Record<string, unknown> = {}
      for (const col of pivotColumns) {
        // Filter data by column path if applicable
        const filteredData = this.filterByColumnPath(groupData, col.path)
        values[col.id] = this.aggregate(filteredData, col)
      }

      result.push({
        id: `pivot_row_${path.join('_')}`,
        path,
        label: key,
        depth,
        hasChildren: hasMoreFields,
        values,
        sourceRows: groupData,
      })

      // Recurse into sub-groups
      if (hasMoreFields) {
        this.buildRowGroups(groupData, rowFields, depth + 1, path, pivotColumns, result)

        // Add subtotal row
        if (this.config.showRowSubtotals) {
          const subtotalValues: Record<string, unknown> = {}
          for (const col of pivotColumns) {
            const filteredData = this.filterByColumnPath(groupData, col.path)
            subtotalValues[col.id] = this.aggregate(filteredData, col)
          }

          result.push({
            id: `pivot_subtotal_${path.join('_')}`,
            path: [...path, '__subtotal__'],
            label: `${key} Total`,
            depth,
            hasChildren: false,
            isSubtotal: true,
            values: subtotalValues,
            sourceRows: groupData,
          })
        }
      }
    }
  }

  private filterByColumnPath(data: TData[], columnPath: string[]): TData[] {
    if (columnPath.length === 0) return data

    const { columnFields } = this.config
    return data.filter((item) => {
      for (let i = 0; i < columnPath.length && i < columnFields.length; i++) {
        const value = String(this.getValueFn(item, columnFields[i]!.field) ?? '')
        if (value !== columnPath[i]) return false
      }
      return true
    })
  }

  private aggregate(data: TData[], pivotCol: PivotColumn): unknown {
    if (data.length === 0) return null

    const { aggregation, valueField } = pivotCol

    if (typeof aggregation === 'function') {
      // Custom aggregation function — adapt the signature
      return aggregation(valueField, [] as any, [] as any)
    }

    // Use built-in aggregation function
    const aggFn = aggregationFns[aggregation as keyof typeof aggregationFns]
    if (!aggFn) return null

    // Create mock rows to pass to aggregation fn
    const mockRows = data.map((item, i) => ({
      id: String(i),
      index: i,
      original: item,
      depth: 0,
      subRows: [],
      getValue: (colId: string) => this.getValueFn(item, colId),
      renderValue: (colId: string) => this.getValueFn(item, colId),
      getAllCells: () => [],
      getVisibleCells: () => [],
      getLeftVisibleCells: () => [],
      getRightVisibleCells: () => [],
      getCenterVisibleCells: () => [],
      getIsSelected: () => false,
      getIsSomeSelected: () => false,
      getIsAllSubRowsSelected: () => false,
      getCanSelect: () => false,
      getCanMultiSelect: () => false,
      getCanSelectSubRows: () => false,
      toggleSelected: () => {},
      getToggleSelectedHandler: () => () => {},
      getIsExpanded: () => false,
      getCanExpand: () => false,
      getIsGrouped: () => false,
      toggleExpanded: () => {},
      getToggleExpandedHandler: () => () => {},
      getIsPinned: () => false as const,
      getCanPin: () => false,
      pin: () => {},
      getGroupingValue: (colId: string) => this.getValueFn(item, colId),
      getLeafRows: () => [],
    })) as unknown as Row<TData>[]

    return aggFn(valueField, mockRows, mockRows)
  }
}

// ---------------------------------------------------------------------------
// getPivotRowModel — integrates with table pipeline
// ---------------------------------------------------------------------------

/**
 * Generate a RowModel from pivot configuration.
 * Replaces the normal pipeline when pivot mode is active.
 */
export function getPivotRowModel<TData extends RowData>(
  table: Table<TData>,
  data: TData[],
  config: PivotConfig
): {
  rowModel: RowModel<TData>
  columns: PivotColumn[]
} {
  const getValueFn = (item: TData, field: string): unknown => {
    const column = table.getColumn(field)
    if (column?.accessorFn) {
      return column.accessorFn(item, 0)
    }
    // Fallback: direct property access
    return (item as any)[field]
  }

  const engine = new PivotEngine(data, config, getValueFn)
  const pivotColumns = engine.generateColumns()
  const pivotRows = engine.generateRows()

  // Convert PivotRows to Row<TData>
  const rows: Row<TData>[] = pivotRows.map((pr, index) => {
    const pivotData = {
      ...pr.values,
      _pivotLabel: pr.label,
      _pivotPath: pr.path,
      _pivotDepth: pr.depth,
      _pivotIsSubtotal: pr.isSubtotal,
      _pivotIsGrandTotal: pr.isGrandTotal,
      _pivotHasChildren: pr.hasChildren,
    } as unknown as TData

    const row = createRow(table, pr.id, pivotData, index, pr.depth)
    ;(row as any)._pivotRow = pr
    return row
  })

  const flatRows = rows
  const rowsById: Record<string, Row<TData>> = {}
  for (const row of flatRows) {
    rowsById[row.id] = row
  }

  return {
    rowModel: { rows, flatRows, rowsById },
    columns: pivotColumns,
  }
}

// ---------------------------------------------------------------------------
// generatePivotColumnDefs — Convert PivotColumns to ColumnDefs
// ---------------------------------------------------------------------------

/**
 * Generate ColumnDef array from PivotColumns for rendering.
 * Includes a row label column plus all generated value columns.
 */
export function generatePivotColumnDefs<TData extends RowData>(
  config: PivotConfig,
  pivotColumns: PivotColumn[]
): ColumnDef<TData, any>[] {
  const columnDefs: ColumnDef<TData, any>[] = []

  // Row label column (shows the row group value)
  if (config.rowFields.length > 0) {
    columnDefs.push({
      id: '_pivotLabel',
      header: config.rowFields.map((f) => f.label ?? f.field).join(' / '),
      accessorFn: (row: any) => row._pivotLabel ?? '',
    } as any)
  }

  // Value columns
  for (const pc of pivotColumns) {
    columnDefs.push({
      id: pc.id,
      header: pc.header,
      accessorFn: (row: any) => row[pc.id] ?? null,
    } as any)
  }

  return columnDefs
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function getInitialPivotState(): PivotState {
  return {
    enabled: false,
    config: {
      rowFields: [],
      columnFields: [],
      valueFields: [],
    },
    expandedRowGroups: {},
    expandedColumnGroups: {},
  }
}
