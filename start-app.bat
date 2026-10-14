@echo off
title StudyMate — Digital Study Group Finder
echo ====================================================
echo Starting StudyMate Full-Stack MERN Application...
echo ====================================================

REM Ensure Node.js is in PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

echo 1. Launching Backend API Server on port 5000...
start "StudyMate Backend" cmd /k "cd /d "%~dp0server" && npm start"

echo 2. Waiting for backend initialization...
timeout /t 3 /nobreak >nul

echo 3. Launching Frontend Dev Server on port 5173...
start "StudyMate Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo 4. Waiting for Vite...
timeout /t 3 /nobreak >nul

echo ====================================================
echo Opening StudyMate in your browser: http://localhost:5173
echo ====================================================
start http://localhost:5173

pause
