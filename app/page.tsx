import { SignUpForm } from "@/components/signup-form"
import { Instrument_Serif } from "next/font/google"

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"] })

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8">
      <div className="relative min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-4rem)] overflow-hidden rounded-[32px] md:rounded-[44px] border border-[rgba(0,0,0,0.08)]">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/Video-Background-2.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-4rem)] flex flex-col">
          {/* Main Content */}
          <main className="flex-1 flex items-center">
            <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-20">
              <div className="max-w-3xl rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/70 p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
                <div className="pointer-events-none absolute -top-28 right-0 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(74,95,217,0.25)_0%,transparent_70%)]" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(155,242,202,0.2)_0%,transparent_70%)]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(60,53,242,0.4)] bg-[linear-gradient(135deg,rgba(60,53,242,0.18),rgba(74,95,217,0.18))] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--accent-primary)] mb-6 opacity-0 animate-fade-in-up">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                    AI Product Briefing
                  </div>

                  {/* Logo/Title */}
                  <h1
                    className={`${instrumentSerif.className} text-5xl md:text-6xl font-normal text-white mb-6 leading-[1.15] tracking-[-0.03em] opacity-0 animate-fade-in-up animate-delay-1 pt-1`}
                  >
                    The newsletter for{" "}
                    <span className="bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-tertiary)] bg-clip-text text-transparent">
                      AI Builders
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="text-lg md:text-xl text-white/75 mb-12 leading-relaxed max-w-xl opacity-0 animate-fade-in-up animate-delay-2">
                    We're cooking up AI experiments in our digital kitchen.
                    Fresh recipes, emerging trends, and the latest
                    developments in artificial intelligence — served straight to
                    your inbox.
                  </p>

                  {/* Signup Form */}
                  <div className="opacity-0 animate-fade-in-up animate-delay-3">
                    <SignUpForm />
                  </div>

                  {/* Tagline */}
                  <p className="text-sm text-white/55 mt-6 opacity-0 animate-fade-in-up animate-delay-4">
                    Join the lab. <span className="text-[var(--accent-primary)]">Get the recipes first.</span>
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-10 py-6 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <p className="text-white/60 text-sm">
                © {new Date().getFullYear()} Cucina Labs
              </p>
              <a
                href="/login"
                className="text-white/60 hover:text-[color:var(--accent-primary)] text-sm transition-colors"
              >
                Admin
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
