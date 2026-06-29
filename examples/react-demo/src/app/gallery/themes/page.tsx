'use client'

import { useMemo, useState } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'
import { makeEmployees, type Employee } from '../_data'
import { DemoFrame } from '../_chrome'
import s from '../gallery.module.css'

const col = createColumnHelper<Employee>()
const THEMES = [
  'default',
  'midnight',
  'stripe',
  'compact',
  'ocean',
  'forest',
  'rose',
  'mono',
] as const
type ThemeName = (typeof THEMES)[number]
const DARK_THEMES = new Set<ThemeName>(['midnight'])

export default function ThemesDemo() {
  const [theme, setTheme] = useState<ThemeName>('midnight')
  const [striped, setStriped] = useState(true)
  const [bordered, setBordered] = useState(false)
  const [compact, setCompact] = useState(false)

  const data = useMemo(() => makeEmployees(8), [])
  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Name', size: 170 }),
      col.accessor('department', {
        header: 'Department',
        size: 140,
        cellType: 'badge',
        cellTypeProps: { variant: 'accent', appearance: 'soft' },
      }),
      col.accessor('level', { header: 'Level', size: 110 }),
      col.accessor('location', { header: 'Location', size: 150 }),
      col.accessor('salary', { header: 'Salary', size: 130, cellType: 'currency' }),
      col.accessor('performance', {
        header: 'Score',
        size: 150,
        cellType: 'progress',
        cellTypeProps: { max: 100, showLabel: true },
      }),
    ],
    [],
  )

  const table = useTable<Employee>({ data, columns, getRowId: (e) => String(e.id) })

  return (
    <DemoFrame slug="themes">
      <div className={s.controls}>
        {THEMES.map((t) => (
          <button
            key={t}
            className={theme === t ? `${s.btn} ${s.btnActive}` : s.btn}
            onClick={() => setTheme(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className={s.controls}>
        <button
          className={striped ? `${s.btn} ${s.btnActive}` : s.btn}
          onClick={() => setStriped((v) => !v)}
        >
          Striped
        </button>
        <button
          className={bordered ? `${s.btn} ${s.btnActive}` : s.btn}
          onClick={() => setBordered((v) => !v)}
        >
          Bordered
        </button>
        <button
          className={compact ? `${s.btn} ${s.btnActive}` : s.btn}
          onClick={() => setCompact((v) => !v)}
        >
          Compact
        </button>
      </div>
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: DARK_THEMES.has(theme) ? '#0d1117' : '#ffffff',
          transition: 'background 0.2s',
        }}
      >
        <Table
          table={table}
          className={`yable-theme-${theme}`}
          striped={striped}
          bordered={bordered}
          compact={compact}
        />
      </div>
      <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a7d6b' }}>
        Same table, eight shipped themes. Each is a CSS file of custom properties applied via{' '}
        <code>className=&quot;yable-theme-{theme}&quot;</code> — plus live <code>striped</code> /{' '}
        <code>bordered</code> / <code>compact</code> props.
      </p>
    </DemoFrame>
  )
}
