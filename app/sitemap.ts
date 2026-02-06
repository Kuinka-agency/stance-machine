import { MetadataRoute } from 'next'

const BASE_URL = 'https://stance-machine.vercel.app'

const CATEGORY_SLUGS = [
  'philosophy',
  'relationships',
  'work',
  'money',
  'lifestyle',
  'society',
]

const TONE_COMBOS: { category: string; tones: string[] }[] = [
  { category: 'philosophy', tones: ['deep', 'controversial'] },
  { category: 'relationships', tones: ['deep', 'spicy', 'flirty'] },
  { category: 'work', tones: ['deep', 'challenging'] },
  { category: 'money', tones: ['deep', 'controversial'] },
  { category: 'lifestyle', tones: ['funny', 'random'] },
  { category: 'society', tones: ['controversial', 'challenging'] },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  // Category pages
  for (const slug of CATEGORY_SLUGS) {
    routes.push({
      url: `${BASE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    })
  }

  // Category + tone combo pages
  for (const combo of TONE_COMBOS) {
    for (const tone of combo.tones) {
      routes.push({
        url: `${BASE_URL}/${combo.category}/${tone}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  return routes
}
