import { SiteHeader } from "@/components/home/site-header"
import { Hero } from "@/components/home/hero"
import { Showcase } from "@/components/home/showcase"
import { About } from "@/components/home/about"
import { CTA } from "@/components/home/cta"
import { SiteFooter } from "@/components/home/site-footer"

export default function Home() {
  console.log("[v0] Home page rendering - Showcase version")
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="h-px w-full bg-border" />
        </div>
        <Showcase />
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
