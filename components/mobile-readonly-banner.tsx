"use client"

import { usePathname } from "next/navigation"

export function MobileReadonlyBanner() {
  const pathname = usePathname()

  // These routes are mobile-friendly, so hide the banner there
  const mobileFriendlyRoutes = ["/admin/dashboard", "/admin/saved-content"]
  if (mobileFriendlyRoutes.some((route) => pathname === route)) return null

  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 lg:hidden">
      Read-only mode is enabled on mobile. Use a desktop browser to make changes.
    </div>
  )
}
