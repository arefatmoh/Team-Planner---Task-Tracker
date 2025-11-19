@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   Fixing python-telegram-bot Version
echo ========================================
echo.

REM Activate virtual environment
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo [ERROR] Virtual environment not found!
    echo Please run start-bot.bat first to create venv
    pause
    exit /b 1
)

echo [INFO] Uninstalling current python-telegram-bot...
pip uninstall python-telegram-bot -y

echo.
echo [INFO] Installing python-telegram-bot version 20.7...
pip install python-telegram-bot==20.7

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install python-telegram-bot==20.7
    echo Trying latest version...
    pip install python-telegram-bot
)

echo.
echo ========================================
echo   ✅ Version fixed!
echo ========================================
echo.
echo Now try running: python umrago_bot.py
echo.
pause

