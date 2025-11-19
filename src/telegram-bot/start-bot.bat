@echo off
REM Change to script directory to ensure we're in the right folder
cd /d "%~dp0"

echo.
echo ========================================
echo   UmraGO Telegram Bot Starter
echo ========================================
echo.
echo Current directory: %CD%
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo.
    echo Please create .env file with:
    echo   TELEGRAM_BOT_TOKEN=your_token_here
    echo   SUPABASE_URL=your_url_here
    echo   SUPABASE_ANON_KEY=your_key_here
    echo   WEB_APP_URL=your_app_url
    echo.
    echo You can copy from .env.example if it exists
    echo.
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.8 or higher
    echo.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo [INFO] Installing dependencies...
echo.

REM Upgrade pip first
python -m pip install --upgrade pip --quiet
if errorlevel 1 (
    echo [WARNING] Failed to upgrade pip, continuing anyway...
)

REM Install dependencies one by one to avoid conflicts
echo [INFO] Installing python-dotenv...
pip install python-dotenv --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install python-dotenv
    echo Please run: pip install python-dotenv
    pause
    exit /b 1
)

echo [INFO] Installing requests...
pip install requests --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install requests
    pause
    exit /b 1
)

echo [INFO] Installing supabase...
pip install supabase --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install supabase
    pause
    exit /b 1
)

echo [INFO] Installing python-telegram-bot...
pip install python-telegram-bot --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install python-telegram-bot
    pause
    exit /b 1
)

echo [SUCCESS] All dependencies installed!

echo.
echo [SUCCESS] Dependencies installed!
echo.
echo ========================================
echo   Starting Bot...
echo ========================================
echo.
echo Bot is starting... You can now test it in Telegram!
echo.
echo To test:
echo   1. Open Telegram
echo   2. Find your bot (search for bot username)
echo   3. Send: /start
echo   4. Bot should reply with welcome message
echo.
echo Press Ctrl+C to stop the bot
echo.
echo ========================================
echo.

REM Check if bot file exists
if not exist umrago_bot.py (
    echo [ERROR] umrago_bot.py file not found!
    echo Current directory: %CD%
    echo Please make sure you're running this from the telegram-bot folder
    pause
    exit /b 1
)

REM Start the bot
echo Starting bot from: %CD%
python umrago_bot.py

if errorlevel 1 (
    echo.
    echo [ERROR] Bot failed to start!
    echo Check the error messages above
    echo.
    pause
    exit /b 1
)

pause

