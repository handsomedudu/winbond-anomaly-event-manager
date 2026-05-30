@echo off
setlocal
cd /d "%~dp0"
title Winbond Mobile Share - Legacy LocalTunnel Redirect

echo ========================================================
echo     LocalTunnel was retired for this project.
echo ========================================================
echo.
echo Starting the default Tailscale Funnel launcher instead.
echo.

call "%~dp0share-to-mobile.bat"
