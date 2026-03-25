import type { Metadata } from 'next'
import '@yable/themes/default.css'

export const metadata: Metadata = {
  title: 'Yable — React Demo',
  description: 'YableTables React component library demo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{
        margin: 0,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        backgroundColor: '#fafafa',
        color: '#111',
        minHeight: '100vh',
      }}>
        {children}
      </body>
    </html>
  )
}
