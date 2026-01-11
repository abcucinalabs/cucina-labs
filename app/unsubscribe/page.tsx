"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Instrument_Serif } from "next/font/google"
import Link from "next/link"

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"] })

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<"confirm" | "loading" | "success" | "error">("confirm")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")

    if (!emailParam || !tokenParam) {
      setStatus("error")
      setMessage("Invalid unsubscribe link")
      return
    }

    setEmail(decodeURIComponent(emailParam))
    setToken(tokenParam)
  }, [searchParams])

  const handleUnsubscribe = async () => {
    if (!email || !token) return

    setStatus("loading")

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message || "You have been successfully unsubscribed.")
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to unsubscribe")
      }
    } catch (error) {
      setStatus("error")
      setMessage("An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover grayscale"
          >
            <source src="/Video-Background-2.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white py-3 px-4 sm:py-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <Link href="/">
                <h1 style={{ fontFamily: 'Arial, sans-serif' }} className="text-lg sm:text-xl text-black">
                  cucina <span className="font-bold">labs</span>
                </h1>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
            <div className="w-full max-w-md">
              {/* Unsubscribe Card */}
              <div className="rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/56 p-6 sm:p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                {status === "confirm" && (
                  <>
                    <div className="mb-6 sm:mb-8">
                      <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                        Unsubscribe
                      </h1>
                      <p className="text-sm sm:text-base text-white/70">
                        Are you sure you want to unsubscribe from all cucina <span className="font-bold">labs</span> newsletters?
                      </p>
                    </div>

                    <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-white/5 border border-white/10">
                      <p className="text-sm text-white/60">Email address</p>
                      <p className="text-white mt-1 break-all">{email}</p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
                        onClick={() => (window.location.href = "/")}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="lg"
                        className="flex-1"
                        onClick={handleUnsubscribe}
                      >
                        Unsubscribe
                      </Button>
                    </div>
                  </>
                )}

                {status === "loading" && (
                  <>
                    <div className="mb-6 sm:mb-8">
                      <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                        Processing...
                      </h1>
                      <p className="text-sm sm:text-base text-white/70">
                        Please wait while we process your request.
                      </p>
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
                        Successfully unsubscribed
                      </h1>
                      <p className="text-sm sm:text-base text-white/70 mb-4">
                        {message}
                      </p>
                      <p className="text-sm text-white/60 mb-2">
                        You will no longer receive emails from cucina <span className="font-bold">labs</span> at <span className="text-white">{email}</span>.
                      </p>
                      <p className="text-sm text-white/60">
                        We&apos;re sorry to see you go. If you change your mind, you can always resubscribe on our website.
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

                {/* Back link */}
                <p className="text-center mt-6">
                  <Link href="/" className="text-white/60 hover:text-[color:var(--accent-primary)] text-sm transition-colors">
                    ← Back to home
                  </Link>
                </p>
              </div>
            </div>
          </main>

          {/* Footer */}
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

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover grayscale"
            >
              <source src="/Video-Background-2.mp4" type="video/mp4" />
            </video>
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
      <UnsubscribeContent />
    </Suspense>
  )
}
