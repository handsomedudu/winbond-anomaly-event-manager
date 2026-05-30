# 手機與外部網路展示

本專案預設改用 Tailscale Funnel 產生可公開存取的固定 HTTPS 網址。相較 LocalTunnel，它不會出現要求複製 IP 的中介驗證頁；相較 Cloudflare Quick Tunnel，它不會每次重開都換一組隨機網址，比較適合把網址交給朋友反覆測試。

## 第一次使用

1. 安裝 Tailscale for Windows：

```text
https://tailscale.com/download/windows
```

2. 安裝後從 Windows 系統匣開啟 Tailscale，登入你的 Tailscale 帳號。

3. 重新開啟終端機，確認 `tailscale` 可用：

```powershell
tailscale version
```

4. 第一次啟用 Funnel 時，Tailscale 可能會要求你在瀏覽器同意啟用 Funnel 權限，依畫面完成授權即可。

官方文件：
- [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel)
- [tailscale funnel command](https://tailscale.com/docs/reference/tailscale-cli/funnel)
- [Install Tailscale on Windows](https://tailscale.com/docs/install/windows)

## 雙擊啟動

完成第一次安裝與登入後，可以直接雙擊專案根目錄的：

```text
share-to-mobile.bat
```

此檔案會自動：

1. 檢查 `npm.cmd` 與 Tailscale CLI 是否可用。
2. 若前端尚未啟動，另開視窗執行 `npm.cmd run dev`。
3. 等待 `http://localhost:5173` 可連線。
4. 啟動 `tailscale funnel 5173`。
5. 自動複製 `https://xxxxx.ts.net` 網址到剪貼簿，並在電腦瀏覽器開啟。

也可以用指令啟動同一個流程：

```powershell
npm.cmd run share
```

## 手機開啟

Tailscale Funnel 啟動後，終端機會顯示類似以下的網址：

```text
https://your-pc.your-tailnet.ts.net
```

把這個網址傳到手機瀏覽器即可開啟。只要是同一台電腦、同一個 Tailscale 帳號與同一個 tailnet，這個 `*.ts.net` 網址會固定；但網站服務仍需要你的電腦保持開機、Vite dev server 和 Tailscale Funnel 持續運行。按 `Windows + L` 鎖定畫面通常不會中斷，睡眠、休眠、關機或網路斷線則會中斷。

停止共享時，在 Funnel 視窗按 `Ctrl + C`。

## Cloudflare 備援

若目前環境無法使用 Tailscale，可以改用 Cloudflare Tunnel 備援：

```powershell
npm.cmd run share:cloudflare
```

或直接雙擊：

```text
share-to-mobile-cloudflare.bat
```

第一次使用 Cloudflare 備援時請先安裝 `cloudflared`：

```powershell
winget install --id Cloudflare.cloudflared
```

Cloudflare Quick Tunnel 會產生 `https://xxxxx.trycloudflare.com` 隨機網址，適合臨時展示；若需要固定網址，優先使用 Tailscale Funnel。

## Vite host 白名單

Vite dev server 會檢查外部請求的 Host header。為了避免再次出現 `Blocked request. This host is not allowed.`，本專案在 `frontend/vite.config.js` 明確允許：

```js
allowedHosts: ['.ts.net', '.trycloudflare.com']
```

這樣可以支援 Tailscale Funnel 與 Cloudflare 備援，同時避免把所有 host 都開成 `true`。
