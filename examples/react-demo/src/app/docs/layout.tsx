import Link from 'next/link'
import 'highlight.js/styles/github-dark.css'
import { DOCS } from '@/lib/docs'
import { SidebarNav, type SidebarNavDoc } from './SidebarNav'
import s from './docs.module.css'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  // Strip down each Doc to just what the sidebar renders, so we don't ship
  // every section's full markdown content to the client bundle.
  const navDocs: SidebarNavDoc[] = DOCS.map((d) => ({
    slug: d.slug,
    label: d.label,
    sections: d.sections.map((sec) => ({
      slug: sec.slug,
      title: sec.title,
    })),
  }))

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
          <SidebarNav docs={navDocs} />
        </aside>

        <main className={s.main}>{children}</main>
      </div>
    </div>
  )
}
