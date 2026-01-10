# Setup Guide - Cucina Labs

Follow these steps to get your newsletter application up and running.

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Prisma, NextAuth, and UI components.

## Step 2: Set Up Environment Variables

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Open `.env` and fill in the following values:

### Required Variables

```env
# Database - PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/cucina_labs?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here-min-32-chars"

# Encryption Key (32 characters minimum)
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Cron Secret (for Vercel Cron jobs)
CRON_SECRET="your-cron-secret-here"
```

### Optional Variables (for full functionality)

```env
# External APIs (configure these in admin console later)
GEMINI_API_KEY=""
AIRTABLE_API_KEY=""
AIRTABLE_BASE_ID=""
RESEND_API_KEY=""
```

### Generate Secrets

You can generate secure secrets using:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY (32 characters)
openssl rand -hex 16

# Generate CRON_SECRET
openssl rand -base64 24
```

## Step 3: Set Up PostgreSQL Database

### Option A: Local PostgreSQL

1. Install PostgreSQL if not already installed
2. Create a database:

```sql
CREATE DATABASE cucina_labs;
```

3. Update `DATABASE_URL` in `.env` with your credentials

### Option B: Cloud Database (Recommended for Production)

- **Vercel Postgres**: Free tier available, integrates seamlessly
- **Supabase**: Free PostgreSQL with great developer experience
- **Railway**: Easy PostgreSQL hosting
- **Neon**: Serverless PostgreSQL

## Step 4: Initialize Database Schema

Run Prisma commands to set up your database:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push
```

This will create all the necessary tables:
- User (admin users)
- ApiKey (encrypted API keys)
- RssSource (RSS feed sources)
- Article (ingested articles)
- Sequence (newsletter sequences)
- Subscriber (email subscribers)
- EmailTemplate (email templates)

## Step 5: Create Your First Admin User

You have two options:

### Option A: Using Prisma Studio (Recommended)

```bash
npm run db:studio
```

1. Open the Prisma Studio interface (usually http://localhost:5555)
2. Click on the `User` model
3. Click "Add record"
4. Fill in:
   - `email`: your admin email
   - `password`: **IMPORTANT** - You need to hash this first!
   - `role`: "admin"

**To hash the password**, use Node.js:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(h => console.log(h))"
```

Copy the hashed password and paste it into Prisma Studio.

### Option B: Create via API Script

Create a file `scripts/create-admin.js`:

```javascript
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
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'admin',
    },
  });
  
  console.log('Admin user created:', user.email);
  await prisma.$disconnect();
}

createAdmin();
```

Then run:

```bash
node scripts/create-admin.js admin@example.com your-password
```

## Step 6: Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Landing Page**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login

## Step 7: Log In to Admin Console

1. Go to http://localhost:3000/admin/login
2. Enter your admin email and password
3. You should be redirected to the admin dashboard

## Step 8: Configure API Integrations

In the admin console, go to **News > Integrations** tab:

1. **Gemini API**: Add your Google Gemini API key
   - Get it from: https://makersuite.google.com/app/apikey
   - Click the [+] button next to Gemini API
   - Paste your API key
   - Click "Test Connection" to verify

2. **Resend API** (Optional but recommended):
   - Get it from: https://resend.com/api-keys
   - Add your API key
   - Test the connection

3. **Airtable API** (Optional):
   - If you want to use Airtable instead of PostgreSQL
   - Get it from: https://airtable.com/api
   - Add your API key and Base ID

## Step 9: Add RSS Sources

1. Go to **News > Ingestion** tab
2. Click "Add RSS Source"
3. Add RSS feeds you want to ingest from:
   - Name: e.g., "TechCrunch AI"
   - URL: e.g., "https://techcrunch.com/feed/"
4. Toggle the switch to enable/disable sources

## Step 10: Test Ingestion

1. In the **Ingestion** tab, click "Run Test Ingestion"
2. This will:
   - Fetch articles from enabled RSS sources
   - Filter by time frame
   - Use Gemini to select relevant articles
   - Save to database

## Step 11: Create a Newsletter Sequence

1. Go to **News > Sequences** tab
2. Click "Create New Sequence"
3. Follow the 6-step wizard:
   - **Step 1**: Name and select Resend audience
   - **Step 2**: Choose days and time
   - **Step 3**: Configure AI prompts
   - **Step 4**: Generate and preview newsletter
   - **Step 5**: Send test email
   - **Step 6**: Publish sequence

## Step 12: Test the Landing Page

1. Go to http://localhost:3000
2. Enter an email address
3. Click "Sign Up"
4. Check that the subscription is saved

## Step 13: Configure Welcome Email (Optional)

1. Go to **News > Subscription Settings** tab
2. Toggle "Enable Welcome Email"
3. Add HTML content for the welcome email
4. Click "Save Changes"

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` format is correct
- Ensure database exists: `psql -l` to list databases

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your dev server URL
- Clear browser cookies and try again

### API Key Issues

- Ensure API keys are valid
- Check encryption key is set correctly
- Test connections in the Integrations tab

### Build Errors

- Run `npm run db:generate` if Prisma errors occur
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Next Steps for Production

1. **Deploy to Vercel**:
   - Connect your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

2. **Set Up Cron Jobs**:
   - Vercel Cron is configured in `vercel.json`
   - Add `CRON_SECRET` to environment variables
   - Cron jobs will run automatically

3. **Configure Domain**:
   - Add your custom domain in Vercel
   - Update `NEXTAUTH_URL` to your domain

4. **Set Up Monitoring**:
   - Add error tracking (Sentry)
   - Monitor cron job execution
   - Set up email alerts

## Need Help?

- Check the README.md for more details
- Review the code comments in key files
- Test individual API endpoints using the admin console

Happy building! 🚀

