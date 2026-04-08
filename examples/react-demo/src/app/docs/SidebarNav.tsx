'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Doc } from '@/lib/docs'
import s from './docs.module.css'

interface SidebarNavProps {
  docs: Pick<Doc, 'slug' | 'label' | 'sections'>[]
}

export function SidebarNav({ docs }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className={s.sidebarInner}>
      <div className={s.navGroup}>
        <Link
          href="/docs"
          className={`${s.navLink} ${pathname === '/docs' ? s.navLinkActive : ''}`}
        >
          Overview
        </Link>
      </div>

      {docs.map((doc) => {
        const docHref = `/docs/${doc.slug}`
        const isDocActive = pathname === docHref
        const isWithinDoc = pathname.startsWith(`${docHref}/`) || isDocActive
        return (
          <div key={doc.slug} className={s.navGroup}>
            <Link
              href={docHref}
              className={`${s.navGroupLabel} ${s.navGroupLabelLink} ${
                isWithinDoc ? s.navGroupLabelActive : ''
              }`}
            >
              {doc.label}
            </Link>
            {isWithinDoc && doc.sections.length > 0 && (
              <ul className={s.navList}>
                {doc.sections.map((section) => {
                  const sectionHref = `/docs/${doc.slug}/${section.slug}`
                  const isActive = pathname === sectionHref
                  return (
                    <li key={section.slug}>
                      <Link
                        href={sectionHref}
                        className={`${s.navLink} ${isActive ? s.navLinkActive : ''}`}
                      >
                        {section.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}

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
    </nav>
  )
}
