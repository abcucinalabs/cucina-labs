import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <SidebarProvider className="admin-theme">
      <AdminSidebar email={session.user.email} />
      <SidebarInset>
        <AdminHeader email={session.user.email} />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-4 rounded-[var(--radius-lg)] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 lg:hidden">
            Read-only mode is enabled on mobile. Use a desktop browser to make changes.
          </div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
