# Quick Start - Automated Setup

I've created an automated setup script for you! Here's how to use it:

## Option 1: Run the Setup Script (Easiest)

```bash
./setup.sh
```

This script will:
- ✅ Create `.env` file with auto-generated secrets
- ✅ Install all npm dependencies
- ✅ Generate Prisma Client
- ✅ Push database schema (if PostgreSQL is configured)

## Option 2: Manual Setup

If the script doesn't work, follow these steps:

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env File
Copy `.env.example` and update with your values:

```bash
cp .env.example .env
```

### 3. Set Up Database
```bash
npm run db:generate
npm run db:push
```

### 4. Create Admin User
```bash
node scripts/create-admin.js admin@example.com your-password
```

### 5. Start Server
```bash
npm run dev
```

## What You Need

1. **PostgreSQL Database** - Either:
   - Local: Install PostgreSQL and create a database
   - Cloud: Use [Vercel Postgres](https://vercel.com/storage/postgres), [Supabase](https://supabase.com), or [Railway](https://railway.app)

2. **API Keys** (can add later in admin console):
   - Gemini API: https://makersuite.google.com/app/apikey
   - Resend API: https://resend.com/api-keys

## After Setup

1. Visit http://localhost:3000/admin/login
2. Log in with your admin credentials
3. Go to **News > Integrations** to add API keys
4. Go to **News > Ingestion** to add RSS sources
5. Create your first newsletter sequence!

## Need Help?

Check `SETUP.md` for detailed instructions and troubleshooting.
