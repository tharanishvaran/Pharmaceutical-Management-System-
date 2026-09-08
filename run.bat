@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
chcp 65001 >nul
title Pharmaceutical Management System Launcher
cls

echo ======================================================================
echo           PHARMACEUTICAL MANAGEMENT SYSTEM - LAUNCHER
echo ======================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 goto :err_no_node

:: 2. Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 goto :err_no_npm

:: 3. Check Dependencies
echo [1/4] Verifying project dependencies...
if not exist "server\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd /d "%~dp0server"
    call npm install
    if !errorlevel! neq 0 goto :err_install_backend
    cd /d "%~dp0"
)

if not exist "client\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd /d "%~dp0client"
    call npm install
    if !errorlevel! neq 0 goto :err_install_frontend
    cd /d "%~dp0"
)
echo [OK] Dependencies verified.
echo.

:: 4. Check Database
echo [2/4] Verifying database...
if not exist "server\data\pharma.db" (
    echo [INFO] Database not found. Initializing and seeding demo data...
    cd /d "%~dp0server"
    call node src/seeds/seedDatabase.js
    if !errorlevel! neq 0 goto :err_seed
    cd /d "%~dp0"
    echo [OK] Database initialized and seeded successfully.
) else (
    echo [OK] Database found at server\data\pharma.db.
)
echo.

:: 5. Clean up any previous dangling instances on ports 5000 & 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)

:: 6. Launch Backend & Frontend
echo [3/4] Launching Backend Server on port 5000...
start "Pharma Backend Server [Port 5000]" cmd /k "title Pharma Backend Server && cd /d "%~dp0server" && node src/index.js"

:: Give backend 2 seconds to bind
ping 127.0.0.1 -n 3 >nul

echo [4/4] Launching Frontend Client on port 5173...
start "Pharma Frontend Client [Port 5173]" cmd /k "title Pharma Frontend Client && cd /d "%~dp0client" && npm run dev"

:: Give Vite 3 seconds to spin up
ping 127.0.0.1 -n 4 >nul

:: Open browser
echo [OK] Opening Web Application in your default browser...
start http://localhost:5173

echo.
echo ======================================================================
echo   SYSTEM READY!
echo ======================================================================
echo   - Web App URL:   http://localhost:5173
echo   - REST API URL:  http://localhost:5000/api/health
echo.
echo   Demo Login Credentials [Default Password: Password@123]:
echo   - Administrator:          admin@example.com
echo   - Manager:                manager@example.com
echo   - Pharmacist:             pharmacist@example.com
echo   - Cashier:                cashier@example.com
echo   - Medical Representative: representative@example.com
echo   - Vendor / Supplier:      vendor@example.com
echo   - Doctor / Physician:     doctor@example.com
echo   - Customer:               customer@example.com
echo.
echo   [Tip: You can also use the 1-Click Role Switcher inside the web app]
echo ======================================================================
echo.
echo Press any key to shutdown the application servers...
pause >nul

echo.
echo Stopping application servers...
taskkill /fi "WINDOWTITLE eq Pharma Backend Server*" /f /t >nul 2>nul
taskkill /fi "WINDOWTITLE eq Pharma Frontend Client*" /f /t >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)
echo Servers stopped cleanly.
ping 127.0.0.1 -n 2 >nul
exit /b 0

:: Error Handlers
:err_no_node
echo [ERROR] Node.js is not found in your system PATH.
echo Please install Node.js 18 or newer from https://nodejs.org
echo.
pause
exit /b 1

:err_no_npm
echo [ERROR] npm is not found in your system PATH.
echo.
pause
exit /b 1

:err_install_backend
echo [ERROR] Failed to install backend dependencies in server directory.
echo.
pause
exit /b 1

:err_install_frontend
echo [ERROR] Failed to install frontend dependencies in client directory.
echo.
pause
exit /b 1

:err_seed
echo [ERROR] Database initialization failed.
echo.
pause
exit /b 1
