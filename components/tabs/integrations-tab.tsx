"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sparkles, Mail } from "lucide-react"

interface Integration {
  status: string
  hasKey: boolean
  geminiModel?: string
  resendFromName?: string
  resendFromEmail?: string
}

const geminiModels = [
  { value: "gemini-2.5-flash-preview-05-20", label: "gemini-2.5-flash", description: "Latest, recommended" },
  { value: "gemini-2.0-flash", label: "gemini-2.0-flash", description: "Fast" },
  { value: "gemini-1.5-pro", label: "gemini-1.5-pro", description: "Stable" },
]

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({})
  const [expandedItem, setExpandedItem] = useState<string>("")

  // Form states
  const [geminiKey, setGeminiKey] = useState("")
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash-preview-05-20")

  const [resendKey, setResendKey] = useState("")
  const [resendFromName, setResendFromName] = useState('Adrian & Jimmy from "AI Product Briefing"')
  const [resendFromEmail, setResendFromEmail] = useState("hello@jimmy-iliohan.com")

  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations")
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data)

        // Set initial values from existing integrations
        if (data.gemini) {
          setGeminiModel(data.gemini.geminiModel || "gemini-2.5-flash-preview-05-20")
        }
        if (data.resend) {
          setResendFromName(data.resend.resendFromName || 'Adrian & Jimmy from "AI Product Briefing"')
          setResendFromEmail(data.resend.resendFromEmail || "hello@jimmy-iliohan.com")
        }
      }
    } catch (error) {
      console.error("Failed to fetch integrations:", error)
    }
  }

  const handleTestConnection = async (service: string) => {
    const hasStoredKey = integrations[service]?.hasKey
    const localKey =
      service === "gemini" ? geminiKey : resendKey

    if (!localKey && !hasStoredKey) {
      alert("Please enter an API key first")
      return
    }

    setIsTesting(service)
    try {
      const payload: Record<string, string> = { service }
      if (service === "gemini" && geminiKey) {
        payload.key = geminiKey
        payload.geminiModel = geminiModel
      }
      if (service === "resend" && resendKey) payload.key = resendKey

      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      alert(data.success ? "Connection successful!" : `Connection failed: ${data.error || "Unknown error"}`)
      fetchIntegrations()
    } catch (error) {
      alert("Test failed")
    } finally {
      setIsTesting(null)
    }
  }

  const handleSaveGemini = async () => {
    setIsLoading("gemini")
    try {
      const payload: any = { service: "gemini", geminiModel }
      if (geminiKey) payload.key = geminiKey

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setGeminiKey("")
        fetchIntegrations()
        alert("Gemini configuration saved!")
      }
    } catch (error) {
      console.error("Failed to save Gemini config:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleSaveResend = async () => {
    setIsLoading("resend")
    try {
      const payload: any = {
        service: "resend",
        resendFromName,
        resendFromEmail,
      }
      if (resendKey) payload.key = resendKey

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setResendKey("")
        fetchIntegrations()
        alert("Resend configuration saved!")
      }
    } catch (error) {
      console.error("Failed to save Resend config:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const geminiStatus = integrations.gemini?.status || "disconnected"
  const resendStatus = integrations.resend?.status || "disconnected"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">API Integrations</h2>
        <p className="text-[color:var(--text-secondary)] mt-1">
          Configure your API connections for the newsletter workflow
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        value={expandedItem}
        onValueChange={setExpandedItem}
        className="space-y-4"
      >
        {/* Gemini API */}
        <AccordionItem value="gemini">
          <AccordionTrigger>
            <div className="flex items-center gap-4 flex-1">
              <div className="icon-badge icon-badge--green">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Gemini API</h3>
                <p className="text-sm text-muted-foreground">AI content curation & generation</p>
              </div>
            </div>
            <Badge
              variant={geminiStatus === "connected" ? "success" : "secondary"}
              className="mr-4"
            >
              {geminiStatus}
            </Badge>
          </AccordionTrigger>
          <AccordionContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">API Key</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="gemini-key"
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={integrations.gemini?.hasKey ? "••••••••••••••••••••••••••••••••••••" : "Enter your Gemini API key"}
                />
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("gemini")}
                  disabled={isTesting === "gemini"}
                  isLoading={isTesting === "gemini"}
                  className="w-full sm:w-auto"
                >
                  Test Connection
                </Button>
              </div>
              {!geminiKey && integrations.gemini?.hasKey && (
                <p className="text-xs text-muted-foreground">Saved. Leave blank to keep the existing key.</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Model Selection</Label>
              <RadioGroup value={geminiModel} onValueChange={setGeminiModel}>
                {geminiModels.map((model) => (
                  <div key={model.value} className="flex items-center space-x-3 py-2">
                    <RadioGroupItem value={model.value} id={model.value} />
                    <Label htmlFor={model.value} className="flex-1 cursor-pointer">
                      <span className="text-foreground">{model.label}</span>
                      <span className="text-muted-foreground ml-2">({model.description})</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-4 border-t border-[var(--border-default)] sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setExpandedItem("")}>
                Cancel
              </Button>
              <Button onClick={handleSaveGemini} disabled={isLoading === "gemini"} isLoading={isLoading === "gemini"}>
                Save Changes
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Resend API */}
        <AccordionItem value="resend">
          <AccordionTrigger>
            <div className="flex items-center gap-4 flex-1">
              <div className="icon-badge icon-badge--blue">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Resend API</h3>
                <p className="text-sm text-muted-foreground">Email delivery & audiences</p>
              </div>
            </div>
            <Badge
              variant={resendStatus === "connected" ? "success" : "secondary"}
              className="mr-4"
            >
              {resendStatus}
            </Badge>
          </AccordionTrigger>
          <AccordionContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="resend-key">API Key</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="resend-key"
                  type="password"
                  value={resendKey}
                  onChange={(e) => setResendKey(e.target.value)}
                  placeholder={integrations.resend?.hasKey ? "••••••••••••••••••••••••••••••••••••" : "Enter your Resend API key"}
                />
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("resend")}
                  disabled={isTesting === "resend"}
                  isLoading={isTesting === "resend"}
                  className="w-full sm:w-auto"
                >
                  Test Connection
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                value={resendFromName}
                onChange={(e) => setResendFromName(e.target.value)}
                placeholder='Adrian & Jimmy from "AI Product Briefing"'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                value={resendFromEmail}
                onChange={(e) => setResendFromEmail(e.target.value)}
                placeholder="hello@jimmy-iliohan.com"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-4 border-t border-[var(--border-default)] sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setExpandedItem("")}>
                Cancel
              </Button>
              <Button onClick={handleSaveResend} disabled={isLoading === "resend"} isLoading={isLoading === "resend"}>
                Save Changes
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
