// @zvndev/yable-react — Pivot Config Component
// UI for configuring pivot table fields: dragging fields between
// rows, columns, and values zones.

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PivotFieldItem {
  field: string
  label: string
}

export interface PivotValueItem {
  field: string
  label: string
  aggregation: string
}

export interface PivotConfigProps {
  /** Available fields that can be dragged into zones */
  availableFields: PivotFieldItem[]
  /** Currently configured row fields */
  rowFields: PivotFieldItem[]
  /** Currently configured column fields */
  columnFields: PivotFieldItem[]
  /** Currently configured value fields */
  valueFields: PivotValueItem[]
  /** Callback when row fields change */
  onRowFieldsChange: (fields: PivotFieldItem[]) => void
  /** Callback when column fields change */
  onColumnFieldsChange: (fields: PivotFieldItem[]) => void
  /** Callback when value fields change */
  onValueFieldsChange: (fields: PivotValueItem[]) => void
  /** Available aggregation functions */
  aggregationOptions?: { value: string; label: string }[]
  /** Additional className */
  className?: string
}

// ---------------------------------------------------------------------------
// Default aggregation options
// ---------------------------------------------------------------------------

const DEFAULT_AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'mean', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'median', label: 'Median' },
  { value: 'uniqueCount', label: 'Distinct Count' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PivotConfigPanel({
  availableFields,
  rowFields,
  columnFields,
  valueFields,
  onRowFieldsChange,
  onColumnFieldsChange,
  onValueFieldsChange,
  aggregationOptions = DEFAULT_AGGREGATION_OPTIONS,
  className,
}: PivotConfigProps) {
  const [dragSource, setDragSource] = useState<{
    field: string
    zone: 'available' | 'rows' | 'columns' | 'values'
  } | null>(null)

  // Compute which fields are already placed
  const usedFields = new Set([
    ...rowFields.map((f) => f.field),
    ...columnFields.map((f) => f.field),
    ...valueFields.map((f) => f.field),
  ])

  const unplacedFields = availableFields.filter((f) => !usedFields.has(f.field))

  // -----------------------------------------------------------------------
  // Drag handlers
  // -----------------------------------------------------------------------

  const handleDragStart = useCallback(
    (field: string, zone: 'available' | 'rows' | 'columns' | 'values') => {
      setDragSource({ field, zone })
    },
    []
  )

  const handleDrop = useCallback(
    (targetZone: 'available' | 'rows' | 'columns' | 'values') => {
      if (!dragSource) return

      const { field, zone: sourceZone } = dragSource
      if (sourceZone === targetZone) {
        setDragSource(null)
        return
      }

      // Find the field item
      const fieldItem = availableFields.find((f) => f.field === field)
      if (!fieldItem) {
        setDragSource(null)
        return
      }

      // Remove from source zone
      if (sourceZone === 'rows') {
        onRowFieldsChange(rowFields.filter((f) => f.field !== field))
      } else if (sourceZone === 'columns') {
        onColumnFieldsChange(columnFields.filter((f) => f.field !== field))
      } else if (sourceZone === 'values') {
        onValueFieldsChange(valueFields.filter((f) => f.field !== field))
      }

      // Add to target zone
      if (targetZone === 'rows') {
        onRowFieldsChange([...rowFields, { field: fieldItem.field, label: fieldItem.label }])
      } else if (targetZone === 'columns') {
        onColumnFieldsChange([...columnFields, { field: fieldItem.field, label: fieldItem.label }])
      } else if (targetZone === 'values') {
        onValueFieldsChange([
          ...valueFields,
          { field: fieldItem.field, label: fieldItem.label, aggregation: 'sum' },
        ])
      }
      // targetZone === 'available' just removes it (already done above)

      setDragSource(null)
    },
    [
      dragSource,
      availableFields,
      rowFields,
      columnFields,
      valueFields,
      onRowFieldsChange,
      onColumnFieldsChange,
      onValueFieldsChange,
    ]
  )

  const handleAggregationChange = useCallback(
    (field: string, aggregation: string) => {
      onValueFieldsChange(
        valueFields.map((vf) =>
          vf.field === field ? { ...vf, aggregation } : vf
        )
      )
    },
    [valueFields, onValueFieldsChange]
  )

  const handleRemoveField = useCallback(
    (field: string, zone: 'rows' | 'columns' | 'values') => {
      if (zone === 'rows') {
        onRowFieldsChange(rowFields.filter((f) => f.field !== field))
      } else if (zone === 'columns') {
        onColumnFieldsChange(columnFields.filter((f) => f.field !== field))
      } else if (zone === 'values') {
        onValueFieldsChange(valueFields.filter((f) => f.field !== field))
      }
    },
    [rowFields, columnFields, valueFields, onRowFieldsChange, onColumnFieldsChange, onValueFieldsChange]
  )

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const classes = ['yable-pivot-config', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {/* Available Fields */}
      <div
        className="yable-pivot-zone yable-pivot-zone--available"
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          e.preventDefault()
          handleDrop('available')
        }}
      >
        <div className="yable-pivot-zone-label">Fields</div>
        <div className="yable-pivot-zone-items">
          {unplacedFields.map((f) => (
            <div
              key={f.field}
              className="yable-pivot-field"
              draggable
              onDragStart={() => handleDragStart(f.field, 'available')}
            >
              {f.label}
            </div>
          ))}
          {unplacedFields.length === 0 && (
            <div className="yable-pivot-zone-empty">All fields placed</div>
          )}
        </div>
      </div>

      {/* Row Fields Zone */}
      <DropZone
        label="Row Groups"
        zone="rows"
        items={rowFields}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onRemove={(field) => handleRemoveField(field, 'rows')}
      />

      {/* Column Fields Zone */}
      <DropZone
        label="Column Groups"
        zone="columns"
        items={columnFields}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onRemove={(field) => handleRemoveField(field, 'columns')}
      />

      {/* Value Fields Zone */}
      <div
        className="yable-pivot-zone yable-pivot-zone--values"
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          e.preventDefault()
          handleDrop('values')
        }}
      >
        <div className="yable-pivot-zone-label">Values</div>
        <div className="yable-pivot-zone-items">
          {valueFields.map((vf) => (
            <div
              key={vf.field}
              className="yable-pivot-field yable-pivot-field--value"
              draggable
              onDragStart={() => handleDragStart(vf.field, 'values')}
            >
              <span className="yable-pivot-field-label">{vf.label}</span>
              <select
                className="yable-pivot-agg-select"
                value={vf.aggregation}
                onChange={(e) =>
                  handleAggregationChange(vf.field, e.target.value)
                }
                onClick={(e) => e.stopPropagation()}
              >
                {aggregationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="yable-pivot-field-remove"
                onClick={() => handleRemoveField(vf.field, 'values')}
                aria-label={`Remove ${vf.label}`}
              >
                x
              </button>
            </div>
          ))}
          {valueFields.length === 0 && (
            <div className="yable-pivot-zone-empty">
              Drop value fields here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DropZone sub-component
// ---------------------------------------------------------------------------

function DropZone({
  label,
  zone,
  items,
  onDragStart,
  onDrop,
  onRemove,
}: {
  label: string
  zone: 'rows' | 'columns'
  items: PivotFieldItem[]
  onDragStart: (field: string, zone: 'rows' | 'columns') => void
  onDrop: (zone: 'rows' | 'columns') => void
  onRemove: (field: string) => void
}) {
  return (
    <div
      className={`yable-pivot-zone yable-pivot-zone--${zone}`}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(zone)
      }}
    >
      <div className="yable-pivot-zone-label">{label}</div>
      <div className="yable-pivot-zone-items">
        {items.map((f) => (
          <div
            key={f.field}
            className="yable-pivot-field"
            draggable
            onDragStart={() => onDragStart(f.field, zone)}
          >
            <span className="yable-pivot-field-label">{f.label}</span>
            <button
              type="button"
              className="yable-pivot-field-remove"
              onClick={() => onRemove(f.field)}
              aria-label={`Remove ${f.label}`}
            >
              x
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="yable-pivot-zone-empty">
            Drop fields here
          </div>
        )}
      </div>
    </div>
  )
}
