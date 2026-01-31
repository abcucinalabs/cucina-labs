"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Mail, Database, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const mobileNavigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Emails", href: "/admin/emails", icon: Mail },
  { name: "Content Sources", href: "/admin/content-sources", icon: Database },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminHeader({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--border-default)] bg-white/80 backdrop-blur-xl px-4">
      <SidebarTrigger className="-ml-1 hidden lg:flex" />
      <Separator orientation="vertical" className="mr-2 h-4 hidden lg:block" />

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
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-[var(--border-default)] bg-white"
              )}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          )
        })}
      </nav>

      <span className="ml-auto hidden sm:inline-flex text-sm text-[color:var(--text-secondary)] px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)]">
        {email}
      </span>
    </header>
  )
}
