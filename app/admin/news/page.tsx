import { redirect } from "next/navigation"

export default function AdminNewsPage() {
  // Redirect to new Newsletter page - keeping this for backwards compatibility
  redirect("/admin/newsletter")
}
