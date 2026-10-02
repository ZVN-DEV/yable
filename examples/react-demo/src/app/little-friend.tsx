'use client'

import { useEffect } from 'react'
import { track } from '@/lib/little-friend'

// Goals match event names, so GitHub and npm links send their own.
function onClick(event: MouseEvent) {
  if (event.button > 1 || !(event.target instanceof Element)) return
  const link = event.target.closest('a[href]')
  if (!(link instanceof HTMLAnchorElement)) return
  const host = link.hostname.replace(/^www\./, '')
  if (host === 'github.com') track('github.click')
  else if (host === 'npmjs.com') track('npm.click')
}

export default function LittleFriendEvents() {
  useEffect(() => {
    document.addEventListener('click', onClick)
    document.addEventListener('auxclick', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('auxclick', onClick)
    }
  }, [])
  return null
}
