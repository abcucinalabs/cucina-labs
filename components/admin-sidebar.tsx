"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Mail, Database, Settings, LogOut, Bookmark, ChevronsUpDown, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navGroups = [
  {
    label: "Newsletter",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Emails", href: "/admin/emails", icon: Mail },
      { name: "Subscribers", href: "/admin/subscribers", icon: Users },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Saved Content", href: "/admin/saved-content", icon: Bookmark },
      { name: "Content Sources", href: "/admin/content-sources", icon: Database },
    ],
  },
  {
    label: "Configuration",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
]

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const initials = email
    .split("@")[0]
    .split(/[._-]/)
    .map((s) => s[0]?.toUpperCase())
    .join("")
    .slice(0, 2)

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="p-0">
        <div className="flex h-12 items-center px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <span className="text-base group-data-[collapsible=icon]:hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
            cucina <span className="font-bold">labs</span>
          </span>
          <span className="text-base hidden group-data-[collapsible=icon]:inline" style={{ fontFamily: 'Arial, sans-serif' }}>
            c<span className="font-bold">l</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))

                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  className="focus:bg-[rgba(60,53,242,0.10)] focus:text-[#3c35f2]"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
