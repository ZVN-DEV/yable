'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Table,
  createColumnHelper,
  useServerTable,
  type ServerTableFetchArgs,
  type ServerTableUpdateArgs,
} from '@zvndev/yable-react'
import { DemoFrame } from '../_chrome'
import s from './server-data.module.css'

type Health = 'Active' | 'Review' | 'At Risk' | 'Blocked'

interface ServerAccount {
  id: string
  account: string
  owner: string
  region: string
  health: Health
  arr: number
  activity: string
}

const PAGE_SIZE = 6
const col = createColumnHelper<ServerAccount>()

const database: ServerAccount[] = [
  {
    id: 'atlas',
    account: 'Atlas Finance',
    owner: 'Mina Patel',
    region: 'North America',
    health: 'Review',
    arr: 186000,
    activity: 'Legal review pending',
  },
  {
    id: 'borrealis',
    account: 'Borealis Labs',
    owner: 'Iris Chen',
    region: 'EMEA',
    health: 'Active',
    arr: 248000,
    activity: 'Expansion proposal drafted',
  },
  {
    id: 'cinder',
    account: 'Cinder Retail',
    owner: 'Mateo Cruz',
    region: 'LATAM',
    health: 'Review',
    arr: 132000,
    activity: 'Pilot scope updated',
  },
  {
    id: 'delta',
    account: 'Delta Manufacturing',
    owner: 'Nora Singh',
    region: 'APAC',
    health: 'At Risk',
    arr: 305000,
    activity: 'Procurement blocked on security',
  },
  {
    id: 'ember',
    account: 'Ember Energy',
    owner: 'Hana Ito',
    region: 'North America',
    health: 'Active',
    arr: 412000,
    activity: 'Usage review complete',
  },
  {
    id: 'foxtrot',
    account: 'Foxtrot Media',
    owner: 'Jules Meyer',
    region: 'EMEA',
    health: 'Review',
    arr: 158000,
    activity: 'Budget approval scheduled',
  },
  {
    id: 'granite',
    account: 'Granite Works',
    owner: 'Sam Rivera',
    region: 'North America',
    health: 'Active',
    arr: 524000,
    activity: 'Rollout milestone hit',
  },
  {
    id: 'helio',
    account: 'Helio Transit',
    owner: 'Ari Morgan',
    region: 'APAC',
    health: 'At Risk',
    arr: 278000,
    activity: 'SLA exception under review',
  },
  {
    id: 'ion',
    account: 'Ion Security',
    owner: 'Lina Park',
    region: 'EMEA',
    health: 'Active',
    arr: 612000,
    activity: 'Threat model accepted',
  },
  {
    id: 'juniper',
    account: 'Juniper Systems',
    owner: 'Noah Brooks',
    region: 'North America',
    health: 'Review',
    arr: 376000,
    activity: 'Architecture workshop booked',
  },
  {
    id: 'kestrel',
    account: 'Kestrel Health',
    owner: 'Priya Shah',
    region: 'APAC',
    health: 'Active',
    arr: 454000,
    activity: 'Care-team rollout queued',
  },
  {
    id: 'lumen',
    account: 'Lumen Freight',
    owner: 'Oscar Klein',
    region: 'LATAM',
    health: 'Review',
    arr: 221000,
    activity: 'Integration mapping in progress',
  },
  {
    id: 'northwind',
    account: 'Northwind Health',
    owner: 'Vera Okafor',
    region: 'North America',
    health: 'Active',
    arr: 920000,
    activity: 'Executive sponsor aligned',
  },
  {
    id: 'opal',
    account: 'Opal Bank',
    owner: 'Ravi Nair',
    region: 'EMEA',
    health: 'At Risk',
    arr: 498000,
    activity: 'Risk exception awaiting sign-off',
  },
  {
    id: 'slowpoke',
    account: 'Slowpoke Logistics',
    owner: 'Mara Vale',
    region: 'APAC',
    health: 'Review',
    arr: 264000,
    activity: 'Legacy migration estimate pending',
  },
  {
    id: 'tandem',
    account: 'Tandem Bio',
    owner: 'Kai Lewis',
    region: 'North America',
    health: 'Active',
    arr: 704000,
    activity: 'Clinical team onboarding',
  },
  {
    id: 'umbra',
    account: 'Umbra Robotics',
    owner: 'Elena Rossi',
    region: 'EMEA',
    health: 'Review',
    arr: 336000,
    activity: 'Factory acceptance testing',
  },
  {
    id: 'zenith',
    account: 'Zenith Cloud',
    owner: 'Theo Grant',
    region: 'North America',
    health: 'Active',
    arr: 1040000,
    activity: 'Global expansion signed',
  },
]

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default function ServerDataDemo() {
  const overridesRef = useRef(new Map<string, Partial<ServerAccount>>())
  const requestSeq = useRef(0)
  const [events, setEvents] = useState<string[]>([
    'Server controller ready: filter, sort, cursor load, and optimistic updates share one table.',
  ])

  const pushEvent = useCallback((event: string) => {
    setEvents((current) => [event, ...current].slice(0, 6))
  }, [])

  const columns = useMemo(
    () => [
      col.accessor('account', { header: 'Account', size: 190, enableSorting: true }),
      col.accessor('owner', { header: 'Owner', size: 140, enableSorting: true }),
      col.accessor('region', { header: 'Region', size: 130, enableSorting: true }),
      col.accessor('health', {
        header: 'Status',
        size: 120,
        enableSorting: true,
        cellType: 'status',
        cellTypeProps: {
          colorMap: {
            Active: 'success',
            Review: 'info',
            'At Risk': 'warning',
            Blocked: 'danger',
          },
        },
      }),
      col.accessor('arr', {
        header: 'ARR',
        size: 130,
        enableSorting: true,
        cell: (ctx) => money.format(ctx.getValue() as number),
      }),
      col.accessor('activity', { header: 'Latest activity', size: 260 }),
    ],
    [],
  )

  const fetchData = useCallback(
    async ({ cursor, globalFilter, sorting, pagination, signal }: ServerTableFetchArgs) => {
      const requestId = ++requestSeq.current
      const query = globalFilter.trim().toLowerCase()
      const sort = sorting[0]
      const pageSize = pagination.pageSize || PAGE_SIZE
      const start = typeof cursor === 'number' ? cursor : 0
      const sortLabel = sort ? `${sort.id} ${sort.desc ? 'desc' : 'asc'}` : 'none'

      pushEvent(
        `Fetch #${requestId}: cursor ${start}; sort=${sortLabel}; filter="${query || 'none'}".`,
      )
      await delay(query === 'slow' ? 720 : 180)

      if (signal.aborted) {
        pushEvent(`Ignored stale response for "${query || 'all'}".`)
      }

      let rows = database.map((row) => ({ ...row, ...overridesRef.current.get(row.id) }))
      if (query) {
        rows = rows.filter((row) =>
          Object.values(row).some((value) => String(value).toLowerCase().includes(query)),
        )
      }

      if (sort && sort.id !== '_select') {
        rows = [...rows].sort((a, b) => {
          const left = a[sort.id as keyof ServerAccount]
          const right = b[sort.id as keyof ServerAccount]
          const result =
            typeof left === 'number' && typeof right === 'number'
              ? left - right
              : String(left).localeCompare(String(right))
          return sort.desc ? -result : result
        })
      }

      const page = rows.slice(start, start + pageSize)
      return {
        rows: page,
        cursor: start + page.length,
        hasMore: start + page.length < rows.length,
        rowCount: rows.length,
      }
    },
    [pushEvent],
  )

  const updateRow = useCallback(
    async ({ rowId, patch, signal }: ServerTableUpdateArgs<ServerAccount>) => {
      pushEvent(`Sending optimistic update for ${rowId}.`)
      await delay(620)
      if (signal.aborted) return

      if (patch.health === 'Blocked') {
        pushEvent(`Server rejected ${rowId}; local row rolled back.`)
        throw new Error(`Server rejected ${rowId}`)
      }

      const canonical: Partial<ServerAccount> = {
        ...patch,
        activity:
          rowId === 'atlas' ? 'Server confirmed approval' : 'Server returned canonical values',
      }
      overridesRef.current.set(rowId, { ...overridesRef.current.get(rowId), ...canonical })
      pushEvent(`Server saved ${rowId} and returned canonical values.`)
      return canonical
    },
    [pushEvent],
  )

  const server = useServerTable<ServerAccount>({
    columns,
    fetchData,
    updateRow,
    getRowId: (row) => row.id,
    initialPagination: { pageIndex: 0, pageSize: PAGE_SIZE },
  })

  const loadedLabel = `Loaded ${server.rows.length} of ${server.rowCount ?? database.length}`

  const runRace = useCallback(() => {
    server.table.setGlobalFilter('slow')
    window.setTimeout(() => server.table.setGlobalFilter('northwind'), 80)
  }, [server.table])

  return (
    <DemoFrame slug="server-data">
      <section className={s.shell} data-testid="server-data-demo">
        <div className={s.toolbar}>
          <label className={s.search}>
            <span>Search server accounts</span>
            <input
              aria-label="Search server accounts"
              value={server.globalFilter}
              onChange={(event) => server.table.setGlobalFilter(event.target.value)}
              placeholder="Try north, slow, APAC..."
            />
          </label>
          <div className={s.actions}>
            <button
              type="button"
              onClick={() => server.table.setSorting([{ id: 'arr', desc: true }])}
            >
              ARR high to low
            </button>
            <button
              type="button"
              onClick={() => void server.loadMore()}
              disabled={!server.hasMore || server.loading}
            >
              {server.loading ? 'Fetching...' : 'Load next page'}
            </button>
            <button type="button" onClick={runRace}>
              Run stale search race
            </button>
          </div>
        </div>

        <div className={s.metrics}>
          <span data-testid="server-loaded-count">{loadedLabel}</span>
          <span data-testid="server-status">{server.loading ? 'Fetching' : 'Idle'}</span>
          <span>{server.hasMore ? 'More rows available' : 'Window complete'}</span>
        </div>

        {server.error ? (
          <div className={s.error} role="alert" data-testid="server-error">
            Last error:{' '}
            {server.error instanceof Error ? server.error.message : String(server.error)}
          </div>
        ) : null}

        <div className={s.updateRail}>
          <button
            type="button"
            onClick={() =>
              void server.updateRow('atlas', {
                health: 'Active',
                activity: 'Approval sent to server',
              })
            }
          >
            Approve Atlas
          </button>
          <button
            type="button"
            onClick={() =>
              void server.updateRow('delta', {
                health: 'Blocked',
                activity: 'Rejected write should roll back',
              })
            }
          >
            Force rejected Delta update
          </button>
        </div>

        <Table
          table={server.table}
          theme="forest"
          striped
          bordered
          stickyHeader
          ariaLabel="Server-backed accounts table"
        />

        <div className={s.log} data-testid="server-log">
          <div className={s.logHeader}>
            <strong>Server Process</strong>
            <span>request {requestSeq.current}</span>
          </div>
          {events.map((event, index) => (
            <div className={s.logItem} key={`${event}-${index}`}>
              {event}
            </div>
          ))}
        </div>
      </section>
    </DemoFrame>
  )
}
