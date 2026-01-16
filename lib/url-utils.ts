/**
 * Wraps an external URL with our domain's redirect endpoint
 * This helps with email deliverability by routing all links through our domain
 *
 * @param url The external URL to wrap
 * @param origin The origin of our application (e.g., https://cucinlabs.com)
 * @returns The wrapped redirect URL
 */
export function wrapRedirectUrl(url: string, origin: string): string {
  if (!url || !origin) return url

  try {
    // Check if it's already a redirect URL from our domain
    const urlObj = new URL(url)
    const originObj = new URL(origin)

    if (urlObj.hostname === originObj.hostname) {
      if (urlObj.pathname.startsWith("/api/redirect")) {
        return url
      }
      if (urlObj.pathname.startsWith("/r/")) {
        return url
      }
    }

    if (urlObj.hostname === originObj.hostname && urlObj.pathname.startsWith("/api/redirect")) {
      // Already wrapped, return as-is
      return url
    }

    // Wrap the external URL
    const encodedUrl = encodeURIComponent(url)
    return `${origin}/api/redirect?url=${encodedUrl}`
  } catch (error) {
    // If URL parsing fails, return original URL
    console.error('Failed to parse URL for redirect wrapping:', url, error)
    return url
  }
}

/**
 * Wraps all URLs in an article object with redirect URLs
 */
export function wrapArticleUrls(article: any, origin: string): any {
  if (!article) return article

  return {
    ...article,
    link: article.link ? wrapRedirectUrl(article.link, origin) : article.link,
    source_link: article.source_link ? wrapRedirectUrl(article.source_link, origin) : article.source_link,
    sourceLink: article.sourceLink ? wrapRedirectUrl(article.sourceLink, origin) : article.sourceLink,
  }
}
