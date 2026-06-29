import type { Metadata } from 'next'

// Every shipped theme is loaded once here so any demo can opt into any of them
// via `className="yable-theme-<name>"`. (default + midnight come from the root layout.)
import '@zvndev/yable-themes/stripe.css'
import '@zvndev/yable-themes/compact.css'
import '@zvndev/yable-themes/ocean.css'
import '@zvndev/yable-themes/forest.css'
import '@zvndev/yable-themes/rose.css'
import '@zvndev/yable-themes/mono.css'

export const metadata: Metadata = {
  title: 'Gallery — Yable in 12 tables',
  description:
    'Twelve live Yable tables, from a 30-second contact list to a 50,000-row virtualized grid, a real formula spreadsheet, pivots, row grouping, and a live trading terminal.',
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
