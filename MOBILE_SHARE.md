# 手機與外部網路展示

本專案已改用 Cloudflare Tunnel 產生外部可開啟的 HTTPS 網址，取代 LocalTunnel。這樣可以避開 LocalTunnel 常見的 IP 驗證頁，手機展示也比較穩定。

## 第一次使用

1. 安裝 Cloudflare Tunnel 工具：

```powershell
winget install --id Cloudflare.cloudflared
```

2. 安裝完成後，重新開啟終端機，確認 `cloudflared` 可用：

```powershell
cloudflared --version
```

## 雙擊啟動

完成第一次安裝後，可以直接雙擊專案根目錄的：

```text
share-to-mobile.bat
```

此檔案會自動：

1. 檢查 `npm.cmd` 與 `cloudflared` 是否可用。
2. 若前端尚未啟動，另開視窗執行 `npm.cmd run dev`。
3. 等待 `http://localhost:5173` 可連線。
4. 啟動 Cloudflare Tunnel。
5. 自動複製 `https://xxxxx.trycloudflare.com` 網址到剪貼簿，並在電腦瀏覽器開啟。

也可以用指令啟動同一個流程：

```powershell
npm.cmd run share
```

## 手動啟動

若想分開觀察前後端與 tunnel log，也可以先執行 `npm.cmd run dev`，再另開終端機執行 `.\share-to-mobile.bat`。

## 手機開啟

Cloudflare Tunnel 啟動後，終端機會顯示類似以下的網址：

```text
https://example-name.trycloudflare.com
```

把這個網址傳到手機瀏覽器即可開啟。停止共享時，在 tunnel 視窗按 `Ctrl + C`。

## 防火牆備註

Cloudflare Tunnel 主要是由本機主動連線到 Cloudflare，不需要設定 router port forwarding。若所在網路封鎖 UDP，`share-to-mobile.bat` 已使用 `--protocol http2`，會改走 TCP，通常比預設 QUIC 更容易通過公司或學校網路。
