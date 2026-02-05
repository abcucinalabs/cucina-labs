import { redirect } from "next/navigation"

export default function AdminNewsPage() {
  // Keep legacy /admin/news URL working by sending users to current emails workspace.
  redirect("/admin/emails")
}
