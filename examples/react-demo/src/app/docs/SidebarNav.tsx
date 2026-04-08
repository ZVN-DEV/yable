'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import s from './docs.module.css'

export interface SidebarNavDoc {
  slug: string
  label: string
  sections: { slug: string; title: string }[]
}

interface SidebarNavProps {
  docs: SidebarNavDoc[]
}

export function SidebarNav({ docs }: SidebarNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className={s.sidebarToggle}
        aria-expanded={open}
        aria-controls="docs-sidebar-nav"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={s.sidebarToggleIcon} aria-hidden="true">
          {open ? '\u2715' : '\u2630'}
        </span>
        <span className={s.sidebarToggleLabel}>
          {open ? 'Close menu' : 'Browse docs'}
        </span>
      </button>

      <nav
        id="docs-sidebar-nav"
        className={`${s.sidebarInner} ${open ? s.sidebarInnerOpen : ''}`}
      >
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
    </>
  )
}
