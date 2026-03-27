// @yable/core — Locale System
// Provides default English locale with the ability to override any string.

import { en, type YableLocale } from './en'

/** Deep partial type for locale overrides */
export type PartialLocale = Partial<YableLocale>

/** Current resolved locale */
let _currentLocale: YableLocale = { ...en }

/**
 * Merge a partial locale with the default English locale.
 * Only provided keys are overridden; everything else stays English.
 */
export function createLocale(overrides: PartialLocale): YableLocale {
  return { ...en, ...overrides }
}

/**
 * Set the global default locale. Affects all tables that don't specify
 * their own locale.
 */
export function setDefaultLocale(overrides: PartialLocale): void {
  _currentLocale = createLocale(overrides)
}

/**
 * Get the current default locale.
 */
export function getDefaultLocale(): YableLocale {
  return _currentLocale
}

/**
 * Reset the locale to default English.
 */
export function resetLocale(): void {
  _currentLocale = { ...en }
}

export type { YableLocale }
