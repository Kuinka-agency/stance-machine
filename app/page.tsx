import StanceMachine from '@/components/StanceMachine'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'

export default function Home() {
  return (
    <main className="min-h-screen">
      <ScrollReveal />
      <SiteHeader />

      {/* Stance machine section */}
      <section className="px-4 sm:px-6 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <StanceMachine />
      </section>

      <SiteFooter />
    </main>
  )
}
