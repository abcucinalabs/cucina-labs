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
      <div className="max-w-md rounded-lg border border-border bg-secondary p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background sm:h-10 sm:w-10">
            <svg className="h-4 w-4 text-foreground sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground sm:text-base">You&apos;re in!</p>
            <p className="text-xs text-muted-foreground sm:text-sm">
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
        <div className="relative flex-1">
          <input
            type="email"
            placeholder="Enter your email"
            className="h-12 w-full rounded-lg border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground sm:px-5 sm:text-base"
            {...register("email")}
          />
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="h-12 whitespace-nowrap rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 active:opacity-80 sm:px-8 sm:text-base"
        >
          Sign Up
        </Button>
      </div>

      {errors.email && (
        <p className="ml-1 mt-2 text-xs text-red-400 sm:text-sm">{errors.email.message}</p>
      )}

      {error && (
        <p className="ml-1 mt-2 text-xs text-red-400 sm:text-sm">{error}</p>
      )}
    </form>
  )
}
