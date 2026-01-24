import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const KEY_LENGTH = 32

// Scrypt parameters for secure key derivation
const SCRYPT_OPTIONS = {
  N: 16384,  // CPU/memory cost parameter (2^14)
  r: 8,      // Block size
  p: 1,      // Parallelization parameter
}

function deriveKey(masterKey: string, salt: Buffer): Buffer {
  if (!masterKey || masterKey.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters long")
  }

  return crypto.scryptSync(
    masterKey,
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS
  )
}

export function encrypt(text: string): string {
  const masterKey = process.env.ENCRYPTION_KEY
  if (!masterKey) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  // Generate random salt for this encryption (prevents rainbow tables)
  const salt = crypto.randomBytes(SALT_LENGTH)

  // Derive key from master key + salt
  const key = deriveKey(masterKey, salt)

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH)

  // Encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  const tag = cipher.getAuthTag()

  // Include salt in output so we can derive the same key during decryption
  return `${salt.toString("hex")}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`
}

export function decryptWithMetadata(encryptedText: string): {
  plaintext: string
  needsRotation: boolean
} {
  const masterKey = process.env.ENCRYPTION_KEY
  if (!masterKey) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  const parts = encryptedText.split(":")

  // Handle both old format (3 parts) and new format (4 parts with salt)
  if (parts.length === 4) {
    // New format with salt
    const salt = Buffer.from(parts[0], "hex")
    const iv = Buffer.from(parts[1], "hex")
    const tag = Buffer.from(parts[2], "hex")
    const encrypted = parts[3]

    const key = deriveKey(masterKey, salt)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return { plaintext: decrypted, needsRotation: false }
  } else if (parts.length === 3) {
    // Old format without salt (for backward compatibility during migration)
    const iv = Buffer.from(parts[0], "hex")
    const tag = Buffer.from(parts[1], "hex")
    const encrypted = parts[2]

    // Use old key derivation method for legacy data
    const legacySalt = "salt"
    const key = crypto.scryptSync(masterKey, legacySalt, KEY_LENGTH, SCRYPT_OPTIONS)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return { plaintext: decrypted, needsRotation: true }
  } else {
    throw new Error("Invalid encrypted text format")
  }
}

export function decrypt(encryptedText: string): string {
  return decryptWithMetadata(encryptedText).plaintext
}
