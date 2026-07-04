'use client'

import { useMemo } from 'react'
import {
  useTable,
  Table,
  createColumnHelper,
  type AdaptiveTableCardContext,
} from '@zvndev/yable-react'
import { DemoFrame } from '../_chrome'
import s from './adaptive.module.css'

interface Account {
  id: string
  account: string
  owner: string
  segment: 'Enterprise' | 'Mid-market' | 'Startup'
  health: 'Expansion' | 'Stable' | 'Watch' | 'At risk'
  arr: number
  users: number
  renewal: string
  activity: string
}

const accounts: Account[] = [
  {
    id: 'northstar',
    account: 'Northstar Labs',
    owner: 'Mira Chen',
    segment: 'Enterprise',
    health: 'Expansion',
    arr: 128000,
    users: 88,
    renewal: '2026-08-14',
    activity: 'Exec review booked',
  },
  {
    id: 'redwood',
    account: 'Redwood Bank',
    owner: 'Jon Bell',
    segment: 'Enterprise',
    health: 'Stable',
    arr: 214000,
    users: 142,
    renewal: '2026-09-02',
    activity: 'Security review',
  },
  {
    id: 'bluebird',
    account: 'Bluebird Health',
    owner: 'Anika Rao',
    segment: 'Mid-market',
    health: 'Watch',
    arr: 94000,
    users: 61,
    renewal: '2026-07-28',
    activity: 'Usage down 12%',
  },
  {
    id: 'signal',
    account: 'Signal Forge',
    owner: 'Luis Ortega',
    segment: 'Startup',
    health: 'Expansion',
    arr: 52000,
    users: 34,
    renewal: '2026-10-19',
    activity: 'New workspace added',
  },
  {
    id: 'harbor',
    account: 'Harbor FreightOps',
    owner: 'Priya Shah',
    segment: 'Mid-market',
    health: 'At risk',
    arr: 76000,
    users: 49,
    renewal: '2026-07-11',
    activity: 'Champion changed',
  },
  {
    id: 'atlas',
    account: 'Atlas Robotics',
    owner: 'Theo Morgan',
    segment: 'Enterprise',
    health: 'Stable',
    arr: 168000,
    users: 117,
    renewal: '2026-11-05',
    activity: 'Pilot expansion',
  },
]

const col = createColumnHelper<Account>()

const healthClass: Record<Account['health'], string> = {
  Expansion: s.healthExpansion,
  Stable: s.healthStable,
  Watch: s.healthWatch,
  'At risk': s.healthRisk,
}

export default function AdaptiveDemo() {
  const columns = useMemo(
    () => [
      col.accessor('account', { header: 'Account', size: 210, enableSorting: true }),
      col.accessor('owner', { header: 'Owner', size: 150, enableSorting: true }),
      col.accessor('segment', { header: 'Segment', size: 140, enableSorting: true }),
      col.accessor('health', {
        header: 'Health',
        size: 130,
        enableSorting: true,
        cell: (ctx) => (
          <span className={`${s.health} ${healthClass[ctx.getValue() as Account['health']]}`}>
            {ctx.getValue() as string}
          </span>
        ),
      }),
      col.accessor('arr', {
        header: 'ARR',
        size: 120,
        enableSorting: true,
        cell: (ctx) => `$${(ctx.getValue() as number).toLocaleString()}`,
      }),
      col.accessor('users', { header: 'Users', size: 90, enableSorting: true }),
      col.accessor('renewal', {
        header: 'Renewal',
        size: 130,
        enableSorting: true,
        cell: (ctx) =>
          new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
            new Date(ctx.getValue() as string),
          ),
      }),
      col.accessor('activity', { header: 'Latest activity', size: 220 }),
    ],
    [],
  )

  const table = useTable<Account>({
    data: accounts,
    columns,
    getRowId: (row) => row.id,
    enableRowClickSelection: true,
    initialState: { pagination: { pageIndex: 0, pageSize: accounts.length } },
  })

  const selectedCount = Object.keys(table.getState().rowSelection).length

  return (
    <DemoFrame slug="adaptive">
      <div className={s.toolbar}>
        <div className={s.modeCopy}>
          <strong>One table instance</strong>
          <span>Resize the viewport: desktop grid, tablet card board, phone card feed.</span>
        </div>
        <div className={s.actions}>
          <button
            type="button"
            className={s.button}
            onClick={() => table.setSorting([{ id: 'arr', desc: true }])}
          >
            ARR high to low
          </button>
          <button type="button" className={s.button} onClick={() => table.resetSorting(true)}>
            Natural order
          </button>
          <span className={s.selectionCount} data-testid="adaptive-selected-count">
            Selected: {selectedCount}
          </span>
        </div>
      </div>

      <Table
        table={table}
        className={`${s.adaptiveTable} yable-theme-ocean`}
        striped
        bordered
        stickyHeader
        clickableRows
        adaptiveLayout={{
          breakpoint: 860,
          primaryColumnId: 'account',
          secondaryColumnIds: ['health', 'arr', 'owner', 'renewal', 'users', 'activity'],
          renderCard: renderAccountCard,
        }}
        ariaLabel="Adaptive account health table"
        data-testid="adaptive-table"
      />

      <p className={s.note}>
        The table API stays the same. Product teams can keep one column model, one sort/filter
        state, one selection model, and one event stream while swapping the rendered structure at a
        container breakpoint.
      </p>
    </DemoFrame>
  )
}

function renderAccountCard({ row }: AdaptiveTableCardContext<Account>) {
  const account = row.original

  return (
    <div className={s.accountCard} data-testid="adaptive-account-card-content">
      <div className={s.cardTopline}>
        <span className={`${s.health} ${healthClass[account.health]}`}>{account.health}</span>
        <span className={s.segment}>{account.segment}</span>
      </div>
      <div className={s.cardTitle}>{account.account}</div>
      <div className={s.cardMeta}>
        <span>{account.owner}</span>
        <span>
          {new Intl.NumberFormat('en', { notation: 'compact' }).format(account.users)} users
        </span>
      </div>
      <div className={s.cardMetrics}>
        <span>
          <small>ARR</small>${account.arr.toLocaleString()}
        </span>
        <span>
          <small>Renewal</small>
          {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
            new Date(account.renewal),
          )}
        </span>
      </div>
      <div className={s.activity}>{account.activity}</div>
    </div>
  )
}
