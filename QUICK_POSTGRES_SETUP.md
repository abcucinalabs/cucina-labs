# ⚡ Quick PostgreSQL Setup

## 🎯 Easiest Method: Postgres.app (5 minutes)

I've opened the download page for you! If it didn't open, visit: https://postgresapp.com/downloads/

### Steps:

1. **Download** the `.dmg` file from the website
2. **Install**: 
   - Open the downloaded `.dmg`
   - Drag `Postgres.app` to your Applications folder
3. **Launch**: Open Postgres.app from Applications
4. **Initialize**: Click the "Initialize" button
5. **Done!** ✅

### Then run:

```bash
./setup-postgres.sh
```

This will automatically:
- Create the `cucina_labs` database
- Update your `.env` file
- Test the connection

---

## 📋 What Happens Next

After running `./setup-postgres.sh`:

1. **Push database schema**:
   ```bash
   npm run db:push
   ```

2. **Create admin user**:
   ```bash
   node scripts/create-admin.js admin@example.com your-password
   ```

3. **Start server**:
   ```bash
   npm run dev
   ```

4. **Login**: http://localhost:3000/admin/login

---

## 🔍 Verify Installation

After installing Postgres.app, check if it's running:

```bash
pg_isready
```

Should output: `localhost:5432 - accepting connections`

---

## ❓ Troubleshooting

**"pg_isready: command not found"**
- Add Postgres.app to your PATH:
  ```bash
  sudo mkdir -p /etc/paths.d &&
  echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
  ```
- Restart Terminal

**"Connection refused"**
- Make sure Postgres.app is running (check the menu bar)
- Click "Initialize" if you haven't already

**Default username**
- Check your macOS username: `whoami`
- Use that as the PostgreSQL username (usually no password needed)

---

## 🚀 Alternative: Homebrew

If you prefer command-line:

```bash
# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@15

# Start it
brew services start postgresql@15

# Run setup
./setup-postgres.sh
```

---

**Need help?** Check `POSTGRES_SETUP.md` for detailed instructions.

