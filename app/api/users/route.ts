import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch users directly from Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (authError) throw authError

    // Get profiles to merge role info
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, role")

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.id, p.role])
    )

    // Sync any missing profiles
    const authUsers = authData?.users || []
    for (const authUser of authUsers) {
      if (!profileMap.has(authUser.id)) {
        // Create missing profile
        await supabaseAdmin.from("profiles").insert({
          id: authUser.id,
          email: authUser.email,
          role: "admin",
        }).select().single()
        profileMap.set(authUser.id, "admin")
      }
    }

    const users = authUsers.map((u: any) => ({
      id: u.id,
      email: u.email,
      role: profileMap.get(u.id) || "admin",
      createdAt: u.created_at,
    }))

    return NextResponse.json(users)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, password } = createUserSchema.parse(body)

    const supabaseAdmin = getSupabaseAdmin()

    // Create auth user via Supabase Admin API
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        )
      }
      throw authError
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        email,
        role: "admin",
      })

    if (profileError) throw profileError

    return NextResponse.json(
      {
        id: authData.user.id,
        email,
        role: "admin",
        createdAt: authData.user.created_at,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}
