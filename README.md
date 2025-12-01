# LINE 家庭群組 AI Bot

使用 GROQ AI 的 LINE 家庭群組機器人，具備智能對話、提醒事項管理和家庭行程管理功能。

## 功能特色

- 智能對話：使用 GROQ AI 回答問題
- 提醒事項：建立、查詢、刪除提醒
- 行程管理：新增、查詢家庭行程
- 模型查詢：查詢 GROQ 可用模型列表

## 技術架構

- Node.js (TypeScript)
- GROQ AI API
- LINE Messaging API
- Vercel Serverless Functions
- 記憶體儲存

## 環境變數設定

建立 `.env` 檔案或於 Vercel 設定環境變數：

```
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
GROQ_API_KEY=your_groq_api_key
```

## 本地開發

### 方法一：使用 Express 伺服器（推薦）

1. 安裝依賴：
```bash
npm install
```

2. 建立 `.env` 檔案並填入環境變數：
```
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
GROQ_API_KEY=your_groq_api_key
PORT=3000
```

3. 編譯並啟動本地伺服器：
```bash
npm run local
```

4. 使用 ngrok 暴露本地服務器：
   - 安裝 ngrok：https://ngrok.com/download
   - 在另一個終端執行：
   ```bash
   ngrok http 3000
   ```
   - 複製 ngrok 提供的 HTTPS URL（例如：`https://xxxx.ngrok.io`）

5. 設定 LINE Webhook：
   - 前往 [LINE Developers Console](https://developers.line.biz/console/)
   - 進入您的 Messaging API Channel
   - 在 "Messaging API" 設定中：
     - 將 Webhook URL 設為：`https://xxxx.ngrok.io/webhook`
     - 點選 "Verify" 驗證連線
     - 啟用 "Use webhook"

6. 測試：
   - 在 LINE 中傳送訊息給您的 Bot
   - 查看終端機的日誌輸出

### 方法二：使用 Vercel CLI

1. 安裝 Vercel CLI：
```bash
npm install -g vercel
```

2. 啟動本地開發伺服器：
```bash
vercel dev
```

3. 按照提示設定環境變數

4. 使用 ngrok 暴露本地服務器（Vercel CLI 通常會顯示本地 URL）

## Vercel 部署

1. 將專案推送到 GitHub/GitLab/Bitbucket

2. 在 Vercel 連接專案：
   - 前往 [Vercel](https://vercel.com)
   - 點選 "New Project"
   - 選擇您的 Git 儲存庫

3. 設定環境變數：
   - 在專案設定中新增以下環境變數：
     - `LINE_CHANNEL_SECRET`
     - `LINE_CHANNEL_ACCESS_TOKEN`
     - `GROQ_API_KEY`

4. 部署：
   - Vercel 會自動偵測並部署
   - 部署完成後，複製 Webhook URL

5. 設定 LINE Webhook：
   - 前往 [LINE Developers Console](https://developers.line.biz/console/)
   - 進入您的 Messaging API Channel
   - 在 "Messaging API" 設定中：
     - 將 Webhook URL 設為：`https://your-project.vercel.app/api/webhook`
     - 啟用 "Use webhook"
     - 關閉 "Auto-reply messages"

## 使用方式

### 智能對話
直接傳送訊息給 Bot，AI 會自動回應。

### 查詢可用模型
傳送：`模型` 或 `models` 或 `/models`

### 提醒事項

- 新增提醒：`提醒 新增 [內容] [時間]`
  - 例如：`提醒 新增 買菜 2024-01-15 10:00`
  - 例如：`提醒 新增 開會 1小時後`

- 查詢提醒：`提醒 查詢`

- 刪除提醒：`提醒 刪除 [ID]`

### 行程管理

- 新增行程：`行程 新增 [標題] [日期時間] [參與者...]`
  - 例如：`行程 新增 家庭聚餐 2024-01-15 18:00 爸爸 媽媽`

- 查詢行程：`行程 查詢 [開始日期] [結束日期]`
  - 例如：`行程 查詢 2024-01-01 2024-01-31`

## 注意事項

- 本專案使用記憶體儲存，資料在服務重啟後會消失
- 如需持久化儲存，建議使用 Vercel Postgres 或其他資料庫服務
- LINE Bot 免費方案每月有訊息數量限制

## 授權

MIT License

