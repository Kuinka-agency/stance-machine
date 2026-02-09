import { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import { decodeStanceCard } from '@/lib/stance-card'
import TarotSpread from '@/components/tarot/TarotSpread'
import TarotSummaryCard from '@/components/tarot/TarotSummaryCard'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: { hash: string } }): Promise<Metadata> {
  const entries = await decodeStanceCard(params.hash)
  if (!entries) {
    return { title: 'Stance Card — Stance Machine' }
  }

  const stanceSummary = entries
    .map((e) => `${e.stance === 'agree' ? 'YES' : 'NO'}: ${e.take.statement}`)
    .join(' | ')

  return {
    title: 'My Stance Card — Stance Machine',
    description: `6 hills I will die on: ${stanceSummary.slice(0, 150)}...`,
    openGraph: {
      title: 'My Stance Card — 6 hills I will die on',
      description: `See where I stand on 6 hot takes. Do you agree?`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My Stance Card — 6 hills I will die on',
      description: `See where I stand on 6 hot takes. Do you agree?`,
    },
  }
}

export default async function StanceCardPage({ params }: { params: { hash: string } }) {
  const entries = await decodeStanceCard(params.hash)

  if (!entries) {
    return (
      <main className="min-h-screen">
        <SiteHeader />
        <section className="px-4 sm:px-6 py-16 text-center">
          <h1
            className="font-display text-2xl mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Invalid Stance Card
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            This stance card link is invalid or expired.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 font-mono text-xs uppercase tracking-wider px-6 py-3"
            style={{
              background: 'var(--accent)',
              color: '#0e0e0e',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Create Your Own
          </Link>
        </section>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <ScrollReveal />
      <SiteHeader />

      <section className="px-4 sm:px-6 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center">
            <h1
              className="font-display text-3xl sm:text-4xl mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Stance Card
            </h1>
            <p
              className="font-mono text-xs uppercase tracking-[0.15em]"
              style={{ color: 'var(--text-muted)' }}
            >
              6 hills someone will die on
            </p>
          </div>

          <TarotSpread entries={entries} animated={false} />

          <TarotSummaryCard entries={entries} />

          <div className="text-center">
            <Link
              href="/"
              className="inline-block font-mono text-xs uppercase tracking-wider px-8 py-3 transition-all duration-200"
              style={{
                background: 'var(--accent)',
                color: '#0e0e0e',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Create Your Own Stance Card
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
