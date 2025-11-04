#!/bin/bash

echo "🚀 SmartPark Backend Setup Script"
echo "=================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql"
    echo "  Fedora: sudo dnf install postgresql postgresql-server"
    echo ""
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please edit .env and set your PostgreSQL credentials!"
    echo ""
else
    echo "✅ .env file already exists"
fi

echo "📦 Installing npm dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Make sure PostgreSQL is running:"
echo "   sudo service postgresql start    (Linux)"
echo "   brew services start postgresql   (macOS)"
echo ""
echo "2. Create the database:"
echo "   psql -U postgres -c 'CREATE DATABASE smartpark;'"
echo ""
echo "3. Run the database schema and seed:"
echo "   psql -U postgres -d smartpark -f database/schema.sql"
echo "   psql -U postgres -d smartpark -f database/seed.sql"
echo ""
echo "4. Start the server:"
echo "   npm run dev"
echo ""
echo "5. Start the sensor simulator (in another terminal):"
echo "   npm run simulator"
echo ""
echo "🔍 API will be available at: http://localhost:3001"
echo "💚 Health check: http://localhost:3001/health"
echo ""
