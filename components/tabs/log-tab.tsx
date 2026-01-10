"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RefreshCcw } from "lucide-react"

interface NewsActivity {
  id: string
  event: string
  status: string
  message: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

const statusStyles: Record<string, string> = {
  success: "border border-[rgba(155,242,202,0.7)] bg-[rgba(155,242,202,0.35)] text-[#0d0d0d]",
  warning: "border border-amber-500/20 bg-amber-500/10 text-amber-700",
  error: "border border-red-500/20 bg-red-500/10 text-red-700",
  info: "border border-[rgba(74,81,217,0.35)] bg-[rgba(74,81,217,0.12)] text-[#4a51d9]",
}

export function LogTab() {
  const [logs, setLogs] = useState<NewsActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const fetchLogs = async (options?: { silent?: boolean }) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    if (!options?.silent) {
      setIsLoading(true)
    }
    if (!options?.silent) {
      setError(null)
    }
    try {
      const response = await fetch("/api/news/logs?limit=100")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || "Failed to load logs.")
      }
    } catch (error) {
      console.error("Failed to fetch news logs:", error)
      setError("Failed to load logs.")
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(() => {
      fetchLogs({ silent: true })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>News Activity Log</CardTitle>
              <CardDescription>Track ingestion, integrations, and RSS changes.</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchLogs} disabled={isLoading} isLoading={isLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[log.status] || statusStyles.info}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.event}</TableCell>
                    <TableCell className="text-[color:var(--text-secondary)]">
                      <div className="flex items-center justify-between gap-3">
                        <span>{log.message}</span>
                        {log.metadata ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">Details</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Log Details</DialogTitle>
                                <DialogDescription>{log.event}</DialogDescription>
                              </DialogHeader>
                              <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-lg p-3">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </DialogContent>
                          </Dialog>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
