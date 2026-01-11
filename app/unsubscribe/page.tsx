"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

    setEmail(emailParam)
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>
            {status === "confirm" && "Confirm your unsubscribe request"}
            {status === "loading" && "Processing your request..."}
            {status === "success" && "Successfully unsubscribed"}
            {status === "error" && "Error"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "confirm" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Are you sure you want to unsubscribe {email} from all Cucina Labs newsletters?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => (window.location.href = "/")}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleUnsubscribe}
                >
                  Unsubscribe
                </Button>
              </div>
            </div>
          )}
          {status === "loading" && (
            <p className="text-center text-muted-foreground">
              Please wait while we process your request...
            </p>
          )}
          {status === "success" && (
            <div className="space-y-4">
              <p className="text-center text-green-600 font-medium">{message}</p>
              <p className="text-sm text-center text-muted-foreground">
                You will no longer receive emails from Cucina Labs at {email}.
              </p>
              <p className="text-sm text-center text-muted-foreground">
                We&apos;re sorry to see you go. If you change your mind, you can always resubscribe on our website.
              </p>
              <Button
                className="w-full"
                onClick={() => (window.location.href = "/")}
              >
                Return to Home
              </Button>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <p className="text-center text-red-600">{message}</p>
              <Button
                className="w-full"
                onClick={() => (window.location.href = "/")}
              >
                Return to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unsubscribe</CardTitle>
            <CardDescription>Processing your request...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
