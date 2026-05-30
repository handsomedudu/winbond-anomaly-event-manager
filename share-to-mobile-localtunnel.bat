@echo off
chcp 65001 >nul
title 華邦電異常監控系統 - LocalTunnel 手機共享啟動器

echo ========================================================
echo     華邦電異常監控系統 - LocalTunnel 手機共享啟動器
echo ========================================================
echo.
echo 正在啟動 LocalTunnel 共享通道...
echo.
echo ========================================================
echo  【使用指南】
echo  1. 請複製下方顯示的 "your url is: https://..." 網址。
echo  2. 將網址輸入至手機瀏覽器開啟，即可跨網際網路進行展示！
echo  3. ⚠️ 第一次在手機打開時，畫面上會出現一個「Friendly Reminder」安全畫面。
echo     請直接點擊按鈕【Click to Continue】，即可順利進入監控系統！
echo  4. 欲停止共享時，請直接在本視窗按 Ctrl + C 或關閉此視窗。
echo ========================================================
echo.

call npx localtunnel --port 5173

pause
