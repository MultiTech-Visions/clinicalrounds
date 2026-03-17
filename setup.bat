@echo off
title ClinicalRounds - Setup
color 0B
echo.
echo ============================================
echo   ClinicalRounds - First-Time Setup
echo ============================================
echo.

REM --- Check for Node.js ---
echo [1/4] Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js is not installed or not in PATH.
    echo.
    echo  Please install Node.js v20 or later from:
    echo    https://nodejs.org/
    echo.
    echo  After installing, close this window and run setup.bat again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo   Found Node.js %NODE_VER%
echo.

REM --- Check for npm ---
echo [2/4] Checking for npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm is not available. It should come with Node.js.
    echo  Please reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
echo   Found npm v%NPM_VER%
echo.

REM --- Install dependencies ---
echo [3/4] Installing dependencies (this may take a minute)...
echo.
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm install failed. Check the output above for details.
    echo.
    pause
    exit /b 1
)
echo.
echo   Dependencies installed successfully.
echo.

REM --- Set up .env.local ---
echo [4/4] Setting up environment configuration...

if exist ".env.local" (
    echo   .env.local already exists - skipping.
    echo.
) else (
    copy ".env.example" ".env.local" >nul 2>nul
    if not exist ".env.local" (
        echo ANTHROPIC_API_KEY=your-api-key-here> ".env.local"
    )
    echo   Created .env.local from template.
    echo.
)

REM --- Check if API key is configured ---
findstr /C:"your-api-key-here" ".env.local" >nul 2>nul
if %errorlevel% equ 0 (
    echo ============================================
    echo   IMPORTANT: Set your Anthropic API key!
    echo ============================================
    echo.
    echo   Open the file .env.local in a text editor
    echo   and replace "your-api-key-here" with your
    echo   actual API key from:
    echo.
    echo     https://console.anthropic.com/
    echo.
    echo   The app will not work without a valid key.
    echo.

    setlocal enabledelayedexpansion
    set /p APIKEY="  Paste your Anthropic API key now (or press Enter to skip): "
    if not "!APIKEY!"=="" (
        echo ANTHROPIC_API_KEY=!APIKEY!> ".env.local"
        echo OPENAI_API_KEY=your-openai-key-here>> ".env.local"
        echo.
        echo   Anthropic API key saved to .env.local
    ) else (
        echo.
        echo   Skipped. Remember to edit .env.local before running the app.
    )
    endlocal
    echo.
)

REM --- Optional: OpenAI key for Voice Council ---
findstr /C:"your-openai-key-here" ".env.local" >nul 2>nul
if %errorlevel% equ 0 (
    echo ============================================
    echo   OPTIONAL: OpenAI API key (Voice Council)
    echo ============================================
    echo.
    echo   The Voice Council feature uses OpenAI's
    echo   Realtime API for live voice conversations.
    echo   Get a key at: https://platform.openai.com/api-keys
    echo.

    setlocal enabledelayedexpansion
    set /p OAIKEY="  Paste your OpenAI API key now (or press Enter to skip): "
    if not "!OAIKEY!"=="" (
        REM Replace the placeholder in .env.local
        powershell -Command "(Get-Content '.env.local') -replace 'your-openai-key-here', '!OAIKEY!' | Set-Content '.env.local'"
        echo.
        echo   OpenAI API key saved to .env.local
    ) else (
        echo.
        echo   Skipped. Voice Council won't work without it.
    )
    endlocal
    echo.
)

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo   To start ClinicalRounds, double-click:
echo     run.bat
echo.
echo   Or run: npm run dev
echo   Then open: http://localhost:3000
echo.
pause
