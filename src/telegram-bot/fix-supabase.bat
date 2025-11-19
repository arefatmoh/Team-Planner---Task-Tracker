@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   Fixing Supabase Dependencies
echo ========================================
echo.

REM Activate virtual environment
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo [ERROR] Virtual environment not found!
    pause
    exit /b 1
)

echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo [INFO] Fixing httpx version conflict...
pip uninstall httpx -y
pip install "httpx>=0.26,<0.29"

echo.
echo [INFO] Reinstalling supabase with correct dependencies...
pip uninstall supabase -y
pip install supabase

echo.
echo [INFO] Verifying installation...
pip show supabase
pip show httpx

echo.
echo ========================================
echo   ✅ Dependencies fixed!
echo ========================================
echo.
echo Now try running: python umrago_bot.py
echo.
pause

