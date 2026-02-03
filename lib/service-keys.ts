import { findApiKeyByService, updateApiKey, upsertApiKey } from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"

type ServiceName = "resend" | "gemini"

const ENV_KEY_MAP: Record<ServiceName, string> = {
  resend: "RESEND_API_KEY",
  gemini: "GEMINI_API_KEY",
}

export async function getServiceApiKey(service: ServiceName): Promise<string | null> {
  const config = await findApiKeyByService(service)
  const encryptedKey = config?.key

  if (encryptedKey) {
    try {
      const { plaintext, needsRotation } = decryptWithMetadata(encryptedKey)
      if (needsRotation && config?.id) {
        await updateApiKey(config.id, { key: encrypt(plaintext) })
      }
      return plaintext
    } catch (error) {
      console.warn(`[ServiceKey] Failed to decrypt stored ${service} key, attempting env fallback.`)
    }
  }

  const fallback = process.env[ENV_KEY_MAP[service]]
  if (fallback) {
    try {
      if (config?.id) {
        await updateApiKey(config.id, { key: encrypt(fallback), status: "connected" })
      } else {
        await upsertApiKey(service, { key: encrypt(fallback), status: "connected" })
      }
    } catch (error) {
      console.warn(`[ServiceKey] Failed to persist fallback ${service} key, using env key in-memory.`)
    }
    return fallback
  }

  return null
}
