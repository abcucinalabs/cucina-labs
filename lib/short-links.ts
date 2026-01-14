import { prisma } from "./db"
import { customAlphabet } from 'nanoid'

// Use URL-safe characters only (no ambiguous characters like 0, O, I, l)
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 8)

export async function createShortLink(
  targetUrl: string,
  articleId?: string | null,
  sequenceId?: string | null
): Promise<string> {
  // Check if short link already exists for this URL
  const existing = await prisma.shortLink.findFirst({
    where: {
      targetUrl,
      articleId: articleId || null,
      sequenceId: sequenceId || null,
    },
  })

  if (existing) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://cucinalabs.com'
    return `${baseUrl}/r/${existing.shortCode}`
  }

  // Generate unique short code
  let shortCode: string
  let attempts = 0
  const maxAttempts = 5

  do {
    shortCode = nanoid()
    const exists = await prisma.shortLink.findUnique({
      where: { shortCode },
    })

    if (!exists) break
    attempts++
  } while (attempts < maxAttempts)

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique short code')
  }

  // Create short link
  const link = await prisma.shortLink.create({
    data: {
      shortCode,
      targetUrl,
      articleId,
      sequenceId,
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://cucinalabs.com'
  return `${baseUrl}/r/${link.shortCode}`
}

export async function getShortLinkStats(sequenceId?: string) {
  const where = sequenceId ? { sequenceId } : {}

  const stats = await prisma.shortLink.aggregate({
    where,
    _sum: {
      clicks: true,
    },
    _count: true,
  })

  return {
    totalLinks: stats._count,
    totalClicks: stats._sum.clicks || 0,
  }
}
