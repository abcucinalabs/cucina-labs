"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
        router.push("/admin")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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

        <div className="relative z-10 min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Logo */}
            <Link href="/" className="block text-center mb-8">
              <h1 className="text-3xl font-semibold text-white">Cucina Labs</h1>
            </Link>

            {/* Login Card */}
            <div className="rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/70 p-8 shadow-[var(--shadow-lg)] backdrop-blur-xl">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
                <p className="text-white/70">Sign in to access the admin console</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="w-full h-12 px-4 rounded-[var(--radius-lg)] border border-white/30 bg-transparent text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] transition-all"
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
                    className="w-full h-12 px-4 rounded-[var(--radius-lg)] border border-white/30 bg-transparent text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] transition-all"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-red-300 text-sm mt-2">{errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-[var(--radius-lg)] p-4">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={isLoading} isLoading={isLoading}>
                  Sign In
                </Button>
              </form>
            </div>

            {/* Back link */}
            <p className="text-center mt-6">
              <Link href="/" className="text-white/60 hover:text-[color:var(--accent-primary)] text-sm transition-colors">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
