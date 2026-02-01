import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: npx ts-node scripts/create-admin.ts <email> <password>')
    process.exit(1)
  }

  console.log('Creating admin user...')

  // Check if user already exists via profiles table
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    console.log('User already exists. Updating password...')
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      existingProfile.id,
      { password }
    )
    if (error) throw error
    console.log('Password updated successfully!')
  } else {
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
    if (authError) throw authError

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        role: 'admin',
      })
    if (profileError) throw profileError

    console.log('Admin user created successfully!')
  }

  console.log(`\nEmail: ${email}`)
  console.log('Password: [hidden for security]')
  console.log('\nYou can now log in to the admin console with these credentials.')
}

main().catch((e) => {
  console.error('Error creating admin user:', e)
  process.exit(1)
})
