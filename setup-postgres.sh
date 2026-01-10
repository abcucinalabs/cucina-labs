#!/bin/bash

echo "🐘 Setting up PostgreSQL for Cucina Labs..."
echo ""

# Check if PostgreSQL is already installed
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is already installed"
    psql --version
    echo ""
else
    echo "❌ PostgreSQL is not installed"
    echo ""
    echo "📦 Installation Options:"
    echo ""
    echo "Option 1: Install via Homebrew (Recommended for macOS)"
    echo "  1. Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "  2. Install PostgreSQL: brew install postgresql@15"
    echo "  3. Start PostgreSQL: brew services start postgresql@15"
    echo ""
    echo "Option 2: Use Postgres.app (GUI - Easiest)"
    echo "  1. Download from: https://postgresapp.com/"
    echo "  2. Install and open the app"
    echo "  3. Click 'Initialize' to create a new server"
    echo ""
    echo "Option 3: Use Docker"
    echo "  docker run --name cucina-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cucina_labs -p 5432:5432 -d postgres:15"
    echo ""
    read -p "Have you installed PostgreSQL? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please install PostgreSQL using one of the options above, then run this script again."
        exit 1
    fi
fi

# Check if PostgreSQL is running
echo "🔍 Checking if PostgreSQL is running..."
if pg_isready &> /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL is not running"
    echo ""
    echo "Start PostgreSQL:"
    echo "  - Homebrew: brew services start postgresql@15"
    echo "  - Postgres.app: Open the app"
    echo "  - Docker: docker start cucina-postgres"
    echo ""
    read -p "Have you started PostgreSQL? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please start PostgreSQL, then run this script again."
        exit 1
    fi
fi

# Get database connection details
echo ""
echo "📝 Database Configuration"
echo ""

# Try to detect current user
DB_USER=${USER:-postgres}
read -p "PostgreSQL username [$DB_USER]: " input_user
DB_USER=${input_user:-$DB_USER}

read -sp "PostgreSQL password (leave empty if no password): " DB_PASSWORD
echo ""

read -p "Database name [cucina_labs]: " input_db
DB_NAME=${input_db:-cucina_labs}

read -p "Host [localhost]: " input_host
DB_HOST=${input_host:-localhost}

read -p "Port [5432]: " input_port
DB_PORT=${input_port:-5432}

# Create database
echo ""
echo "🗄️  Creating database '$DB_NAME'..."
export PGPASSWORD="$DB_PASSWORD"

if [ -z "$DB_PASSWORD" ]; then
    # No password
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || {
        echo "⚠️  Database might already exist or there was an error"
        echo "   Trying to connect anyway..."
    }
else
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -W "$DB_NAME" 2>/dev/null || {
        echo "⚠️  Database might already exist or there was an error"
        echo "   Trying to connect anyway..."
    }
fi

# Build connection string
if [ -z "$DB_PASSWORD" ]; then
    DATABASE_URL="postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
else
    DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
fi

# Update .env file
echo ""
echo "📝 Updating .env file..."
if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup
    
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
    else
        # Add DATABASE_URL if it doesn't exist
        echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
    fi
    echo "✅ Updated DATABASE_URL in .env"
else
    echo "❌ .env file not found. Creating it..."
    cat > .env << EOF
DATABASE_URL="$DATABASE_URL"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
ENCRYPTION_KEY="$(openssl rand -hex 16)"
CRON_SECRET="$(openssl rand -base64 24)"
EOF
    echo "✅ Created .env file"
fi

# Test connection
echo ""
echo "🔌 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    echo "✅ Database connection successful!"
else
    echo "⚠️  Could not test connection automatically"
    echo "   Connection string: $DATABASE_URL"
    echo "   Please verify the connection manually"
fi

echo ""
echo "✨ PostgreSQL setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run db:push"
echo "2. Create admin user: node scripts/create-admin.js admin@example.com password"
echo "3. Start server: npm run dev"
echo ""

