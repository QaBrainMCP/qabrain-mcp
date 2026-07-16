@echo off
title QaBrainMCP Setup

echo ==========================================
echo          QaBrainMCP Setup
echo ==========================================
echo.

echo [1/5] Checking Node.js...
node -v
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed.
    pause
    exit /b 1
)

echo.
echo [2/5] Installing dependencies...
call npm install

echo.
echo [3/5] Creating .env...
if not exist ".env" (
    copy .env.example .env
)

echo.
echo [4/5] Building project...
call npm run build

echo.
echo [5/5] Setup completed successfully!
echo.
echo Next steps:
echo   1. Edit .env with your application details
echo   2. Run: npm start
echo.
pause