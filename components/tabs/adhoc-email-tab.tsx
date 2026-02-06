"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Send } from "lucide-react"

type Audience = {
  id: string
  name: string
}

// Base email template - content will be injected into the body
const generateEmailHtml = (bodyContent: string) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>cucina labs</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    u + #body a { color: inherit; text-decoration: none; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    div[style*="margin: 16px 0"] { margin: 0 !important; }
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding: 20px 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #0d0d0d; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">
                <!-- HEADER -->
                <tr>
                  <td bgcolor="#0d0d0d" style="padding: 32px 40px; background-color: #0d0d0d;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="left">
                          <h1 style="margin: 0 0 4px; font-size: 48px; font-weight: 400; color: #ffffff; line-height: 1.1; letter-spacing: -0.02em;">cucina <strong style="font-weight: 700;">labs</strong></h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- MAIN CONTENT -->
                <tr>
                  <td style="padding: 40px 40px;">
                    ${bodyContent.split('\n').map(line =>
                      line.trim() ? `<p style="margin: 0 0 16px; font-size: 15px; color: #0d0d0d; line-height: 1.6;">${line}</p>` : ''
                    ).join('\n                    ')}
                  </td>
                </tr>
                <!-- FOOTER -->
                <tr>
                  <td style="padding: 24px 40px 36px; text-align: center;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px;">
                      <tr>
                        <td style="height: 1px; background: rgba(0, 0, 0, 0.08); font-size: 0; line-height: 0;">&nbsp;</td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 10px; color: rgba(13, 13, 13, 0.5); font-size: 12px;">You are receiving this because you subscribed to <strong>cucina labs</strong>.</p>
                    <a href="#" style="color: #3c35f2; text-decoration: underline; font-weight: 600; font-size: 12px;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

export function AdHocEmailTab() {
  const [subject, setSubject] = useState("")
  const [bodyContent, setBodyContent] = useState("")
  const [recipientType, setRecipientType] = useState<"emails" | "audience">("emails")
  const [emailAddresses, setEmailAddresses] = useState("")
  const [selectedAudienceId, setSelectedAudienceId] = useState("")
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [isLoadingAudiences, setIsLoadingAudiences] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchAudiences()
  }, [])

  const fetchAudiences = async () => {
    setIsLoadingAudiences(true)
    try {
      const response = await fetch("/api/resend/audiences", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setAudiences(data)
      }
    } catch (error) {
      console.error("Failed to fetch audiences:", error)
    } finally {
      setIsLoadingAudiences(false)
    }
  }

  const emailHtml = useMemo(() => {
    return generateEmailHtml(bodyContent || "Your email content will appear here...")
  }, [bodyContent])

  const validateEmails = (emails: string): string[] => {
    const emailList = emails.split(",").map(e => e.trim()).filter(e => e)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailList.filter(email => emailRegex.test(email))
  }

  const canSend = () => {
    if (!subject.trim() || !bodyContent.trim()) return false
    if (recipientType === "emails") {
      const validEmails = validateEmails(emailAddresses)
      return validEmails.length > 0
    }
    return !!selectedAudienceId
  }

  const handleSend = async () => {
    if (!canSend()) return

    const recipients = recipientType === "emails"
      ? { emails: validateEmails(emailAddresses) }
      : { audienceId: selectedAudienceId }

    setIsSending(true)
    try {
      const response = await fetch("/api/email/send-adhoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html: emailHtml,
          ...recipients,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Email sent successfully! ${data.count || ''} recipient(s)`)
        // Reset form
        setSubject("")
        setBodyContent("")
        setEmailAddresses("")
        setSelectedAudienceId("")
        setShowPreview(false)
      } else {
        const error = await response.json()
        alert(`Failed to send: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Failed to send email:", error)
      alert("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Ad Hoc Email</CardTitle>
          <CardDescription>
            Send a one-time email to specific recipients or an audience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="adhoc-subject">Email Subject</Label>
            <Input
              id="adhoc-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          {/* Body Content */}
          <div className="space-y-2">
            <Label htmlFor="adhoc-body">Email Body</Label>
            <Textarea
              id="adhoc-body"
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              placeholder="Write your email content here. Each line will become a paragraph..."
              className="min-h-[150px]"
            />
            <p className="text-sm text-muted-foreground">
              Each line will be formatted as a separate paragraph in the email
            </p>
          </div>

          {/* Recipient Type */}
          <div className="space-y-3">
            <Label>Send To</Label>
            <RadioGroup
              value={recipientType}
              onValueChange={(value) => setRecipientType(value as "emails" | "audience")}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="emails" id="recipient-emails" />
                <Label htmlFor="recipient-emails" className="font-normal cursor-pointer">
                  Specific email addresses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="audience" id="recipient-audience" />
                <Label htmlFor="recipient-audience" className="font-normal cursor-pointer">
                  Audience / Distribution list
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Email Addresses Input */}
          {recipientType === "emails" && (
            <div className="space-y-2">
              <Label htmlFor="email-addresses">Email Addresses</Label>
              <Input
                id="email-addresses"
                value={emailAddresses}
                onChange={(e) => setEmailAddresses(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple addresses with commas
              </p>
              {emailAddresses && (
                <p className="text-sm text-muted-foreground">
                  {validateEmails(emailAddresses).length} valid email(s) detected
                </p>
              )}
            </div>
          )}

          {/* Audience Selector */}
          {recipientType === "audience" && (
            <div className="space-y-2">
              <Label htmlFor="audience-select">Select Audience</Label>
              {isLoadingAudiences ? (
                <div className="text-sm text-muted-foreground">Loading audiences...</div>
              ) : audiences.length === 0 ? (
                <div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-muted-foreground">
                  No audiences available. Configure Resend integration first.
                </div>
              ) : (
                <Select value={selectedAudienceId} onValueChange={setSelectedAudienceId}>
                  <SelectTrigger id="audience-select" className="w-full">
                    <SelectValue placeholder="Select an audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((audience) => (
                      <SelectItem key={audience.id} value={audience.id}>
                        {audience.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full sm:w-auto"
            >
              {showPreview ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </>
              )}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend() || isSending}
              isLoading={isSending}
              className="w-full sm:w-auto"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-muted)] px-4 py-2">
                <span className="text-sm font-medium">Email Preview</span>
                <span className="text-xs text-muted-foreground">Subject: {subject || "(no subject)"}</span>
              </div>
              <iframe
                title="Ad hoc email preview"
                className="w-full min-h-[520px] border-0 md:min-h-[620px]"
                sandbox=""
                srcDoc={emailHtml}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
