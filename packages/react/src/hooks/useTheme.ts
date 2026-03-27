// @yable/react — useTheme hook
// Runtime theme switching without page reload.

import { useState, useEffect, useCallback, useRef } from 'react'

export interface UseThemeOptions {
  /** Initial theme name */
  defaultTheme?: string
  /** Initial color scheme */
  defaultColorScheme?: 'light' | 'dark' | 'auto'
}

export function useTheme(options: UseThemeOptions = {}) {
  const { defaultTheme = 'default', defaultColorScheme = 'auto' } = options
  const [theme, setThemeState] = useState(defaultTheme)
  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark' | 'auto'>(defaultColorScheme)
  const containerRef = useRef<HTMLElement | null>(null)

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme)
  }, [])

  const setColorScheme = useCallback((scheme: 'light' | 'dark' | 'auto') => {
    setColorSchemeState(scheme)
  }, [])

  const toggleColorScheme = useCallback(() => {
    setColorSchemeState((prev) => {
      if (prev === 'auto') return 'dark'
      if (prev === 'dark') return 'light'
      return 'auto'
    })
  }, [])

  // Apply color scheme to the nearest yable container or document
  useEffect(() => {
    const target = containerRef.current ?? document.documentElement
    if (colorScheme === 'auto') {
      target.removeAttribute('data-yable-theme')
    } else {
      target.setAttribute('data-yable-theme', colorScheme)
    }
  }, [colorScheme])

  // Detect system preference
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)

    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolvedColorScheme = colorScheme === 'auto'
    ? (systemDark ? 'dark' : 'light')
    : colorScheme

  return {
    theme,
    setTheme,
    colorScheme,
    setColorScheme,
    toggleColorScheme,
    resolvedColorScheme,
    containerRef,
  }
}
