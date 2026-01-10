# PostgreSQL Setup Guide

## Quick Setup Options

### Option 1: Postgres.app (Easiest - Recommended) ⭐

1. **Download Postgres.app**: https://postgresapp.com/
2. **Install**: Drag to Applications folder
3. **Open**: Launch Postgres.app
4. **Initialize**: Click "Initialize" to create a new server
5. **Done!** PostgreSQL is now running

Then run:
```bash
./setup-postgres.sh
```

### Option 2: Homebrew

1. **Install Homebrew** (if not installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. **Install PostgreSQL**:
```bash
brew install postgresql@15
```

3. **Start PostgreSQL**:
```bash
brew services start postgresql@15
```

4. **Run setup script**:
```bash
./setup-postgres.sh
```

### Option 3: Docker

1. **Run PostgreSQL container**:
```bash
docker run --name cucina-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cucina_labs \
  -p 5432:5432 \
  -d postgres:15
```

2. **Update .env** with:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cucina_labs?schema=public"
```

3. **Run database setup**:
```bash
npm run db:push
```

## Automated Setup

After installing PostgreSQL using any method above, run:

```bash
./setup-postgres.sh
```

This script will:
- ✅ Check if PostgreSQL is installed and running
- ✅ Create the `cucina_labs` database
- ✅ Update your `.env` file with the connection string
- ✅ Test the connection

## Manual Setup

If you prefer to set up manually:

### 1. Create Database

```bash
# With password
createdb -U postgres cucina_labs

# Without password (if configured)
createdb cucina_labs
```

### 2. Update .env File

Update `DATABASE_URL` in `.env`:

```env
# With password
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/cucina_labs?schema=public"

# Without password
DATABASE_URL="postgresql://postgres@localhost:5432/cucina_labs?schema=public"
```

### 3. Push Schema

```bash
npm run db:push
```

## Verify Installation

Check if PostgreSQL is running:
```bash
pg_isready
```

Connect to database:
```bash
psql -d cucina_labs
```

## Troubleshooting

### "psql: command not found"
- PostgreSQL is not installed or not in PATH
- Install using one of the methods above

### "Connection refused"
- PostgreSQL service is not running
- Start it: `brew services start postgresql@15` or open Postgres.app

### "Password authentication failed"
- Check your password in the connection string
- Default Postgres.app user is your macOS username (no password)
- Default Docker user is `postgres` with password `postgres`

### "Database already exists"
- That's fine! The database is ready to use
- Just run `npm run db:push` to create tables

## Next Steps

After PostgreSQL is set up:

1. ✅ Run `npm run db:push` to create tables
2. ✅ Create admin user: `node scripts/create-admin.js admin@example.com password`
3. ✅ Start server: `npm run dev`
4. ✅ Visit http://localhost:3000/admin/login

