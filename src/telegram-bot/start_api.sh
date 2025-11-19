#!/bin/bash

# UmraGO Webhook API Startup Script
# This script helps you start the webhook API easily

set -e

echo "🌐 UmraGO Webhook API Starter"
echo "================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Creating .env from example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your actual values before starting the API!"
    echo "   Run: nano .env"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit and configure .env first..."
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check configuration
if [ "$TELEGRAM_BOT_TOKEN" = "YOUR_BOT_TOKEN_HERE" ] || [ "$SUPABASE_URL" = "YOUR_SUPABASE_URL_HERE" ]; then
    echo "❌ Error: Environment variables not configured!"
    echo "   Please edit .env file with your actual values"
    exit 1
fi

echo ""
echo "✅ Configuration looks good!"
echo ""
echo "🚀 Starting UmraGO Webhook API..."
echo "   API will be available at: http://localhost:${PORT:-5000}"
echo "   Press Ctrl+C to stop"
echo ""

# Start the API
python webhook_api.py
