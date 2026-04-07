import Link from 'next/link'
import 'highlight.js/styles/github-dark.css'
import s from './docs.module.css'

const navGroups = [
  {
    label: 'Start here',
    items: [
      { slug: '', title: 'Quickstart' },
      { slug: 'features', title: 'Features' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { slug: 'api', title: 'API reference' },
      { slug: 'async-commits', title: 'Async commits' },
    ],
  },
] as const

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <div className={s.topbarInner}>
          <Link href="/" className={s.brand}>
            <span className={s.brandMark}>Y</span>
            <span className={s.brandName}>Yable</span>
            <span className={s.brandDivider} />
            <span className={s.brandKicker}>Docs</span>
          </Link>
          <nav className={s.topNav}>
            <Link href="/" className={s.topLink}>
              Demo
            </Link>
            <Link href="/playground" className={s.topLink}>
              Playground
            </Link>
            <a
              href="https://github.com/ZVN-DEV/yable"
              target="_blank"
              rel="noreferrer"
              className={s.topLink}
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@zvndev/yable-react"
              target="_blank"
              rel="noreferrer"
              className={s.topLink}
            >
              npm
            </a>
          </nav>
        </div>
      </header>

      <div className={s.body}>
        <aside className={s.sidebar}>
          <div className={s.sidebarInner}>
            {navGroups.map((group) => (
              <div key={group.label} className={s.navGroup}>
                <span className={s.navGroupLabel}>{group.label}</span>
                <ul className={s.navList}>
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={item.slug ? `/docs/${item.slug}` : '/docs'}
                        className={s.navLink}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className={s.navFooter}>
              <p className={s.navFooterText}>
                Docs are mirrored from{' '}
                <a
                  href="https://github.com/ZVN-DEV/yable/tree/main/docs"
                  target="_blank"
                  rel="noreferrer"
                  className={s.navFooterLink}
                >
                  github.com/ZVN-DEV/yable/docs
                </a>
              </p>
            </div>
          </div>
        </aside>

        <main className={s.main}>
          <article className={s.article}>{children}</article>
        </main>
      </div>
    </div>
  )
}
