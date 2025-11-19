#!/bin/bash

# OIDFED Auth Gateway Setup Script

set -e

echo "🚀 Setting up OIDFED Auth Gateway..."

# Check Python version
echo "✓ Checking Python version..."
python3 --version || { echo "❌ Python 3.11+ required"; exit 1; }

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "✓ Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "✓ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "✓ Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
if [ ! -f ".env" ]; then
    echo "✓ Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

# Generate JWT keys
echo "✓ Generating JWT keys..."
python src/config/keys/generate_keys.py

# Check if PostgreSQL is running
echo "✓ Checking database..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL not running. Start with:"
    echo "   docker-compose up -d postgres"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Start database: docker-compose up -d postgres"
echo "3. Run server: uvicorn src.main:app --reload --port 9000"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up"
echo ""
echo "Documentation: http://localhost:9000/docs"
