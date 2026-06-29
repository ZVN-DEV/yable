import Link from 'next/link'
import type { ReactNode } from 'react'
import s from './gallery.module.css'
import { DEMOS, getDemo, type DemoMeta } from './_registry'

// Light themes render on a light pane; everything else sits on the dark stage.
const LIGHT_THEMES = new Set(['default', 'stripe', 'compact', 'mono', 'rose', 'forest', 'ocean'])

export function DemoFrame({ slug, children }: { slug: string; children: ReactNode }) {
  const demo = getDemo(slug)!
  const idx = DEMOS.findIndex((d) => d.slug === slug)
  const prev = idx > 0 ? DEMOS[idx - 1] : undefined
  const next = idx < DEMOS.length - 1 ? DEMOS[idx + 1] : undefined
  const accent = { ['--accent' as string]: demo.accent } as React.CSSProperties

  return (
    <main className={s.frame} style={accent}>
      <nav className={s.crumbs}>
        <Link href="/gallery">Gallery</Link>
        <span>/</span>
        <span>{demo.title}</span>
      </nav>

      <header>
        <div className={s.frameHead}>
          <h1 className={s.frameTitle}>{demo.title}</h1>
          <span className={s.themeBadge}>{demo.theme} theme</span>
        </div>
        <p className={s.frameBlurb}>{demo.blurb}</p>
        <div className={s.frameTags}>
          {demo.tags.map((t) => (
            <span key={t} className={s.tag}>
              {t}
            </span>
          ))}
        </div>
      </header>

      <div className={LIGHT_THEMES.has(demo.theme) ? `${s.stage} ${s.stageLight}` : s.stage}>
        {children}
      </div>

      <nav className={s.nav}>
        {prev ? (
          <Link className={s.navLink} href={`/gallery/${prev.slug}`}>
            <small>← Previous</small>
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className={`${s.navLink} ${s.navLinkNext}`} href={`/gallery/${next.slug}`}>
            <small>Next →</small>
            {next.title}
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  )
}

export type { DemoMeta }
