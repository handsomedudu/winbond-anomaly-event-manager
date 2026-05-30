@echo off
chcp 65001 >nul
title 華邦電異常監控系統 - 已改用 Cloudflare Tunnel

echo ========================================================
echo     此專案已改用 Cloudflare Tunnel 進行手機共享
echo ========================================================
echo.
echo LocalTunnel 容易出現 IP 驗證頁，手機展示較不穩定。
echo 接下來會改用 share-to-mobile.bat 啟動 Cloudflare Tunnel。
echo.

call "%~dp0share-to-mobile.bat"
