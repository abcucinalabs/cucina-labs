"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Mail, Database, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Emails", href: "/admin/emails", icon: Mail },
  { name: "Data Ingestion", href: "/admin/data", icon: Database },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminHeader({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <header className="h-16 border-b border-[var(--border-default)] bg-white/80 backdrop-blur-xl">
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-3 lg:hidden">
          <span className="text-sm font-semibold text-foreground">
            cucina <span className="font-bold">labs</span>
          </span>
        </div>

        <nav className="flex items-center gap-2 lg:hidden">
          {mobileNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-[color:var(--text-secondary)] transition-colors",
                  isActive
                    ? "border-[rgba(155,242,202,0.8)] bg-[var(--accent-primary-light)] text-[#0d0d0d]"
                    : "border-[var(--border-default)] bg-white"
                )}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            )
          })}
        </nav>

        <span className="hidden sm:inline-flex text-sm text-[color:var(--text-secondary)] px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)]">
          {email}
        </span>
      </div>
    </header>
  )
}
