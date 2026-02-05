import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function AdminNewsPage() {
  // Keep legacy /admin/news URL working by sending users to current emails workspace.
  redirect("/admin/emails")
}
