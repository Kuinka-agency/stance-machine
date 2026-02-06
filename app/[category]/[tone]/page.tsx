import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import StanceMachine from '@/components/StanceMachine'
import { getFilteredHotTakes } from '@/lib/hot-takes'
import Link from 'next/link'

interface CategoryToneConfig {
  categorySlug: string
  category: string
  categoryLabel: string
  tone: string
  title: string
  h1: string
  description: string
}

const CATEGORIES: { slug: string; label: string; tones: string[] }[] = [
  { slug: 'philosophy', label: 'Philosophy Hot Takes', tones: ['deep', 'controversial'] },
  { slug: 'relationships', label: 'Relationship Hot Takes', tones: ['deep', 'spicy', 'flirty'] },
  { slug: 'work', label: 'Work Hot Takes', tones: ['deep', 'challenging'] },
  { slug: 'money', label: 'Money Hot Takes', tones: ['deep', 'controversial'] },
  { slug: 'lifestyle', label: 'Lifestyle Hot Takes', tones: ['funny', 'random'] },
  { slug: 'society', label: 'Society Hot Takes', tones: ['controversial', 'challenging'] },
]

const ALL_CONFIGS: CategoryToneConfig[] = CATEGORIES.flatMap((cat) =>
  cat.tones.map((tone) => ({
    categorySlug: cat.slug,
    category: cat.slug,
    categoryLabel: cat.label,
    tone,
    title: `${tone.charAt(0).toUpperCase() + tone.slice(1)} ${cat.label} — Stance Machine`,
    h1: `${tone.charAt(0).toUpperCase() + tone.slice(1)} ${cat.label}`,
    description: `${tone.charAt(0).toUpperCase() + tone.slice(1)} hot takes about ${cat.slug}. Do you agree or disagree?`,
  }))
)

const configByKey = new Map(ALL_CONFIGS.map((c) => [`${c.categorySlug}/${c.tone}`, c]))

export function generateStaticParams() {
  return ALL_CONFIGS.map((c) => ({
    category: c.categorySlug,
    tone: c.tone,
  }))
}

export function generateMetadata({ params }: { params: { category: string; tone: string } }): Metadata {
  const config = configByKey.get(`${params.category}/${params.tone}`)
  if (!config) return {}
  return {
    title: config.title,
    description: config.description,
    openGraph: { title: config.h1, description: config.description },
  }
}

export default function CategoryTonePage({
  params,
}: {
  params: { category: string; tone: string }
}) {
  const config = configByKey.get(`${params.category}/${params.tone}`)
  if (!config) notFound()

  const hotTakes = getFilteredHotTakes({
    category: config.category,
    tone: config.tone,
    limit: 30,
  })

  // Don't render thin pages
  if (hotTakes.length < 10) notFound()

  return (
    <main className="min-h-screen">
      <ScrollReveal />
      <SiteHeader />

      <section className="px-4 sm:px-6 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          <nav className="mb-4">
            <ol className="flex items-center gap-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              <li><Link href="/" className="hover:text-[var(--accent)]">Home</Link></li>
              <li>/</li>
              <li><Link href={`/${config.categorySlug}`} className="hover:text-[var(--accent)]">{config.categoryLabel}</Link></li>
              <li>/</li>
              <li style={{ color: 'var(--text-tertiary)' }}>{config.tone}</li>
            </ol>
          </nav>

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
                className="p-4"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="flex gap-3">
                  <span
                    className="font-mono text-xs mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {i + 1}.
                  </span>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {take.statement}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12">
            <h3
              className="font-mono text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--text-tertiary)' }}
            >
              More {config.categoryLabel}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${config.categorySlug}`}
                className="font-mono text-xs px-3 py-2 transition-colors duration-200"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                }}
              >
                All {config.categoryLabel}
              </Link>
              {CATEGORIES.find((c) => c.slug === config.categorySlug)
                ?.tones.filter((t) => t !== config.tone)
                .map((t) => (
                  <Link
                    key={t}
                    href={`/${config.categorySlug}/${t}`}
                    className="font-mono text-xs px-3 py-2 transition-colors duration-200"
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
