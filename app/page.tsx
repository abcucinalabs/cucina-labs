import { SiteHeader } from "@/components/home/site-header"
import { Hero } from "@/components/home/hero"
import { Features } from "@/components/home/features"
import { About } from "@/components/home/about"
import { CTA } from "@/components/home/cta"
import { SiteFooter } from "@/components/home/site-footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="h-px w-full bg-border" />
        </div>
        <Features />
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="h-px w-full bg-border" />
        </div>
        <About />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  )
}
