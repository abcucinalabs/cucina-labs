"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const token = searchParams.get("token")

    if (!emailParam || !token) {
      setStatus("error")
      setMessage("Invalid unsubscribe link")
      return
    }

    setEmail(emailParam)

    // Verify token and unsubscribe
    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailParam, token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success")
          setMessage("You have been successfully unsubscribed.")
        } else {
          setStatus("error")
          setMessage(data.error || "Failed to unsubscribe")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("An error occurred. Please try again.")
      })
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>
            {status === "loading" && "Processing your request..."}
            {status === "success" && "Unsubscribed"}
            {status === "error" && "Error"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <p className="text-center text-muted-foreground">
              Please wait...
            </p>
          )}
          {status === "success" && (
            <div className="space-y-4">
              <p className="text-center text-green-600">{message}</p>
              <p className="text-sm text-center text-muted-foreground">
                You will no longer receive emails from Cucina Labs.
              </p>
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
