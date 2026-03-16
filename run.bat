@echo off
title ClinicalRounds
color 0B
cd /d "%~dp0"

echo.
echo ============================================
echo   ClinicalRounds - Starting...
echo ============================================
echo.

REM --- Quick checks ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Run setup.bat first.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  Dependencies not installed. Run setup.bat first.
    echo.
    pause
    exit /b 1
)

if not exist ".env.local" (
    echo  WARNING: .env.local not found. Run setup.bat first.
    echo.
    pause
    exit /b 1
)

REM --- Check API key ---
findstr /C:"your-api-key-here" ".env.local" >nul 2>nul
if %errorlevel% equ 0 (
    echo  WARNING: API key not configured in .env.local
    echo  Edit .env.local and add your Anthropic API key.
    echo.
    pause
    exit /b 1
)

echo  Starting the development server...
echo  The app will open in your browser shortly.
echo.
echo  Press Ctrl+C in this window to stop the server.
echo.

REM --- Open browser after a short delay ---
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"

REM --- Start the dev server ---
call npm run dev
