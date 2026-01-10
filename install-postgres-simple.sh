#!/bin/bash

echo "🐘 PostgreSQL Installation Helper"
echo ""
echo "Choose your installation method:"
echo ""
echo "1. Postgres.app (Easiest - GUI, no terminal needed)"
echo "2. Homebrew (Terminal-based)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "📥 Installing Postgres.app..."
        echo ""
        echo "Steps:"
        echo "1. Opening https://postgresapp.com/downloads/ in your browser"
        echo "2. Download the .dmg file"
        echo "3. Open it and drag Postgres.app to Applications"
        echo "4. Open Postgres.app and click 'Initialize'"
        echo ""
        open "https://postgresapp.com/downloads/"
        echo "✅ Browser opened. After installing Postgres.app, run: ./setup-postgres.sh"
        ;;
    2)
        echo ""
        echo "📦 Installing via Homebrew..."
        echo ""
        if ! command -v brew &> /dev/null; then
            echo "Homebrew not found. Installing Homebrew first..."
            echo "You'll be asked for your password."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        echo "Installing PostgreSQL..."
        brew install postgresql@15
        
        echo "Starting PostgreSQL..."
        brew services start postgresql@15
        
        echo ""
        echo "✅ PostgreSQL installed and started!"
        echo "Now run: ./setup-postgres.sh"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
