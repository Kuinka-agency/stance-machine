import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stance Machine — Hot Take Generator',
  description: 'Spin hot takes across 6 categories. Agree or disagree. Lock your position. Share your Stance Card with the world.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {children}
      </body>
    </html>
  )
}
