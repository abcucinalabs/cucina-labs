#!/bin/bash

echo "🐘 Setting up PostgreSQL for Cucina Labs..."
echo ""

# Add Postgres.app to PATH if it exists
if [ -d "/Applications/Postgres.app" ]; then
    export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
    echo "✅ Found Postgres.app, added to PATH"
fi

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found"
    echo "Please make sure PostgreSQL is installed and running"
    exit 1
fi

echo "✅ PostgreSQL found: $(psql --version)"
echo ""

# Check if PostgreSQL is running
if pg_isready &> /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL is not running"
    echo "Please start Postgres.app and click 'Initialize' if you haven't already"
    echo ""
    read -p "Press Enter after starting PostgreSQL..."
    
    if ! pg_isready &> /dev/null; then
        echo "❌ PostgreSQL is still not running. Please start it and try again."
        exit 1
    fi
fi

# Get current user (Postgres.app default)
DB_USER=$(whoami)
echo ""
echo "📝 Database Configuration"
echo "Using default Postgres.app settings:"
echo "  Username: $DB_USER"
echo "  Password: (none)"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: cucina_labs"
echo ""

read -p "Press Enter to continue or Ctrl+C to cancel..."

# Create database
echo ""
echo "🗄️  Creating database 'cucina_labs'..."

if psql -h localhost -p 5432 -U "$DB_USER" -d postgres -c "CREATE DATABASE cucina_labs;" 2>/dev/null; then
    echo "✅ Database 'cucina_labs' created"
elif psql -h localhost -p 5432 -U "$DB_USER" -d postgres -c "\l" | grep -q cucina_labs; then
    echo "⚠️  Database 'cucina_labs' already exists (that's fine!)"
else
    echo "❌ Failed to create database. Trying alternative method..."
    createdb -h localhost -p 5432 -U "$DB_USER" cucina_labs 2>/dev/null || {
        echo "⚠️  Could not create database automatically"
        echo "   You may need to create it manually or it might already exist"
    }
fi

# Build connection string
DATABASE_URL="postgresql://$DB_USER@localhost:5432/cucina_labs?schema=public"

# Update .env file
echo ""
echo "📝 Updating .env file..."
if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup 2>/dev/null || true
    
    # Update DATABASE_URL
    if grep -q "^DATABASE_URL=" .env; then
        # Replace existing DATABASE_URL
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        else
            # Linux
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        fi
        echo "✅ Updated DATABASE_URL in .env"
    else
        # Add DATABASE_URL if it doesn't exist
        echo "" >> .env
        echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
        echo "✅ Added DATABASE_URL to .env"
    fi
else
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Test connection
echo ""
echo "🔌 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    echo "✅ Database connection successful!"
else
    echo "⚠️  Could not test connection automatically"
    echo "   Connection string: $DATABASE_URL"
    echo "   Please verify manually with: psql \"$DATABASE_URL\""
fi

echo ""
echo "✨ PostgreSQL setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run db:push"
echo "2. Create admin user: node scripts/create-admin.js admin@example.com password"
echo "3. Start server: npm run dev"
echo ""

