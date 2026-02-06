"use client"

import ScrollRevealContent, {
  type ItemContent,
} from "@/components/home/scroll-reveal"

const contentA: ItemContent = {
  title: "Daily Insights",
  description:
    "The signal in the noise. Every day we distill the most important AI developments, launches, and research into a brief that respects your time and sharpens your edge.",
  image: {
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&h=800&fit=crop&q=80",
    width: 1200,
    height: 800,
    alt: "Dark ocean waves in grayscale",
  },
}

const contentB: ItemContent = {
  title: "Skills",
  description:
    "A growing library of production-ready agentic skills you can drop into your stack. Built for composability, tested in real workflows, and ready to ship today.",
  image: {
    url: "https://images.unsplash.com/photo-1509477887414-681937645173?w=1200&h=800&fit=crop&q=80",
    width: 1200,
    height: 800,
    alt: "Deep ocean water surface in grayscale",
  },
}

const contentC: ItemContent = {
  title: "Templates",
  description:
    "Enterprise-grade starter apps for newsletters, content management, CRMs, and more. Skip the boilerplate and go straight to building what matters.",
  image: {
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=800&fit=crop&q=80",
    width: 1200,
    height: 800,
    alt: "Calm ocean water texture in grayscale",
  },
}

export function Showcase() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-24 lg:px-12 lg:pt-32">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          What we offer
        </p>
        <h2 className="max-w-2xl text-balance font-sans text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Everything you need to build with AI
        </h2>
      </div>
      <ScrollRevealContent
        contentA={contentA}
        contentB={contentB}
        contentC={contentC}
      />
    </section>
  )
}
