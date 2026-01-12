import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const welcomeEmailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AI Product Briefing</title>
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
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 20px; border: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">
                <tr>
                  <td bgcolor="#0d0d0d" background="https://cucina-labs.com/video-background-2-still.png" style="background-color: #0d0d0d; background-image: url('https://cucina-labs.com/video-background-2-still.png'); background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 20px 20px 0 0;">
                    <!--[if gte mso 9]>
                    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:220px;">
                      <v:fill type="frame" src="https://cucina-labs.com/video-background-2-still.png" color="#0d0d0d" />
                      <v:textbox inset="0,0,0,0">
                    <![endif]-->
                    <div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td bgcolor="#0d0d0d" style="padding: 32px 40px 36px; background-color: rgba(13, 13, 13, 0.55);">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="left" style="font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">
                                  Cucina Labs
                                </td>
                                <td align="right" style="font-size: 12px; color: rgba(255, 255, 255, 0.7);">
                                  Welcome Edition
                                </td>
                              </tr>
                            </table>
                            <p style="margin: 20px 0 10px; font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">AI Product Briefing</p>
                            <h1 style="margin: 0; color: #ffffff; font-size: 34px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.15;">Welcome to Cucina Labs</h1>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <!--[if gte mso 9]>
                      </v:textbox>
                    </v:rect>
                    <![endif]-->
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 36px 40px 40px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">
                      Your daily intelligence on AI product development.
                    </p>
                    <p style="margin: 0 0 18px 0; font-size: 16px; color: #0d0d0d; line-height: 1.6; font-weight: 600;">
                      Hi there! 👋
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">
                      Thanks for joining the AI Product Briefing community. Every morning, we'll send you a curated digest of the most important AI developments that matter to Product Managers and Engineering Leaders.
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
                      <tr>
                        <td style="padding: 24px; background: #fafafa; border: 1px solid rgba(0, 0, 0, 0.06); border-left: 3px solid #9bf2ca; border-radius: 16px;">
                          <p style="margin: 0 0 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a51d9;">What to expect</p>
                          <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">
                            <li style="margin: 0 0 10px;">Breaking news on LLMs, agentic AI, and AI infrastructure</li>
                            <li style="margin: 0 0 10px;">Strategic insights on build vs. buy decisions</li>
                            <li style="margin: 0 0 10px;">Technical deep-dives on RAG, fine-tuning, and model evaluation</li>
                            <li style="margin: 0;">Governance and safety updates that affect your roadmap</li>
                          </ul>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 32px 0; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">
                      Your first briefing arrives tomorrow morning. We can't wait to help you stay ahead.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #9bf2ca; border-radius: 10px; text-align: center;">
                          <a href="https://cucina-labs.com" style="display: inline-block; padding: 14px 32px; color: #0d0d0d; text-decoration: none; font-weight: 600; font-size: 14px;">Visit Cucina Labs</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px 36px; text-align: center;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent); margin: 0 0 20px;"></div>
                    <p style="margin: 0 0 10px; color: rgba(13, 13, 13, 0.5); font-size: 12px;">You are receiving this because you subscribed to Cucina Labs.</p>
                    <a href="{{unsubscribe_url}}" style="color: #3c35f2; text-decoration: none; font-weight: 600; font-size: 12px;">Unsubscribe</a>
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

// This endpoint updates the welcome email template in the database
// Call it once after deployment to update the subject line
export async function POST() {
  try {
    await prisma.emailTemplate.upsert({
      where: { type: "welcome" },
      update: {
        subject: "Welcome to cucina labs!",
        html: welcomeEmailHtml,
      },
      create: {
        type: "welcome",
        subject: "Welcome to cucina labs!",
        html: welcomeEmailHtml,
        enabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Welcome email template updated successfully",
    })
  } catch (error) {
    console.error("Error updating email template:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
