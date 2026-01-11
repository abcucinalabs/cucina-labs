"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Newspaper, Users, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "News",
    href: "/admin",
    icon: Newspaper,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
      <div className="flex h-full flex-col">
        {/* Logo area */}
        <div className="flex h-16 items-center border-b border-[var(--border-default)] px-6">
          <span className="text-lg text-foreground">
            cucina <span className="font-bold">labs</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--accent-primary-light)] text-[#0D0D0D] border border-[rgba(155,242,202,0.8)]"
                    : "text-[color:var(--text-secondary)] hover:text-foreground hover:bg-[var(--bg-muted)]"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-[var(--border-default)] p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full rounded-[var(--radius-lg)] px-4 py-3 text-sm font-medium text-[color:var(--text-secondary)] hover:text-foreground hover:bg-[var(--bg-muted)] transition-all"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
