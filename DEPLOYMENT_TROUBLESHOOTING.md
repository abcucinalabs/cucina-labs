# Deployment Troubleshooting Guide

## Admin Console Login Issues

If you're seeing "Server error - There is a problem with the server configuration", follow these steps:

### 1. Verify Environment Variables in Vercel

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**

```bash
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# NextAuth (CRITICAL)
NEXTAUTH_SECRET=your-random-secret-min-32-chars
NEXTAUTH_URL=https://your-app.vercel.app

# App Secrets
ENCRYPTION_KEY=your-32-char-hex-string
CRON_SECRET=your-random-secret

# Optional API Keys (needed for features)
GEMINI_API_KEY=your-key
AIRTABLE_API_KEY=your-key
AIRTABLE_BASE_ID=your-base
AIRTABLE_TABLE_ID=your-table
AIRTABLE_TABLE_NAME=your-table-name
RESEND_API_KEY=your-key
```

**Generate Secrets:**

```bash
# NEXTAUTH_SECRET (any length >= 32)
openssl rand -base64 32

# ENCRYPTION_KEY (exactly 32 hex chars)
openssl rand -hex 16

# CRON_SECRET (any random string)
openssl rand -base64 32
```

**After adding/updating variables:** Redeploy your app in Vercel!

### 2. Set Up Your Database

Make sure you're pointing to your Neon PostgreSQL database:

```bash
# Set your DATABASE_URL environment variable locally
export DATABASE_URL='your-neon-connection-string-from-vercel'

# Push the schema to your database
npx prisma db push

# Seed default data (RSS feeds, templates, etc.)
npm run db:seed
```

### 3. Create an Admin User

**You must create at least one admin user to log in:**

```bash
# Create an admin user (replace with your email and password)
npm run create-admin your-email@example.com your-secure-password
```

This script will:
- Hash your password securely
- Create a new user with admin role
- Or update the password if the user already exists

### 4. Check Vercel Logs

If you're still having issues:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on your latest deployment
3. Click "Runtime Logs" or "Functions" tab
4. Try to log in again and watch for errors

**Common errors:**

- **"PrismaClient initialization error"** → Check DATABASE_URL format
- **"Invalid secret"** → NEXTAUTH_SECRET is missing or incorrect
- **"Connection timeout"** → Neon database may be sleeping (cold start)
- **"No user found"** → You haven't created an admin user yet

### 5. Test Database Connection

You can test if Prisma can connect to your database:

```bash
# Make sure DATABASE_URL is set
export DATABASE_URL='your-neon-connection-string'

# Open Prisma Studio to browse your database
npm run db:studio
```

This will open a browser showing your database tables. If this works, your connection is good!

### 6. Verify Deployment

After making changes:

1. **If you changed environment variables in Vercel:** You MUST redeploy
   - Go to Deployments → Click "..." menu → Redeploy
2. **If you updated code:** Push to your git branch and Vercel will auto-deploy

## Quick Checklist

- [ ] DATABASE_URL is set in Vercel environment variables
- [ ] NEXTAUTH_SECRET is set in Vercel (min 32 characters)
- [ ] NEXTAUTH_URL matches your production URL
- [ ] ENCRYPTION_KEY is set (32 hex characters)
- [ ] Database schema is pushed (`npx prisma db push`)
- [ ] At least one admin user exists in the database
- [ ] Redeployed after adding/changing environment variables

## Still Having Issues?

1. Check Vercel Runtime Logs for specific error messages
2. Verify your Neon database is not sleeping (visit the Neon dashboard)
3. Make sure your DATABASE_URL includes `?sslmode=require` at the end
4. Try creating a fresh admin user with the `create-admin` script
5. Verify NEXTAUTH_URL exactly matches your Vercel deployment URL (no trailing slash)

## Testing Locally

To test the same production setup locally:

```bash
# Create a .env.local file with your production environment variables
cp .env.example .env.local

# Edit .env.local with your Neon DATABASE_URL and other secrets

# Run the development server
npm run dev

# Try logging in at http://localhost:3000/login
```

If it works locally but not in production, the issue is likely with your Vercel environment variables.
