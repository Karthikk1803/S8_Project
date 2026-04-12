@echo off
title RECOPOINT Startup
echo ============================================
echo     RECOPOINT - Zero Waste Management App
echo ============================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing npm dependencies...
    call npm install
    echo.
) else (
    echo [1/3] npm dependencies already installed.
    echo.
)

:: Start Python AI server in a new window
echo [2/3] Starting AI Server (Python)...
if exist "RECO_APP\api_server.py" (
    start "RECOPOINT AI Server" cmd /k "cd /d %~dp0RECO_APP && python api_server.py"
    echo       AI Server starting in new window...
) else (
    echo       [WARN] RECO_APP\api_server.py not found. AI features will be offline.
)
echo.

:: Wait a moment for Python server to start
timeout /t 2 /nobreak >nul

:: Start Next.js dev server
echo [3/3] Starting Next.js dev server...
echo.
echo ============================================
echo   Frontend:  http://localhost:3000
echo   AI Server: http://localhost:5000/health
echo ============================================
echo.

call npm run dev
