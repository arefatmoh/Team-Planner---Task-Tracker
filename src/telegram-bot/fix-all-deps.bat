@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   Fixing All Dependencies
echo ========================================
echo.

REM Activate virtual environment
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo [ERROR] Virtual environment not found!
    echo Please run start-bot.bat first
    pause
    exit /b 1
)

echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo [INFO] Fixing all dependencies with exact versions...
echo.

echo [1/5] Installing python-dotenv...
pip uninstall python-dotenv -y
pip install python-dotenv

echo.
echo [2/5] Installing requests...
pip uninstall requests -y
pip install requests

echo.
echo [3/5] Installing httpx (compatible version)...
pip uninstall httpx -y
pip install httpx==0.27.0

echo.
echo [4/5] Installing supabase (compatible version)...
pip uninstall supabase -y
pip install supabase==2.3.0

echo.
echo [5/5] Installing python-telegram-bot...
pip uninstall python-telegram-bot -y
pip install python-telegram-bot==20.7

echo.
echo ========================================
echo   ✅ All dependencies fixed!
echo ========================================
echo.
echo Verifying installation...
pip list | findstr /i "supabase httpx python-telegram-bot"
echo.
echo Now try running: python umrago_bot.py
echo.
pause

