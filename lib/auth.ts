import { createSupabaseServerClient } from "./supabase-server"
import { getSupabaseAdmin } from "./supabase"

export async function getAuthSession() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email!,
      role: (profile?.role as string) || "admin",
    },
  }
}
