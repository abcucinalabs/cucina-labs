"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
})

type SignUpFormData = z.infer<typeof signUpSchema>

export function SignUpForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const getFriendlyError = (payload: { error?: string; code?: string }) => {
    switch (payload.code) {
      case "already_subscribed":
        return "You're already on the list."
      case "invalid_email":
        return "That email doesn't look right. Please check it and try again."
      case "resend_not_configured":
        return "Email signup isn't available yet. Please check back soon."
      case "resend_failed":
        return "Sorry, we couldn't add you right now. Please try again in a minute."
      default: {
        const message = payload.error ?? ""
        if (message.toLowerCase().includes("already subscribed")) {
          return "You're already on the list."
        }
        return "Sorry, we couldn't add you right now. Please try again in a minute."
      }
    }
  }

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(getFriendlyError(result))
        return
      }

      setSuccess(true)
      if (result.welcomeEmailSent === false) {
        if (result.welcomeEmailError) {
          setSuccessMessage(
            "You're in! Welcome email isn't set up yet, so you may not receive it."
          )
        } else {
          setSuccessMessage(
            "You're in! Welcome email delivery can take a moment or be blocked by sender settings."
          )
        }
      } else {
        setSuccessMessage("You're in! Check your inbox for confirmation.")
      }
      reset()
    } catch (err) {
      setError("Sorry, we couldn't add you right now. Please try again in a minute.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/70 p-4 sm:p-6 shadow-[var(--shadow-md)] backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--accent-primary-light)] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[color:var(--accent-primary-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium text-sm sm:text-base">You&apos;re in!</p>
            <p className="text-white/70 text-xs sm:text-sm">
              {successMessage || "Check your inbox for confirmation."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 relative">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full h-12 sm:h-14 px-4 sm:px-6 rounded-full border border-white/20 bg-white/5 text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] focus:bg-white/10 transition-all duration-300"
            {...register("email")}
          />
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="h-12 sm:h-14 px-6 sm:px-8 rounded-full whitespace-nowrap text-sm sm:text-base bg-gradient-to-br from-[var(--accent-primary)] to-[#7ce8b5] text-[#0d0d0d] shadow-[0_12px_24px_-8px_rgba(155,242,202,0.4)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-10px_rgba(155,242,202,0.5)] active:translate-y-0"
        >
          Sign Up
        </Button>
      </div>

      {errors.email && (
        <p className="text-red-300 text-xs sm:text-sm mt-2 sm:mt-3 ml-2 sm:ml-4">{errors.email.message}</p>
      )}

      {error && (
        <p className="text-red-300 text-xs sm:text-sm mt-2 sm:mt-3 ml-2 sm:ml-4">{error}</p>
      )}
    </form>
  )
}
