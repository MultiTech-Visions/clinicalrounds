@echo off
echo ========================================
echo   ClinicalRounds
echo ========================================

if not exist node_modules (
    echo Dependencies not installed. Running setup first...
    call setup.bat
    if %errorlevel% neq 0 (
        echo.
        echo Setup failed. See errors above.
        pause
        exit /b 1
    )
)

if not exist .env (
    echo ERROR: .env file not found. Run setup.bat first.
    pause
    exit /b 1
)

echo Starting server...
node server.js
if %errorlevel% neq 0 (
    echo.
    echo Server exited with an error. See above for details.
    pause
    exit /b 1
)
pause
