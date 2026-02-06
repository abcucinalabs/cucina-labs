export function About() {
  return (
    <section className="relative px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-20 lg:gap-28">
          {/* Left column */}
          <div className="flex-1">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              About
            </p>
            <h2 className="text-balance font-sans text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              A test kitchen for AI builders
            </h2>
          </div>

          {/* Right column */}
          <div className="flex-1 flex flex-col gap-6">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              <span className="text-foreground font-medium">cucina labs</span>{" "}
              is where we experiment with AI tools, explore emerging trends, and distill what matters into clear, actionable intelligence.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              We believe the best products are built by people who stay curious, ask hard questions, and share what they learn.
            </p>
            <div className="mt-4 flex items-center gap-8">
              <div>
                <p className="text-3xl font-semibold text-foreground">Daily</p>
                <p className="text-sm text-muted-foreground">Insights delivered</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-3xl font-semibold text-foreground">Free</p>
                <p className="text-sm text-muted-foreground">Always</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-3xl font-semibold text-foreground">Open</p>
                <p className="text-sm text-muted-foreground">Community</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
