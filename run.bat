@echo off
title K9K Voice Tool v2
cd /d "%~dp0"

echo =================================
echo   K9K Voice Tool - Installing...
echo =================================
echo.

call npm install

echo.
echo =================================
echo   Starting K9K Voice Tool v2 System...
echo =================================
echo.

node index.js

pause