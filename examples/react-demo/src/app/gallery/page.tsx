import Link from 'next/link'
import s from './gallery.module.css'
import { DEMOS } from './_registry'

export default function GalleryIndex() {
  const simple = DEMOS.filter((d) => d.kind === 'simple')
  const complex = DEMOS.filter((d) => d.kind === 'complex')

  return (
    <main className={s.page}>
      <div className={s.topbar}>
        <Link href="/" className={s.brand}>
          yable<span>/gallery</span>
        </Link>
        <a
          className={s.topLink}
          href="https://github.com/ZVN-DEV/yable"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </div>

      <header className={s.hero}>
        <p className={s.heroEyebrow}>The showcase</p>
        <h1 className={s.heroTitle}>
          One engine. <em>Twelve very different tables.</em>
        </h1>
        <p className={s.heroSub}>
          The same <code style={{ fontFamily: 'var(--font-mono)' }}>@zvndev/yable-react</code>{' '}
          powering a 30-second contact list, a 50,000-row virtualized grid, a real formula
          spreadsheet, pivots, row grouping, and a live-ticking trading terminal — each in a
          different shipped theme.
        </p>
      </header>

      <p className={s.sectionLabel}>Start simple</p>
      <Cards items={simple} />

      <p className={s.sectionLabel}>Then go deep</p>
      <Cards items={complex} />
    </main>
  )
}

function Cards({ items }: { items: typeof DEMOS }) {
  return (
    <div className={s.grid}>
      {items.map((d) => (
        <Link
          key={d.slug}
          href={`/gallery/${d.slug}`}
          className={s.card}
          style={{ ['--accent' as string]: d.accent } as React.CSSProperties}
        >
          <span className={s.cardKind}>
            {d.kind === 'simple' ? 'Simple' : 'Complex'} · {d.theme}
          </span>
          <h2 className={s.cardTitle}>{d.title}</h2>
          <p className={s.cardBlurb}>{d.blurb}</p>
          <div className={s.tags}>
            {d.tags.map((t) => (
              <span key={t} className={s.tag}>
                {t}
              </span>
            ))}
          </div>
          <span className={s.cardGo}>Open demo →</span>
        </Link>
      ))}
    </div>
  )
}
