import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import '@yable/themes/default.css'
import '@yable/themes/midnight.css'
import '@yable/themes/stripe.css'
import '@yable/themes/compact.css'
import '@yable/themes/ocean.css'
import '@yable/themes/forest.css'
import '@yable/themes/rose.css'
import '@yable/themes/mono.css'

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
})

export const metadata: Metadata = {
  title: 'Yable — The Modern Table Library for React',
  description:
    'Sorting, filtering, editing, themes, virtualization, and more. A complete data table solution.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geist.variable} data-yable-theme="dark">
      <body
        style={{
          margin: 0,
          fontFamily:
            'var(--font-geist), -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          backgroundColor: '#09090b',
          color: '#fafafa',
          minHeight: '100vh',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {children}
      </body>
    </html>
  )
}
