"use client"

import { SignUpForm } from "@/components/signup-form"
import { ArrowDown } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24 lg:px-12">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <h1 className="text-balance font-sans text-5xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          The test kitchen for AI Builders
        </h1>

        <div className="mt-6 inline-flex animate-pulse items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15),0_0_40px_rgba(245,158,11,0.08)]">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          AI Product Briefing
        </div>

        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg md:mt-8 md:text-xl">
          Fresh insights, emerging trends, and the latest developments in artificial intelligence — served straight to your inbox.
        </p>

        <div className="mt-10 md:mt-12">
          <SignUpForm />
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Join the kitchen. By clicking &apos;Sign Up&apos; you agree to our{" "}
          <a
            href="/privacy"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
          >
            privacy policy
          </a>
          .
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground">
        <ArrowDown className="h-5 w-5" />
      </div>
    </section>
  )
}
