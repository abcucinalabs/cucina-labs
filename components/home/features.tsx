import { Zap, Blocks, LayoutTemplate } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Daily Insights",
    description:
      "The signal in the noise. Every day we distill the most important AI developments, launches, and research into a brief that respects your time and sharpens your edge.",
  },
  {
    icon: Blocks,
    title: "Skills",
    description:
      "A growing library of production-ready agentic skills you can drop into your stack. Built for composability, tested in real workflows, and ready to ship today.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates",
    description:
      "Enterprise-grade starter apps for newsletters, content management, CRMs, and more. Skip the boilerplate and go straight to building what matters.",
  },
]

export function Features() {
  return (
    <section className="relative px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 max-w-2xl md:mb-20">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            What we do
          </p>
          <h2 className="text-balance font-sans text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Intelligence, curated for builders
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 bg-background p-8 transition-colors hover:bg-secondary/50 lg:p-10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary">
                <feature.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
