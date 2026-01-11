import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('❌ Usage: npx ts-node scripts/create-admin.ts <email> <password>')
    process.exit(1)
  }

  console.log('🔐 Creating admin user...')

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    console.log('⚠️  User already exists. Updating password...')
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })
    console.log('✅ Password updated successfully!')
  } else {
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin'
      }
    })
    console.log('✅ Admin user created successfully!')
  }

  console.log(`\n📧 Email: ${email}`)
  console.log('🔑 Password: [hidden for security]')
  console.log('\nYou can now log in to the admin console with these credentials.')
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
