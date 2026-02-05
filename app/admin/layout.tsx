import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { MobileReadonlyBanner } from "@/components/mobile-readonly-banner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <SidebarProvider className="admin-theme">
      <AdminSidebar email={session.user.email} />
      <SidebarInset>
        <AdminHeader email={session.user.email} />
        <div className="p-4 sm:p-6 lg:p-8">
          <MobileReadonlyBanner />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
