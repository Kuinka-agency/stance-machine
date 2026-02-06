import { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import { decodeStanceCard } from '@/lib/stance-card'
import Link from 'next/link'

export function generateMetadata({ params }: { params: { hash: string } }): Metadata {
  const entries = decodeStanceCard(params.hash)
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
      title: 'My Stance Card',
      description: `See where I stand on 6 hot takes.`,
    },
  }
}

export default function StanceCardPage({ params }: { params: { hash: string } }) {
  const entries = decodeStanceCard(params.hash)

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
              color: 'var(--bg-primary)',
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
        <div className="max-w-lg mx-auto">
          <h1
            className="font-display text-3xl sm:text-4xl mb-2 text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            Stance Card
          </h1>
          <p
            className="text-center mb-8 font-mono text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            6 hills someone will die on
          </p>

          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.take.id}
                className="flex items-start gap-3 p-4"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  className="font-mono text-xs font-bold mt-0.5 px-2 py-1"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    background:
                      entry.stance === 'agree'
                        ? 'var(--agree-subtle)'
                        : 'var(--disagree-subtle)',
                    color:
                      entry.stance === 'agree'
                        ? 'var(--agree)'
                        : 'var(--disagree)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.stance === 'agree' ? 'AGREE' : 'DISAGREE'}
                </span>
                <p
                  className="text-sm font-medium flex-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {entry.take.statement}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/"
              className="inline-block font-mono text-xs uppercase tracking-wider px-8 py-3 transition-all duration-200"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
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
