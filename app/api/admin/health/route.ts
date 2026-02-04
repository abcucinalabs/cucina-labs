import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getServiceApiKey } from "@/lib/service-keys"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { normalizeGeminiModel } from "@/lib/gemini-model"
import { findApiKeyByService } from "@/lib/dal"

export const dynamic = "force-dynamic"

type ServiceStatus = { ok: boolean; error?: string }

async function checkGemini(): Promise<ServiceStatus> {
  try {
    const key = await getServiceApiKey("gemini")
    if (!key) return { ok: false, error: "API key not configured" }

    const config = await findApiKeyByService("gemini")
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({
      model: normalizeGeminiModel(config?.geminiModel),
    })
    await model.generateContent("test")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

async function checkResend(): Promise<ServiceStatus> {
  try {
    const key = await getServiceApiKey("resend")
    if (!key) return { ok: false, error: "API key not configured" }

    const response = await fetch("https://api.resend.com/audiences?limit=1", {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Resend API (${response.status}): ${text}`)
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

export async function GET() {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [gemini, resend] = await Promise.all([checkGemini(), checkResend()])

  return NextResponse.json({ gemini, resend })
}
