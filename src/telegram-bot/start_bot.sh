#!/bin/bash

# UmraGO Telegram Bot Startup Script
# This script helps you start the bot easily

set -e

echo "🤖 UmraGO Telegram Bot Starter"
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
    echo "⚠️  IMPORTANT: Please edit .env file with your actual values before starting the bot!"
    echo "   Run: nano .env"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit and configure .env first..."
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if bot token is set
if [ "$TELEGRAM_BOT_TOKEN" = "YOUR_BOT_TOKEN_HERE" ]; then
    echo "❌ Error: TELEGRAM_BOT_TOKEN not configured!"
    echo "   Please edit .env file and set your bot token from @BotFather"
    exit 1
fi

# Check if Supabase URL is set
if [ "$SUPABASE_URL" = "YOUR_SUPABASE_URL_HERE" ]; then
    echo "❌ Error: SUPABASE_URL not configured!"
    echo "   Please edit .env file and set your Supabase URL"
    exit 1
fi

echo ""
echo "✅ Configuration looks good!"
echo ""
echo "🚀 Starting UmraGO Telegram Bot..."
echo "   Press Ctrl+C to stop"
echo ""

# Start the bot
python umrago_bot.py
