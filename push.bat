@echo off
cd /d "%~dp0"
chcp 65001 >nul
title Push Pharmaceutical Management System to GitHub
cls

echo ======================================================================
echo            PUSHING PROJECT TO GITHUB
echo ======================================================================
echo.
echo Repository: https://github.com/tharanishvaran/Pharmaceutical-Management-System-.git
echo Branch:     main
echo.
echo Uploading repository commits...
echo (If GitHub prompts for authentication, please sign in with your browser)
echo.

git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ======================================================================
    echo  [SUCCESS] All files and commits successfully pushed to GitHub!
    echo ======================================================================
    echo  View repository: https://github.com/tharanishvaran/Pharmaceutical-Management-System-
) else (
    echo ======================================================================
    echo  [ERROR] Git push encountered an issue or requires authentication.
    echo ======================================================================
    echo  Tip: You can generate a Personal Access Token from GitHub Settings 
    echo  or authenticate using Git Credential Manager.
)
echo.
pause
