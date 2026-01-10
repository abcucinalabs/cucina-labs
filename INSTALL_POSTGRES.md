# Install PostgreSQL - Step by Step

Since automated installation requires your password, here are the easiest options:

## 🎯 Recommended: Postgres.app (No Terminal Required!)

**This is the easiest way - just download and run!**

1. **Download**: Go to https://postgresapp.com/downloads/
2. **Install**: 
   - Download the `.dmg` file
   - Open it and drag Postgres.app to your Applications folder
3. **Launch**: Open Postgres.app from Applications
4. **Initialize**: Click the "Initialize" button to create a new server
5. **Done!** PostgreSQL is now running on port 5432

**Default settings:**
- Username: Your macOS username (check in Terminal with `whoami`)
- Password: None (empty)
- Port: 5432
- Database: You'll create `cucina_labs` next

**Then run:**
```bash
./setup-postgres.sh
```

---

## Alternative: Homebrew (Terminal Method)

If you prefer using Homebrew:

### Step 1: Install Homebrew

Open Terminal and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

You'll be prompted for your password. This is safe - Homebrew is the standard package manager for macOS.

### Step 2: Install PostgreSQL

```bash
brew install postgresql@15
```

### Step 3: Start PostgreSQL

```bash
brew services start postgresql@15
```

### Step 4: Run Setup Script

```bash
./setup-postgres.sh
```

---

## After Installation

Once PostgreSQL is installed and running (using either method above):

### 1. Run the setup script:
```bash
./setup-postgres.sh
```

This will:
- Create the `cucina_labs` database
- Update your `.env` file
- Test the connection

### 2. Push database schema:
```bash
npm run db:push
```

### 3. Create admin user:
```bash
node scripts/create-admin.js admin@example.com your-password
```

### 4. Start the server:
```bash
npm run dev
```

---

## Quick Check Commands

Check if PostgreSQL is running:
```bash
pg_isready
```

Check PostgreSQL version:
```bash
psql --version
```

List databases:
```bash
psql -l
```

---

## Which Method Should I Use?

- **Postgres.app**: If you want the easiest, GUI-based setup (recommended)
- **Homebrew**: If you're comfortable with Terminal and want command-line control

Both work perfectly! Choose what feels more comfortable.

