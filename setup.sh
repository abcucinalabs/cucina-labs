#!/bin/bash

echo "🚀 Setting up Cucina Labs..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    
    # Generate secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-in-production-$(date +%s)")
    ENCRYPTION_KEY=$(openssl rand -hex 16 2>/dev/null || echo "change-this-key-in-production-$(date +%s)")
    CRON_SECRET=$(openssl rand -base64 24 2>/dev/null || echo "change-this-cron-secret-$(date +%s)")
    
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cucina_labs?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# External APIs (Optional - can be configured in admin console)
GEMINI_API_KEY=""
AIRTABLE_API_KEY=""
AIRTABLE_BASE_ID=""
RESEND_API_KEY=""

# Encryption
ENCRYPTION_KEY="$ENCRYPTION_KEY"

# Cron (for Vercel Cron jobs)
CRON_SECRET="$CRON_SECRET"
EOF
    
    echo "✅ .env file created with generated secrets"
    echo "⚠️  Please update DATABASE_URL with your PostgreSQL connection string"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies. Please run 'npm install' manually"
    exit 1
fi

echo ""
echo "🗄️  Setting up database..."
echo "Generating Prisma Client..."
npm run db:generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma Client generated"
else
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

echo ""
echo "📊 Pushing database schema..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Database schema pushed"
else
    echo "⚠️  Database push failed. Make sure PostgreSQL is running and DATABASE_URL is correct"
    echo "   You can run 'npm run db:push' manually after fixing the connection"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update DATABASE_URL in .env with your PostgreSQL connection string"
echo "2. Run 'npm run db:push' to create database tables"
echo "3. Create an admin user: node scripts/create-admin.js admin@example.com your-password"
echo "4. Start the dev server: npm run dev"
echo ""
echo "🌐 Then visit:"
echo "   - Landing page: http://localhost:3000"
echo "   - Admin login: http://localhost:3000/admin/login"

