@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   Switching to Clean Bot Version
echo ========================================
echo.

REM Backup old version
if exist umrago_bot.py (
    echo [INFO] Backing up old version...
    copy umrago_bot.py umrago_bot_backup.py
    echo [SUCCESS] Old version backed up as umrago_bot_backup.py
)

REM Replace with clean version
if exist umrago_bot_clean.py (
    echo [INFO] Installing clean version...
    copy /Y umrago_bot_clean.py umrago_bot.py
    echo [SUCCESS] Clean version installed!
) else (
    echo [ERROR] umrago_bot_clean.py not found!
    pause
    exit /b 1
)

REM Install clean dependencies
echo.
echo [INFO] Installing clean dependencies...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

pip uninstall -y python-telegram-bot supabase python-dotenv httpx requests 2>nul
pip install -r requirements-clean.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Clean Version Installed!
echo ========================================
echo.
echo Now you can run: python umrago_bot.py
echo.
pause

