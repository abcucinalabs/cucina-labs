import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function AdminUsersPage() {
  // Redirect to new Settings page Users tab - keeping this for backwards compatibility
  redirect("/admin/settings")
}
