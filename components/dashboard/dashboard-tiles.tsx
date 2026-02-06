"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DayBlocks } from "@/components/ui/day-blocks"
import { AdHocEmailTab } from "@/components/tabs/adhoc-email-tab"
import { cn } from "@/lib/utils"
import {
  Users,
  Activity,
  BookOpen,
  Mail,
  Loader2,
} from "lucide-react"

type HealthStatus = {
  gemini: { ok: boolean; error?: string }
  resend: { ok: boolean; error?: string }
}

type Sequence = {
  id: string
  name: string
  subject?: string
  status: string
  audienceId?: string
  dayOfWeek?: string[]
  time?: string
  timezone?: string
  topicId?: string
}

type Audience = {
  id: string
  name: string
}

function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":")
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function DashboardTiles() {
  const router = useRouter()

  // Subscribers tile
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [subscribersLoading, setSubscribersLoading] = useState(true)

  // Health tile
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  // Manual emails sheet
  const [emailSheetOpen, setEmailSheetOpen] = useState(false)
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [sequencesLoading, setSequencesLoading] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendStatus, setSendStatus] = useState<Record<string, { type: "success" | "error"; message: string }>>({})

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fetch subscriber count
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/analytics?period=all", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (isMountedRef.current) {
            setSubscriberCount(data.additionalMetrics?.totalSubscribers ?? 0)
          }
        }
      } catch {
        // silent
      } finally {
        if (isMountedRef.current) setSubscribersLoading(false)
      }
    }
    load()
  }, [])

  // Fetch health
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/health", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (isMountedRef.current) setHealth(data)
        }
      } catch {
        if (isMountedRef.current) {
          setHealth({
            gemini: { ok: false, error: "Failed to check" },
            resend: { ok: false, error: "Failed to check" },
          })
        }
      } finally {
        if (isMountedRef.current) setHealthLoading(false)
      }
    }
    load()
  }, [])

  // Fetch sequences + audiences when sheet opens
  const loadEmailData = useCallback(async () => {
    setSequencesLoading(true)
    try {
      const [seqRes, audRes] = await Promise.all([
        fetch("/api/sequences", { cache: "no-store" }),
        fetch("/api/resend/audiences", { cache: "no-store" }),
      ])
      if (seqRes.ok) {
        const data = await seqRes.json()
        setSequences(data.filter((s: Sequence) => s.status === "active"))
      }
      if (audRes.ok) {
        const data = await audRes.json()
        setAudiences(data)
      }
    } catch {
      // silent
    } finally {
      setSequencesLoading(false)
    }
  }, [])

  const handleOpenEmailSheet = () => {
    setEmailSheetOpen(true)
    loadEmailData()
  }

  const handleSendNow = async (sequenceId: string, subject?: string) => {
    setSendingId(sequenceId)
    setSendStatus((prev) => {
      const next = { ...prev }
      delete next[sequenceId]
      return next
    })

    try {
      const res = await fetch(`/api/sequences/${sequenceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject }),
      })

      if (res.ok) {
        const data = await res.json()
        setSendStatus((prev) => ({
          ...prev,
          [sequenceId]: {
            type: "success",
            message: data.message || "Newsletter sent successfully!",
          },
        }))
      } else {
        const err = await res.json()
        setSendStatus((prev) => ({
          ...prev,
          [sequenceId]: {
            type: "error",
            message: err.error || "Failed to send",
          },
        }))
      }
    } catch {
      setSendStatus((prev) => ({
        ...prev,
        [sequenceId]: { type: "error", message: "Network error" },
      }))
    } finally {
      setSendingId(null)
    }
  }

  const getAudienceName = (audienceId?: string) => {
    if (!audienceId) return "—"
    if (audienceId === "resend_all" || audienceId === "local_all") return "All Subscribers"
    return audiences.find((a) => a.id === audienceId)?.name || audienceId
  }

  const allHealthy = health?.gemini.ok && health?.resend.ok

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl" style={{ color: "#0d0d0d" }}>
            Dashboard
          </h1>
          <p className="text-[color:var(--text-secondary)] mt-1 text-sm">
            Quick actions and system overview
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Tile 1: Subscribers */}
          <Card
            className="min-h-[140px] cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
            onClick={() => router.push("/admin/subscribers")}
          >
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(60, 53, 242, 0.1)" }}
                >
                  <Users className="h-5 w-5" style={{ color: "#3c35f2" }} />
                </div>
                {subscribersLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight" style={{ color: "#0d0d0d" }}>
                  {subscribersLoading ? "..." : (subscriberCount?.toLocaleString() ?? "0")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Active Subscribers</p>
              </div>
            </CardContent>
          </Card>

          {/* Tile 2: API Health */}
          <Card
            className="min-h-[140px] cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
            onClick={() => router.push("/admin/settings")}
          >
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: healthLoading
                      ? "rgba(161, 161, 170, 0.1)"
                      : allHealthy
                        ? "rgba(34, 197, 94, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <Activity
                    className="h-5 w-5"
                    style={{
                      color: healthLoading
                        ? "#a1a1aa"
                        : allHealthy
                          ? "#16a34a"
                          : "#dc2626",
                    }}
                  />
                </div>
                {healthLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <span
                    className={cn(
                      "inline-flex h-3 w-3 rounded-full",
                      allHealthy ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                )}
              </div>
              <div className="mt-4">
                {healthLoading ? (
                  <p className="text-lg font-semibold text-muted-foreground">Checking...</p>
                ) : allHealthy ? (
                  <p className="text-lg font-semibold text-green-700">All Systems OK</p>
                ) : (
                  <div className="space-y-1">
                    {health && !health.gemini.ok && (
                      <p className="text-sm font-medium text-red-600">
                        Gemini: {health.gemini.error || "Error"}
                      </p>
                    )}
                    {health && !health.resend.ok && (
                      <p className="text-sm font-medium text-red-600">
                        Resend: {health.resend.error || "Error"}
                      </p>
                    )}
                  </div>
                )}
                <p className="mt-1 text-sm text-muted-foreground">API System Health</p>
              </div>
            </CardContent>
          </Card>

          {/* Tile 3: Add Content */}
          <Card
            className="min-h-[140px] cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
            onClick={() => router.push("/admin/saved-content")}
          >
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(60, 53, 242, 0.1)" }}
              >
                <BookOpen className="h-5 w-5" style={{ color: "#3c35f2" }} />
              </div>
              <div className="mt-4">
                <p className="text-lg font-semibold" style={{ color: "#0d0d0d" }}>
                  Add Content
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Reading & Cooking</p>
              </div>
            </CardContent>
          </Card>

          {/* Tile 4: Manual Emails */}
          <Card
            className="min-h-[140px] cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
            onClick={handleOpenEmailSheet}
          >
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(60, 53, 242, 0.1)" }}
              >
                <Mail className="h-5 w-5" style={{ color: "#3c35f2" }} />
              </div>
              <div className="mt-4">
                <p className="text-lg font-semibold" style={{ color: "#0d0d0d" }}>
                  Manual Emails
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Send newsletters</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Emails Sheet */}
      <Sheet open={emailSheetOpen} onOpenChange={setEmailSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto rounded-t-2xl md:h-[85vh]"
        >
          <SheetHeader className="pb-4">
            <SheetTitle>Manual Emails</SheetTitle>
            <SheetDescription>
              Send an email from an active sequence or compose an ad-hoc message
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="sequences" className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="sequences" className="flex-1">
                Active Sequences
              </TabsTrigger>
              <TabsTrigger value="adhoc" className="flex-1">
                Ad Hoc
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sequences" className="space-y-4">
              {sequencesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sequences.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No active sequences. Create one from the Emails page.
                </div>
              ) : (
                sequences.map((seq) => (
                  <Card key={seq.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{seq.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subject:</span>
                        <span className="font-medium text-right ml-2">
                          {seq.subject || "AI-generated"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Schedule:</span>
                        <span className="font-medium capitalize">
                          {seq.dayOfWeek?.map((d) => d.slice(0, 3)).join(", ") || "—"}{" "}
                          {seq.time ? `at ${formatTime12Hour(seq.time)}` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timezone:</span>
                        <span className="font-medium">{seq.timezone || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Audience:</span>
                        <span className="font-medium">{getAudienceName(seq.audienceId)}</span>
                      </div>
                      {seq.dayOfWeek && seq.dayOfWeek.length > 0 && (
                        <div className="pt-1">
                          <DayBlocks selectedDays={seq.dayOfWeek} />
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendNow(seq.id, seq.subject)
                          }}
                          disabled={sendingId === seq.id}
                        >
                          {sendingId === seq.id ? "Sending..." : "Send Now"}
                        </Button>
                      </div>

                      {sendStatus[seq.id] && (
                        <div
                          className={cn(
                            "rounded-md p-2 text-xs",
                            sendStatus[seq.id].type === "success"
                              ? "border border-[rgba(60,53,242,0.2)] bg-[rgba(60,53,242,0.06)] text-[#3c35f2]"
                              : "border border-red-200 bg-red-50 text-red-800"
                          )}
                        >
                          {sendStatus[seq.id].message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="adhoc">
              <AdHocEmailTab />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}
