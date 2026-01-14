"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Pause, Trash2 } from "lucide-react"
import { SequenceWizard } from "@/components/sequence-wizard"
import { DayBlocks } from "@/components/ui/day-blocks"

function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function SequencesTab() {
  const [sequences, setSequences] = useState<any[]>([])
  const [openWizard, setOpenWizard] = useState(false)
  const [editingSequence, setEditingSequence] = useState<any>(null)
  const [audiences, setAudiences] = useState<any[]>([])

  useEffect(() => {
    fetchSequences()
    fetchAudiences()
  }, [])

  const fetchSequences = async () => {
    try {
      const response = await fetch("/api/sequences")
      if (response.ok) {
        const data = await response.json()
        setSequences(data)
      }
    } catch (error) {
      console.error("Failed to fetch sequences:", error)
    }
  }

  const fetchAudiences = async () => {
    try {
      const response = await fetch("/api/resend/audiences")
      if (response.ok) {
        const data = await response.json()
        setAudiences(data)
      }
    } catch (error) {
      console.error("Failed to fetch audiences:", error)
    }
  }

  const handleEdit = (sequence: any) => {
    setEditingSequence(sequence)
    setOpenWizard(true)
  }

  const handlePause = async (id: string) => {
    try {
      await fetch(`/api/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      })
      fetchSequences()
    } catch (error) {
      console.error("Failed to pause sequence:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sequence?")) return
    try {
      await fetch(`/api/sequences/${id}`, { method: "DELETE" })
      fetchSequences()
    } catch (error) {
      console.error("Failed to delete sequence:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Newsletter Sequences</h2>
          <p className="text-muted-foreground mt-1">
            Manage your automated newsletter sequences
          </p>
        </div>
        <Button onClick={() => {
          setEditingSequence(null)
          setOpenWizard(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Sequence
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.map((sequence) => (
                <TableRow
                  key={sequence.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(sequence)}
                >
                  <TableCell className="font-medium">{sequence.name}</TableCell>
                  <TableCell>
                    {audiences.find((audience) => audience.id === sequence.audienceId)?.name ||
                      sequence.audienceId}
                  </TableCell>
                  <TableCell>
                    <DayBlocks selectedDays={sequence.dayOfWeek || []} />
                  </TableCell>
                  <TableCell>
                    {formatTime12Hour(sequence.time)} {sequence.timezone || 'UTC'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sequence.status === "active" ? "success" : "outline"}>
                      {sequence.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sequence.lastSent
                      ? new Date(sequence.lastSent).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sequence)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {sequence.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePause(sequence.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sequence.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {openWizard && (
        <SequenceWizard
          open={openWizard}
          onClose={() => {
            setOpenWizard(false)
            setEditingSequence(null)
            fetchSequences()
          }}
          sequence={editingSequence}
        />
      )}
    </div>
  )
}
