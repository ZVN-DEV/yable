'use client'

import { useMemo } from 'react'
import { useTable, Table, createColumnHelper, type CellContext } from '@zvndev/yable-react'
import { players, type Player } from '../_data'
import { DemoFrame } from '../_chrome'

const col = createColumnHelper<Player>()

function rankCell(ctx: CellContext<Player, unknown>) {
  const i = ctx.row.index
  const medal = ['🥇', '🥈', '🥉'][i]
  return (
    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      {medal ?? `#${i + 1}`}
    </span>
  )
}

export default function LeaderboardDemo() {
  const columns = useMemo(
    () => [
      col.display({ id: 'rank', header: '#', size: 64, cell: rankCell }),
      col.accessor('handle', {
        header: 'Player',
        size: 200,
        cell: (ctx) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{ctx.row.original.country}</span>
            <span style={{ fontWeight: 600 }}>{ctx.getValue() as string}</span>
          </span>
        ),
      }),
      col.accessor('tier', {
        header: 'Tier',
        size: 120,
        cellType: 'badge',
        cellTypeProps: { variant: 'accent', appearance: 'soft' },
      }),
      col.accessor('level', { header: 'Lvl', size: 80, cellType: 'numeric' }),
      col.accessor('winRate', {
        header: 'Win rate',
        size: 160,
        cellType: 'progress',
        cellTypeProps: { max: 100, showLabel: true, variant: 'success' },
      }),
      col.accessor('streak', {
        header: 'Streak',
        size: 100,
        cell: (ctx) => <span>{(ctx.getValue() as number) > 0 ? `🔥 ${ctx.getValue()}` : '—'}</span>,
      }),
      col.accessor('score', {
        header: 'Score',
        size: 120,
        cellType: 'numeric',
        cellStyle: { fontWeight: 700 },
      }),
    ],
    [],
  )

  const table = useTable<Player>({
    data: players,
    columns,
    getRowId: (p) => p.handle,
    initialState: { sorting: [{ id: 'score', desc: true }] },
  })

  return (
    <DemoFrame slug="leaderboard">
      <Table table={table} className="yable-theme-rose" striped />
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        Click a header to re-sort — the rank column reads <code>row.index</code>, so medals follow
        the live order.
      </p>
    </DemoFrame>
  )
}
