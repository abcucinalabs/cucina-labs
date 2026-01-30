"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff, RotateCcw } from "lucide-react"

const DEFAULT_WELCOME_HTML = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Welcome to cucina labs!</title>
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
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    /* iOS blue links */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    /* Gmail blue links */
    u + #body a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }

    /* Prevent Outlook.com from adding extra spacing */
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
      line-height: 100%;
    }

    /* What it does: Centers email on Android 4.4 */
    div[style*="margin: 16px 0"] { margin: 0 !important; }

    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding: 20px 15px !important; }
      .mobile-heading { font-size: 28px !important; }
      .mobile-text { font-size: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #0d0d0d; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
        <![endif]-->
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
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.15em;">Welcome</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- MAIN CONTENT -->
                <tr>
                  <td style="padding: 40px 40px;">

                    <p style="margin: 0 0 20px; font-size: 17px; color: #0d0d0d; line-height: 1.6; font-weight: 600;">Welcome Chef!</p>

                    <p style="margin: 0 0 24px; font-size: 15px; color: #0d0d0d; line-height: 1.6;">Thanks for subscribing to the <strong>cucina labs</strong> newsletter. You've just joined a community of AI builders and product leaders who want to stay ahead of the curve.</p>

                    <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #0d0d0d; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #0d0d0d; padding-bottom: 8px;">What's on the menu</h2>

                    <p style="margin: 0 0 16px; font-size: 15px; color: #0d0d0d; line-height: 1.6;"><strong>Daily AI News & Insights:</strong> Every day, we serve up a curated list of the latest developments and updates in artificial intelligence. We cut through the noise and highlight what matters.</p>

                    <p style="margin: 0 0 24px; font-size: 15px; color: #0d0d0d; line-height: 1.6; border-bottom: 2px solid #0d0d0d; padding-bottom: 24px;"><strong>Weekly Updates:</strong> Once a week, we showcase our experiments and projects. We'll share prototypes and recipes that will help you build cool things with AI.</p>

                    <p style="margin: 0 0 16px; font-size: 15px; color: #0d0d0d; line-height: 1.6;">Your first briefing arrives tomorrow morning. We're thrilled to have you in the kitchen with us.</p>

                    <p style="margin: 0 0 8px; font-size: 15px; color: #0d0d0d; line-height: 1.6; font-weight: 700;">Let's cook.</p>

                    <p style="margin: 0; font-size: 15px; color: #0d0d0d; line-height: 1.6;">the <strong>cucina labs</strong> team</p>

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
        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`

export function SettingsTab() {
  const [welcomeEmailEnabled, setWelcomeEmailEnabled] = useState(false)
  const [welcomeEmailSubject, setWelcomeEmailSubject] = useState("Welcome to cucina labs")
  const [welcomeEmailHtml, setWelcomeEmailHtml] = useState(DEFAULT_WELCOME_HTML)
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingToggle, setIsSavingToggle] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/email-templates/welcome")
      if (response.ok) {
        const data = await response.json()
        setWelcomeEmailEnabled(data.enabled)
        setWelcomeEmailSubject(data.subject || "Welcome to cucina labs")
        setWelcomeEmailHtml(data.html || DEFAULT_WELCOME_HTML)
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }

  const handleToggleChange = async (enabled: boolean) => {
    setWelcomeEmailEnabled(enabled)
    setIsSavingToggle(true)
    try {
      await fetch("/api/email-templates/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          subject: welcomeEmailSubject,
          html: welcomeEmailHtml,
        }),
      })
    } catch (error) {
      console.error("Failed to save toggle:", error)
      setWelcomeEmailEnabled(!enabled)
    } finally {
      setIsSavingToggle(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/email-templates/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: welcomeEmailEnabled,
          subject: welcomeEmailSubject,
          html: welcomeEmailHtml,
        }),
      })
      if (response.ok) {
        alert("Welcome email settings saved successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to save: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetToDefault = () => {
    if (confirm("Reset the email template to the default? Your changes will be lost.")) {
      setWelcomeEmailHtml(DEFAULT_WELCOME_HTML)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome Email</CardTitle>
          <CardDescription>
            Configure the welcome email sent to new subscribers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="welcome-email">Enable Welcome Email</Label>
              <p className="text-sm text-muted-foreground">
                Send a welcome email when users subscribe
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSavingToggle && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
              <Switch
                id="welcome-email"
                checked={welcomeEmailEnabled}
                onCheckedChange={handleToggleChange}
                disabled={isSavingToggle}
              />
            </div>
          </div>

          {welcomeEmailEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Email Subject</Label>
                <Input
                  id="email-subject"
                  value={welcomeEmailSubject}
                  onChange={(e) => setWelcomeEmailSubject(e.target.value)}
                  placeholder="Welcome to cucina labs"
                />
                <p className="text-sm text-muted-foreground">
                  The subject line for the welcome email
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Template</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetToDefault}
                      className="h-8 px-2 text-xs"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Reset to Default
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCode(!showCode)}
                      className="h-8 px-2 text-xs"
                    >
                      {showCode ? "Hide Code" : "Edit Code"}
                    </Button>
                  </div>
                </div>

                {showCode && (
                  <Textarea
                    value={welcomeEmailHtml}
                    onChange={(e) => setWelcomeEmailHtml(e.target.value)}
                    className="font-mono text-xs min-h-[300px]"
                    placeholder="Enter HTML for your welcome email..."
                  />
                )}
              </div>

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
                  onClick={handleSave}
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
              </div>

              {showPreview && (
                <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-muted)] px-4 py-2">
                    <span className="text-sm font-medium">Email Preview</span>
                    <span className="text-xs text-muted-foreground">Subject: {welcomeEmailSubject}</span>
                  </div>
                  <iframe
                    title="Welcome email preview"
                    className="w-full min-h-[520px] border-0 md:min-h-[620px]"
                    sandbox=""
                    srcDoc={welcomeEmailHtml}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
