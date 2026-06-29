'use client'

import { useMemo } from 'react'
import { useTable, Table, TreeToggle, createColumnHelper } from '@zvndev/yable-react'
import { orgTree, type OrgNode } from '../_data'
import { DemoFrame } from '../_chrome'
import s from '../gallery.module.css'

interface OrgFlat extends OrgNode {
  path: string[]
}

function flatten(nodes: OrgNode[], parentPath: string[] = []): OrgFlat[] {
  return nodes.flatMap((n) => {
    const path = [...parentPath, n.id]
    return [{ ...n, path }, ...(n.subRows ? flatten(n.subRows, path) : [])]
  })
}

const rows = flatten(orgTree)
const col = createColumnHelper<OrgFlat>()
const usd = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`

export default function OrgDemo() {
  const columns = useMemo(
    () => [
      col.accessor('name', {
        header: 'Manager',
        size: 320,
        cell: (ctx) => (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <TreeToggle row={ctx.row} />
            <span style={{ fontWeight: ctx.row.depth === 0 ? 700 : 550 }}>
              {ctx.getValue() as string}
            </span>
          </span>
        ),
      }),
      col.accessor('title', { header: 'Title', size: 200 }),
      col.accessor('headcount', { header: 'Headcount', size: 130, cellType: 'numeric' }),
      col.accessor('budget', {
        header: 'Budget',
        size: 130,
        cell: (ctx) => usd(ctx.getValue() as number),
      }),
    ],
    [],
  )

  const table = useTable<OrgFlat>({
    data: rows,
    columns,
    getRowId: (r) => r.path.join('/'),
    treeData: true,
    getDataPath: (r) => r.path,
    enableExpanding: true,
    initialState: {
      expanded: { ceo: true, 'ceo/cto': true, 'ceo/cdo': true, 'ceo/cro': true },
    },
  })

  return (
    <DemoFrame slug="org">
      <div className={s.controls}>
        <button className={s.btn} onClick={() => table.toggleAllRowsExpanded(true)}>
          Expand all
        </button>
        <button className={s.btn} onClick={() => table.toggleAllRowsExpanded(false)}>
          Collapse all
        </button>
        <span className={s.statPill}>
          <b>{rows.length}</b> nodes · 5 levels deep
        </span>
      </div>
      <Table table={table} className="yable-theme-forest" />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        Hierarchy comes from <code>treeData</code> + <code>getDataPath</code>; the chevron is{' '}
        <code>&lt;TreeToggle&gt;</code>, indented by <code>row.depth</code>. Expansion re-flattens
        the model in core.
      </p>
    </DemoFrame>
  )
}
