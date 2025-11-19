@echo off
REM Simple dependency installer that installs packages one by one
cd /d "%~dp0"

echo.
echo ========================================
echo   Installing Bot Dependencies
echo ========================================
echo.

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo [INFO] Installing dependencies one by one...
echo.

echo [1/4] Installing python-dotenv...
pip install python-dotenv
if errorlevel 1 (
    echo [ERROR] Failed to install python-dotenv
    pause
    exit /b 1
)

echo.
echo [2/4] Installing requests...
pip install requests
if errorlevel 1 (
    echo [ERROR] Failed to install requests
    pause
    exit /b 1
)

echo.
echo [3/4] Installing supabase...
pip install supabase
if errorlevel 1 (
    echo [ERROR] Failed to install supabase
    pause
    exit /b 1
)

echo.
echo [4/4] Installing python-telegram-bot...
pip install python-telegram-bot
if errorlevel 1 (
    echo [ERROR] Failed to install python-telegram-bot
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ All dependencies installed!
echo ========================================
echo.
pause

