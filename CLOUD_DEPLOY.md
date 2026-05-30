# 免費雲端部署：Cloudflare Pages + D1

這個專案的雲端版使用 Cloudflare Pages 托管前端，Pages Functions 托管 `/api/*`，D1 保存異常事件與工程師資料。部署後網站會跑在 Cloudflare 的 `*.pages.dev` 網址，不需要本機電腦保持開機。

## 為什麼選這個方案

- Cloudflare Pages Free plan 可部署靜態前端，免費方案每月有 500 次 build 額度。
- Pages Functions 可以在同一個網址提供 API，不需要另外租 Node.js 主機。
- D1 是 Cloudflare 的 Serverless SQL 資料庫，免費方案提供基本儲存與查詢額度，適合面試展示與朋友測試。
- 前端仍維持呼叫 `/api/...`，本機開發用 Vite proxy，雲端部署用 Pages Functions，程式碼切換成本低。

官方文件：
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Pages Functions D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare D1 pricing](https://www.cloudflare.com/plans/)
- [Wrangler D1 commands](https://developers.cloudflare.com/d1/wrangler-commands/)

## 第一次部署

1. 登入 Cloudflare：

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npx.cmd --yes --registry=https://registry.npmjs.org wrangler login
```

2. 建立 D1 資料庫，並自動把 DB binding 寫入 `wrangler.toml`：

```powershell
npm run cloudflare:db:create
```

若指令只印出 `database_id` 但沒有自動更新檔案，請把 `wrangler.toml` 內的 `database_id = "local-development"` 換成終端機顯示的 UUID。

3. 初始化遠端資料庫表格與展示資料：

```powershell
npm run cloudflare:db:init
```

4. 部署到 Cloudflare Pages：

```powershell
npm run cloudflare:deploy
```

部署完成後，終端機會顯示一組 `https://...pages.dev` 網址。把這個網址傳給朋友，他們就能直接開，不需要你的電腦在線上。

## 後續更新

修改程式後重新部署：

```powershell
npm run cloudflare:deploy
```

若只改前端或 Functions，不需要重跑 `cloudflare:db:init`。只有資料表 schema 或預設資料要更新時，才需要重新執行資料庫初始化。

## 本機測試雲端版

```powershell
npm run build
npx.cmd --yes --registry=https://registry.npmjs.org wrangler d1 execute winbond-anomaly-db --local --file=cloudflare/d1-schema.sql
npm run cloudflare:dev
```

## 注意事項

- 免費雲端版的附件上傳會把檔案內容以 data URL 存在 D1，適合小型測試報告，不建議放大型 PDF 或機密文件。
- 這是公開展示站，請不要上傳公司機密、真實晶圓廠資料或個資。
- 若要正式長期使用，附件應改接 Cloudflare R2，並加上登入權限控管。
