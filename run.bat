@echo off
echo ========================================
echo   ClinicalRounds
echo ========================================

if not exist node_modules (
    echo Dependencies not installed. Running setup first...
    call setup.bat
)

if not exist .env (
    echo ERROR: .env file not found. Run setup.bat first.
    pause
    exit /b 1
)

echo Starting server...
node server.js
