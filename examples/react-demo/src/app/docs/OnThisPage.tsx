'use client'

import { useEffect, useState } from 'react'
import type { Heading } from '@/lib/docs'
import s from './docs.module.css'

interface OnThisPageProps {
  headings: Heading[]
}

export function OnThisPage({ headings }: OnThisPageProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    headings[0]?.slug ?? null
  )

  useEffect(() => {
    if (headings.length === 0) return

    const elements = headings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveSlug(visible[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <aside className={s.onThisPage}>
      <p className={s.onThisPageLabel}>On this page</p>
      <ul className={s.onThisPageList}>
        {headings.map((h) => (
          <li
            key={h.slug}
            className={
              h.depth === 4 ? s.onThisPageItemNested : s.onThisPageItem
            }
          >
            <a
              href={`#${h.slug}`}
              className={`${s.onThisPageLink} ${
                activeSlug === h.slug ? s.onThisPageLinkActive : ''
              }`}
              onClick={() => setActiveSlug(h.slug)}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
