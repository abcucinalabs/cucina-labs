import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    const supabaseAdmin = getSupabaseAdmin()

    // Update auth user
    const authUpdate: any = {}
    if (data.email) authUpdate.email = data.email
    if (data.password) authUpdate.password = data.password

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(params.id, authUpdate)
      if (authError) throw authError
    }

    // Update profile if email changed
    if (data.email) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ email: data.email })
        .eq("id", params.id)
      if (profileError) throw profileError
    }

    // Fetch updated profile
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      createdAt: profile.created_at,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prevent deleting yourself
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Delete profile first (FK constraint)
    await supabaseAdmin.from("profiles").delete().eq("id", params.id)

    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
