'use client'

import { useMemo } from 'react'
import {
  useTable,
  Table,
  Pagination,
  selectColumn,
  createColumnHelper,
  type CellContext,
} from '@zvndev/yable-react'
import { projects, type Project } from '../_data'
import { DemoFrame } from '../_chrome'

const col = createColumnHelper<Project>()
const PRIORITY_COLOR: Record<Project['priority'], string> = {
  Low: '#6b7280',
  Medium: '#2563eb',
  High: '#d97706',
  Critical: '#dc2626',
}

function expandCell(ctx: CellContext<Project, unknown>) {
  const expanded = ctx.row.getIsExpanded()
  return (
    <button
      type="button"
      onClick={ctx.row.getToggleExpandedHandler()}
      aria-label={expanded ? 'Collapse' : 'Expand'}
      style={{
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        fontSize: 12,
        color: 'inherit',
        transform: expanded ? 'rotate(90deg)' : 'none',
        transition: 'transform 0.15s',
      }}
    >
      ▸
    </button>
  )
}

export default function ProjectsDemo() {
  const columns = useMemo(
    () => [
      selectColumn<Project>(),
      col.display({ id: 'expand', header: '', size: 44, cell: expandCell }),
      col.accessor('id', { header: 'ID', size: 90 }),
      col.accessor('name', { header: 'Project', size: 200 }),
      col.accessor('status', {
        header: 'Status',
        size: 130,
        cellType: 'status',
        cellTypeProps: {
          colorMap: {
            'On track': 'success',
            'At risk': 'warning',
            Delayed: 'danger',
            Done: 'info',
          },
        },
      }),
      col.accessor('priority', {
        header: 'Priority',
        size: 110,
        cell: (ctx) => (
          <span
            style={{
              color: PRIORITY_COLOR[ctx.getValue() as Project['priority']],
              fontWeight: 600,
            }}
          >
            {ctx.getValue() as string}
          </span>
        ),
      }),
      col.accessor('progress', {
        header: 'Progress',
        size: 160,
        cellType: 'progress',
        cellTypeProps: { max: 100, showLabel: true },
      }),
      col.accessor('due', {
        header: 'Due',
        size: 130,
        cellType: 'date',
        cellTypeProps: { format: 'medium' },
      }),
    ],
    [],
  )

  const table = useTable<Project>({
    data: projects,
    columns,
    getRowId: (p) => p.id,
    enableExpanding: true,
    renderDetailPanel: (row) => {
      const p = row.original
      const pctSpent = Math.round((p.spent / p.budget) * 100)
      return (
        <div
          style={{
            padding: '14px 20px',
            display: 'grid',
            gap: 14,
            gridTemplateColumns: '1.4fr 1fr',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: 0.6,
                marginBottom: 8,
              }}
            >
              Tasks
            </div>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
              {p.tasks.map((t) => (
                <li
                  key={t.name}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}
                >
                  <span>{t.done ? '✅' : '⬜️'}</span>
                  <span
                    style={{
                      textDecoration: t.done ? 'line-through' : 'none',
                      opacity: t.done ? 0.6 : 1,
                    }}
                  >
                    {t.name}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.6 }}>{t.owner}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: 0.6,
                marginBottom: 8,
              }}
            >
              Budget
            </div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>
              ${p.spent.toLocaleString()} of ${p.budget.toLocaleString()} ({pctSpent}%)
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: 'rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pctSpent}%`,
                  background: pctSpent > 90 ? '#dc2626' : '#635bff',
                }}
              />
            </div>
          </div>
        </div>
      )
    },
    initialState: { pagination: { pageIndex: 0, pageSize: 4 } },
  })

  return (
    <DemoFrame slug="projects">
      <Table table={table} className="yable-theme-stripe" />
      <div style={{ marginTop: 14 }}>
        <Pagination table={table} />
      </div>
      <p style={{ marginTop: 14, fontSize: 13.5, color: '#8a7d6b' }}>
        Click the ▸ to expand a row into its <code>renderDetailPanel</code> — task checklist and
        budget burn, composed from <code>row.original</code>.
      </p>
    </DemoFrame>
  )
}
