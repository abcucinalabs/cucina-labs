import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"

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
    <div className="min-h-screen text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="relative z-10 flex">
        <AdminSidebar />
        <main className="flex-1 ml-0 lg:ml-64">
          <AdminHeader email={session.user.email} />
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-4 rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:hidden">
              Read-only mode is enabled on mobile. Use a desktop browser to make changes.
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
