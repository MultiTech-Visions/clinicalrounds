@echo off
echo ========================================
echo   ClinicalRounds Setup
echo ========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env and add your API keys:
    echo   ANTHROPIC_API_KEY=sk-ant-...
    echo   OPENAI_API_KEY=sk-...  (optional, for Voice Council)
    echo.
)

echo.
echo Setup complete! Run 'run.bat' to start the app.
pause
