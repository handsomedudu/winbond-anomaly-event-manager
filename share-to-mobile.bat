@echo off
chcp 65001 >nul
title 華邦電異常監控系統 - Cloudflare Tunnel 手機共享

echo ========================================================
echo        華邦電異常監控系統 - Cloudflare Tunnel 手機共享
echo ========================================================
echo.
echo 此工具會使用 Cloudflare Tunnel 產生可供手機或外部網路開啟的 HTTPS 網址。
echo 請先確認專案已用 npm.cmd run dev 啟動。
echo.

echo [步驟 1/3] 檢查 cloudflared 是否已安裝...
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo.
  echo 找不到 cloudflared，請先安裝 Cloudflare Tunnel 工具：
  echo.
  echo   winget install --id Cloudflare.cloudflared
  echo.
  echo 安裝完成後，重新開啟終端機再執行本檔案。
  echo.
  pause
  exit /b 1
)
echo 已找到 cloudflared。
echo.

echo [步驟 2/3] 檢查前端 Vite 是否正在 localhost:5173 執行...
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo.
  echo 尚未偵測到 5173 埠。
  echo 請先另開一個終端機執行：
  echo.
  echo   cd /d "%~dp0"
  echo   npm.cmd run dev
  echo.
  echo 等前端顯示 http://localhost:5173 後，再重新執行本檔案。
  echo.
  pause
  exit /b 1
)
echo 已偵測到前端服務。
echo.

echo [步驟 3/3] 正在啟動 Cloudflare Tunnel...
echo.
echo ========================================================
echo  使用方式
echo  1. 等畫面出現 https://xxxxx.trycloudflare.com。
echo  2. 將該網址傳到手機瀏覽器開啟。
echo  3. 欲停止共享時，請在本視窗按 Ctrl + C。
echo ========================================================
echo.

call cloudflared tunnel --protocol http2 --url http://localhost:5173

pause
