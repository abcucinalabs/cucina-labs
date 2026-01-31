"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Instrument_Serif } from "next/font/google"
import Link from "next/link"

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"] })

function PreferencesContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [exp, setExp] = useState("")
  const [dailyEnabled, setDailyEnabled] = useState(true)
  const [weeklyEnabled, setWeeklyEnabled] = useState(true)
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")
    const expParam = searchParams.get("exp")

    if (emailParam && tokenParam && expParam) {
      setEmail(decodeURIComponent(emailParam))
      setToken(tokenParam)
      setExp(expParam)
      fetchPreferences(decodeURIComponent(emailParam), tokenParam, expParam)
    } else {
      setStatus("error")
      setMessage("Invalid preferences link. Please use the link from your email.")
    }
  }, [searchParams])

  const fetchPreferences = async (email: string, token: string, exp: string) => {
    try {
      const params = new URLSearchParams({ email, token, exp })
      const response = await fetch(`/api/preferences?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDailyEnabled(data.dailyEnabled)
        setWeeklyEnabled(data.weeklyEnabled)
        setStatus("ready")
      } else {
        const data = await response.json()
        setStatus("error")
        setMessage(data.error || "Failed to load preferences.")
      }
    } catch {
      setStatus("error")
      setMessage("Failed to load preferences. Please try again.")
    }
  }

  const handleSave = async () => {
    setStatus("saving")
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, exp, dailyEnabled, weeklyEnabled }),
      })
      const data = await response.json()
      if (data.success) {
        setStatus("success")
        setMessage(data.message)
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to update preferences.")
      }
    } catch {
      setStatus("error")
      setMessage("An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center grayscale"
            style={{ backgroundImage: "url('/video-background-2-still.png')" }}
            aria-hidden="true"
          />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          <header className="bg-white py-3 px-4 sm:py-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <Link href="/">
                <h1 style={{ fontFamily: 'Arial, sans-serif' }} className="text-lg sm:text-xl text-black">
                  cucina <span className="font-bold">labs</span>
                </h1>
              </Link>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
            <div className="w-full max-w-md">
              <div className="rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/56 p-6 sm:p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                {status === "loading" && (
                  <>
                    <div className="mb-6 sm:mb-8">
                      <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                        Loading...
                      </h1>
                    </div>
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                  </>
                )}

                {status === "ready" && (
                  <>
                    <div className="mb-6 sm:mb-8">
                      <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                        Email Preferences
                      </h1>
                      <p className="text-sm sm:text-base text-white/70">
                        Choose which emails you&apos;d like to receive from cucina <span className="font-bold">labs</span>.
                      </p>
                    </div>

                    <div className="mb-4 p-4 rounded-[var(--radius-lg)] bg-white/5 border border-white/10">
                      <p className="text-sm text-white/60">Email address</p>
                      <p className="text-white mt-1 break-all">{email}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <label className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-white/5 border border-white/10 cursor-pointer hover:bg-white/8 transition-colors">
                        <input
                          type="checkbox"
                          checked={dailyEnabled}
                          onChange={(e) => setDailyEnabled(e.target.checked)}
                          className="h-5 w-5 rounded border-white/30 bg-white/10 text-[var(--accent-primary)] focus:ring-[var(--focus-ring)] focus:ring-offset-0"
                        />
                        <div>
                          <p className="text-white font-medium">Daily AI News</p>
                          <p className="text-sm text-white/50">Curated AI news and insights, every weekday</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-white/5 border border-white/10 cursor-pointer hover:bg-white/8 transition-colors">
                        <input
                          type="checkbox"
                          checked={weeklyEnabled}
                          onChange={(e) => setWeeklyEnabled(e.target.checked)}
                          className="h-5 w-5 rounded border-white/30 bg-white/10 text-[var(--accent-primary)] focus:ring-[var(--focus-ring)] focus:ring-offset-0"
                        />
                        <div>
                          <p className="text-white font-medium">Weekly Newsletter</p>
                          <p className="text-sm text-white/50">Experiments, projects, and recipes from the lab</p>
                        </div>
                      </label>
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleSave}
                    >
                      Save Preferences
                    </Button>
                  </>
                )}

                {status === "saving" && (
                  <>
                    <div className="mb-6 sm:mb-8">
                      <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                        Saving...
                      </h1>
                    </div>
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                  </>
                )}

                {status === "success" && (
                  <>
                    <div className="mb-6 sm:mb-8">
                      <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                        Preferences updated
                      </h1>
                      <p className="text-sm sm:text-base text-white/70">
                        {message}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => (window.location.href = "/")}
                    >
                      Return to Home
                    </Button>
                  </>
                )}

                {status === "error" && (
                  <>
                    <div className="mb-6 sm:mb-8">
                      <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                        Error
                      </h1>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-[var(--radius-lg)] p-4 mb-6">
                      <p className="text-red-300 text-sm">{message}</p>
                    </div>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => (window.location.href = "/")}
                    >
                      Return to Home
                    </Button>
                  </>
                )}

                <p className="text-center mt-6">
                  <Link href="/" className="text-white/60 hover:text-[color:var(--accent-primary)] text-sm transition-colors">
                    ← Back to home
                  </Link>
                </p>
              </div>
            </div>
          </main>

          <footer className="relative z-10 py-4 px-4 sm:py-6 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <p className="text-white/60 text-xs sm:text-sm">
                © {new Date().getFullYear()} cucina <span className="font-bold">labs</span>
              </p>
              <Link href="/" className="text-white/60 hover:text-[color:var(--accent-primary)] text-xs sm:text-sm transition-colors">
                Home
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center grayscale"
              style={{ backgroundImage: "url('/video-background-2-still.png')" }}
              aria-hidden="true"
            />
          </div>
          <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
            <div className="rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/56 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <PreferencesContent />
    </Suspense>
  )
}
