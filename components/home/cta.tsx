"use client"

import { SignUpForm } from "@/components/signup-form"

export function CTA() {
  return (
    <section className="relative px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-secondary/30 px-8 py-16 text-center sm:px-12 sm:py-20 lg:px-16">
          <h2 className="text-balance font-sans text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Stay ahead of the curve
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Get curated AI insights delivered to your inbox. No spam, no fluff — just the signal that matters.
          </p>
          <div className="mt-10">
            <SignUpForm />
          </div>
        </div>
      </div>
    </section>
  )
}
