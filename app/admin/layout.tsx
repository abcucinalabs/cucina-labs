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
    <div className="min-h-screen text-foreground">
      <div className="relative z-10 flex">
        <AdminSidebar />
        <main className="flex-1 ml-64">
          <AdminHeader email={session.user.email} />
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
