@echo off
setlocal
cd /d "%~dp0"
title Winbond Mobile Share - Cloudflare Tunnel

echo ========================================================
echo        Winbond Mobile Share - Cloudflare Tunnel
echo ========================================================
echo.
echo This launcher starts the dev server when needed, then opens a Cloudflare Tunnel.
echo The tunnel URL will be copied to clipboard and opened in your default browser.
echo.

echo [Step 1/3] Checking required tools...
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo.
  echo npm.cmd was not found. Please install Node.js first.
  echo.
  pause
  exit /b 1
)

where cloudflared >nul 2>nul
if errorlevel 1 (
  echo.
  echo cloudflared was not found. Install Cloudflare Tunnel first:
  echo.
  echo   winget install --id Cloudflare.cloudflared
  echo.
  echo After installation, reopen this launcher.
  echo.
  pause
  exit /b 1
)
echo Required tools are ready.
echo.

echo [Step 2/3] Checking Vite on localhost:5173...
call :check_frontend
if errorlevel 1 (
  echo Port 5173 is not ready. Starting npm.cmd run dev in a new window...
  start "Winbond Dev Server" cmd /k "cd /d ""%~dp0"" && npm.cmd run dev"
  echo Waiting up to 60 seconds for Vite to start...

  call :wait_for_frontend
  if not errorlevel 1 goto frontend_ready

  echo.
  echo Timed out waiting for localhost:5173.
  echo Check the "Winbond Dev Server" window for errors.
  echo If dependencies are missing, run: npm.cmd run install-all
  echo.
  pause
  exit /b 1
)

:frontend_ready
echo Vite is ready on localhost:5173.
echo.

echo [Step 3/3] Starting Cloudflare Tunnel...
echo.
echo ========================================================
echo  How to use
echo  1. Wait for the https://xxxxx.trycloudflare.com URL.
echo  2. The URL will be copied to clipboard and opened locally.
echo  3. Send that URL to your phone browser.
echo  4. Press Ctrl+C in this window to stop sharing.
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-cloudflare-tunnel.ps1"
if errorlevel 1 (
  echo.
  echo Cloudflare Tunnel failed. Check network or firewall access for cloudflared.
  echo.
  pause
  exit /b 1
)

pause
exit /b 0

:check_frontend
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
exit /b %ERRORLEVEL%

:wait_for_frontend
for /l %%i in (1,1,60) do (
  call :check_frontend
  if not errorlevel 1 exit /b 0
  timeout /t 1 /nobreak >nul
)
exit /b 1
