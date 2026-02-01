import { createSupabaseServerClient } from "./supabase-server"
import { getSupabaseAdmin } from "./supabase"

export async function getAuthSession() {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return null

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      role: (profile?.role as string) || "admin",
    },
  }
}
