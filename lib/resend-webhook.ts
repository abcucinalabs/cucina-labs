import crypto from "crypto"

const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000

type ParsedSignature = {
  signature: string
  timestamp?: number
  signedTimestamp?: string
}

const parseTimestamp = (value?: string): number | undefined => {
  if (!value) return undefined
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return undefined
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000
}

export const parseResendSignature = (
  signatureHeader?: string,
  timestampHeader?: string
): ParsedSignature | null => {
  if (signatureHeader && signatureHeader.includes("t=")) {
    const parts = signatureHeader.split(",").map((part) => part.trim())
    const parsed = parts.reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split("=")
      if (key && value) {
        acc[key] = value
      }
      return acc
    }, {})

    const signature = parsed.v1 || parsed.signature
    if (!signature) return null
    const timestampValue = parsed.t || timestampHeader
    return {
      signature,
      timestamp: parseTimestamp(timestampValue),
      signedTimestamp: timestampValue,
    }
  }

  if (!signatureHeader) return null

  return {
    signature: signatureHeader,
    timestamp: parseTimestamp(timestampHeader),
    signedTimestamp: timestampHeader,
  }
}

const safeCompare = (a: string, b: string) => {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

export const verifyResendSignature = ({
  rawBody,
  signatureHeader,
  timestampHeader,
  secret,
  toleranceMs = DEFAULT_TOLERANCE_MS,
  now = Date.now(),
}: {
  rawBody: string
  signatureHeader?: string
  timestampHeader?: string
  secret: string
  toleranceMs?: number
  now?: number
}) => {
  const parsed = parseResendSignature(signatureHeader, timestampHeader)
  if (!parsed) {
    return { ok: false, error: "missing_signature" }
  }

  if (parsed.timestamp) {
    const delta = Math.abs(now - parsed.timestamp)
    if (delta > toleranceMs) {
      return { ok: false, error: "timestamp_out_of_range" }
    }
  }

  const signedPayload = parsed.signedTimestamp
    ? `${parsed.signedTimestamp}.${rawBody}`
    : rawBody

  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex")

  const ok = safeCompare(parsed.signature, expected)
  return { ok, error: ok ? undefined : "invalid_signature" }
}
