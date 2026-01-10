const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password>');
    process.exit(1);
  }
  
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existing) {
      console.error('User already exists with this email');
      process.exit(1);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin',
      },
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('\nYou can now log in at http://localhost:3000/admin/login');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

