"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type Contact = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  unsubscribed: boolean
  createdAt: string
  audiences: string[]
}

export default function SubscribersPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [audiences, setAudiences] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const requestIdRef = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchContacts(controller.signal)
    return () => controller.abort()
  }, [])

  const fetchContacts = async (signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    try {
      const response = await fetch("/api/resend/contacts", { signal })
      if (response.ok) {
        const data = await response.json()
        if (requestId === requestIdRef.current) {
          setContacts(data.contacts || [])
          setAudiences(data.audiences || [])
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Failed to fetch contacts:", error)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  const filtered = contacts.filter((c) =>
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const subscribedCount = contacts.filter((c) => !c.unsubscribed).length
  const unsubscribedCount = contacts.filter((c) => c.unsubscribed).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Subscribers</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          View and manage your email subscribers from Resend
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{contacts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subscribed</CardDescription>
            <CardTitle className="text-2xl">{subscribedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unsubscribed</CardDescription>
            <CardTitle className="text-2xl">{unsubscribedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            Contacts synced from your Resend account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? "No contacts match your search." : "No contacts found in Resend."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Audiences</th>
                    <th className="text-left py-3 font-medium text-muted-foreground">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b border-[var(--border-default)] last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-medium">{contact.email}</span>
                      </td>
                      <td className="py-3 pr-4">
                        {contact.unsubscribed ? (
                          <Badge variant="destructive">Unsubscribed</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.audiences.length > 0 ? (
                            contact.audiences.map((name) => (
                              <Badge key={name} variant="outline" className="text-xs">
                                {name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
