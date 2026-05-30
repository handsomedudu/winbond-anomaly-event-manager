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

## 啟動專案

先啟動後端與前端：

```powershell
cd "C:\Users\zxc08\OneDrive\桌面\應徵資料\華邦電"
npm.cmd run dev
```

看到前端顯示 `http://localhost:5173` 後，另開一個終端機執行：

```powershell
.\share-to-mobile.bat
```

也可以直接使用 npm script：

```powershell
npm.cmd run share
```

## 手機開啟

Cloudflare Tunnel 啟動後，終端機會顯示類似以下的網址：

```text
https://example-name.trycloudflare.com
```

把這個網址傳到手機瀏覽器即可開啟。停止共享時，在 tunnel 視窗按 `Ctrl + C`。

## 防火牆備註

Cloudflare Tunnel 主要是由本機主動連線到 Cloudflare，不需要設定 router port forwarding。若所在網路封鎖 UDP，`share-to-mobile.bat` 已使用 `--protocol http2`，會改走 TCP，通常比預設 QUIC 更容易通過公司或學校網路。
