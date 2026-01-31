"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Mail, Database, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const mobileNavigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { name: "Data", href: "/admin/data", icon: Database },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminHeader({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <nav className="flex items-center gap-1 lg:hidden">
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
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto">
          <span className="hidden sm:inline-flex text-sm text-muted-foreground px-3 py-1.5 rounded-md bg-muted">
            {email}
          </span>
        </div>
      </div>
    </header>
  )
}
