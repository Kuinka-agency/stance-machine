import type { Metadata } from 'next'
import Script from 'next/script'
import PostHogProvider from '@/components/PostHogProvider'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <SessionProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
