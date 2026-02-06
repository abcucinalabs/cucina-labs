import { Zap, BookOpen, Utensils } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Daily Insights",
    description:
      "Curated AI news and analysis delivered every day. We cut through the noise so you don't have to.",
  },
  {
    icon: BookOpen,
    title: "Deep Dives",
    description:
      "In-depth explorations of AI tools, frameworks, and emerging trends that matter to builders.",
  },
  {
    icon: Utensils,
    title: "Recipes Coming Soon",
    description:
      "Step-by-step guides for building with AI. Practical, tested, and ready to ship.",
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
