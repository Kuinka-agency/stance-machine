import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StanceMachine from '@/components/StanceMachine'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import { getFilteredHotTakes } from '@/lib/hot-takes'
import Link from 'next/link'

// ISR: revalidate every 10 minutes — hot takes are mostly static
export const revalidate = 600

interface CategoryConfig {
  slug: string
  category: string
  title: string
  h1: string
  description: string
  relatedTones: string[]
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    slug: 'philosophy',
    category: 'philosophy',
    title: 'Philosophy Hot Takes — Stance Machine',
    h1: 'Philosophy Hot Takes',
    description: 'Bold opinions on life, meaning, and existence. Do you agree or disagree with these philosophical hot takes?',
    relatedTones: ['deep', 'controversial'],
  },
  {
    slug: 'relationships',
    category: 'relationships',
    title: 'Relationship Hot Takes — Stance Machine',
    h1: 'Relationship Hot Takes',
    description: 'Spicy opinions about love, dating, and relationships. Take a stance on these hot takes.',
    relatedTones: ['deep', 'spicy', 'flirty'],
  },
  {
    slug: 'work',
    category: 'work',
    title: 'Work Hot Takes — Stance Machine',
    h1: 'Work & Career Hot Takes',
    description: 'Controversial opinions about careers, office life, and ambition. Where do you stand?',
    relatedTones: ['deep', 'challenging'],
  },
  {
    slug: 'money',
    category: 'money',
    title: 'Money Hot Takes — Stance Machine',
    h1: 'Money Hot Takes',
    description: 'Hot takes about wealth, spending, and financial decisions. Agree or disagree?',
    relatedTones: ['deep', 'controversial'],
  },
  {
    slug: 'lifestyle',
    category: 'lifestyle',
    title: 'Lifestyle Hot Takes — Stance Machine',
    h1: 'Lifestyle Hot Takes',
    description: 'Fun and random opinions about food, travel, habits, and daily life. Pick your hills.',
    relatedTones: ['funny', 'random'],
  },
  {
    slug: 'society',
    category: 'society',
    title: 'Society Hot Takes — Stance Machine',
    h1: 'Society Hot Takes',
    description: 'Controversial opinions about culture, technology, and modern life. Take a stance.',
    relatedTones: ['controversial', 'challenging'],
  },
]

const configBySlug = new Map(CATEGORY_CONFIGS.map((c) => [c.slug, c]))

export function generateStaticParams() {
  return CATEGORY_CONFIGS.map((c) => ({ category: c.slug }))
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const config = configBySlug.get(params.category)
  if (!config) return {}
  return {
    title: config.title,
    description: config.description,
    openGraph: { title: config.h1, description: config.description },
  }
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const config = configBySlug.get(params.category)
  if (!config) notFound()

  const hotTakes = await getFilteredHotTakes({ category: config.category, limit: 30 })

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: hotTakes.slice(0, 20).map((t) => ({
      '@type': 'Question',
      name: `Hot take: ${t.statement}`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `This is a debatable opinion. The original question: "${t.originalQuestion}" — Do you agree or disagree?`,
      },
    })),
  }

  return (
    <main className="min-h-screen">
      <ScrollReveal />
      <SiteHeader />

      <section className="px-4 sm:px-6 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          <h1
            className="font-display text-3xl sm:text-4xl mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            {config.h1}
          </h1>
          <p
            className="text-base sm:text-lg mb-8 max-w-2xl"
            style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}
          >
            {config.description}
          </p>
        </div>

        <StanceMachine />

        {/* Hot takes list */}
        <div className="max-w-3xl mx-auto mt-16">
          <hr className="rams-divider-thick mb-8" />
          <h2
            className="font-display text-2xl mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            {hotTakes.length} {config.h1}
          </h2>

          <ol className="space-y-4">
            {hotTakes.map((take, i) => (
              <li
                key={take.id}
                className="surface-card p-4"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div className="flex gap-3">
                  <span
                    className="font-mono text-xs mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {i + 1}.
                  </span>
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {take.statement}
                    </p>
                    {take.tone.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {take.tone.map((t) => (
                          <span
                            key={t}
                            className="font-mono px-1.5 py-0.5"
                            style={{
                              fontSize: '0.6rem',
                              color: 'var(--text-muted)',
                              background: 'var(--bg-inset)',
                              borderRadius: 'var(--radius-sm)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Related pages */}
          <div className="mt-12">
            <h3
              className="font-mono text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Related
            </h3>
            <div className="flex flex-wrap gap-2">
              {config.relatedTones.map((tone) => (
                <Link
                  key={tone}
                  href={`/${config.slug}/${tone}`}
                  className="font-mono text-xs px-3 py-2 transition-colors duration-200"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {tone} {config.h1.toLowerCase()}
                </Link>
              ))}
              {CATEGORY_CONFIGS.filter((c) => c.slug !== config.slug).map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  className="font-mono text-xs px-3 py-2 transition-colors duration-200"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {c.h1}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </main>
  )
}
