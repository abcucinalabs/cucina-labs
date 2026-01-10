# Cucina Labs - Newsletter Application

A full-stack newsletter application for AI product content curation and distribution.

## Features

- **Public Landing Page**: Email signup with glassmorphism design
- **Admin Console**: Secure admin interface for managing the newsletter
- **RSS Ingestion**: Automated content ingestion from RSS feeds
- **AI Curation**: Gemini API integration for intelligent article selection
- **Newsletter Distribution**: Automated email sending via Resend
- **User Management**: Admin user management system

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials + JWT)
- **Email**: Resend SDK
- **LLM**: Google Gemini API
- **RSS Parsing**: rss-parser

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- API keys for:
  - Google Gemini
  - Resend (optional)
  - Airtable (optional)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env` and fill in your values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cucina_labs?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# External APIs
GEMINI_API_KEY=""
AIRTABLE_API_KEY=""
AIRTABLE_BASE_ID=""
AIRTABLE_TABLE_ID=""
AIRTABLE_TABLE_NAME=""
RESEND_API_KEY=""

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Cron (for Vercel Cron)
CRON_SECRET="your-cron-secret"
```

Note: Never commit secrets. Keep real values in `.env` and only commit `.env.example`.

3. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

4. Create an admin user:

You can create an admin user via the admin console after first deployment, or use Prisma Studio:

```bash
npx prisma studio
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Git Secrets Guard (Recommended)

Enable the pre-commit hook to prevent committing secret files:

```bash
git config core.hooksPath .githooks
```

## Project Structure

```
├── app/
│   ├── admin/          # Admin console pages
│   ├── api/            # API routes
│   ├── unsubscribe/   # Unsubscribe page
│   └── page.tsx        # Landing page
├── components/
│   ├── tabs/           # Admin tab components
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── auth.ts         # NextAuth configuration
│   ├── db.ts           # Prisma client
│   ├── encryption.ts   # API key encryption
│   ├── ingestion.ts    # RSS ingestion workflow
│   └── distribution.ts # Newsletter distribution workflow
└── prisma/
    └── schema.prisma   # Database schema
```

## Admin Console

Access the admin console at `/admin/login`. The console includes:

1. **Integrations**: Manage API keys for Gemini, Airtable, and Resend
2. **Ingestion**: Configure RSS sources and ingestion schedule
3. **Sequences**: Create and manage newsletter sequences
4. **Settings**: Configure welcome emails
5. **Users**: Manage admin users

## Cron Jobs

For production, set up cron jobs to run:

1. **Ingestion**: `/api/cron/ingestion` - Runs RSS ingestion
2. **Distribution**: `/api/cron/distribution` - Sends newsletters

### Vercel Cron

If deploying to Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingestion",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/distribution",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Security Features

- Password hashing with bcrypt
- JWT tokens with httpOnly cookies
- Encrypted API key storage
- CSRF protection
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS prevention (React auto-escaping)

## License

MIT
