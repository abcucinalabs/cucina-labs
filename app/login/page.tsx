"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Instrument_Serif } from "next/font/google"

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"] })

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/admin/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center grayscale"
            style={{ backgroundImage: "url('/video-background-2-still.png')" }}
            aria-hidden="true"
          />
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
              {/* Login Card */}
              <div className="rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/56 p-6 sm:p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                <div className="mb-6 sm:mb-8">
                  <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                    Welcome back, chef.
                  </h1>
                  <p className="text-sm sm:text-base text-white/70">
                    Sign in to access cucina <span className="font-bold">labs</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      className="w-full h-12 px-4 rounded-[var(--radius-lg)] border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] focus:bg-white/10 transition-all"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-red-300 text-sm mt-2">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full h-12 px-4 rounded-[var(--radius-lg)] border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] focus:bg-white/10 transition-all"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-red-300 text-sm mt-2">{errors.password.message}</p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-[var(--radius-lg)] p-3 sm:p-4">
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={isLoading} isLoading={isLoading}>
                    Sign In
                  </Button>
                </form>

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
