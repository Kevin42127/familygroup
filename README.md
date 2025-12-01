# LINE 家庭群組 AI Bot

使用 GROQ AI 的 LINE 家庭群組機器人，具備網路搜尋、翻譯和解釋功能。

## 功能特色

- 網路搜尋：協助查詢資訊和回答問題
- 翻譯功能：多語言翻譯（繁體中文、簡體中文、英文、日文、韓文等）
- 解釋功能：詳細解釋各種概念和問題
- 智能對話：回答各種問題，提供建議和協助

## 技術架構

- Node.js (TypeScript)
- GROQ AI API（用於對話、翻譯、解釋）
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

**取得 API Keys：**
- GROQ API Key: https://console.groq.com/

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

### 資訊查詢
AI 會根據知識庫回答問題，如需最新資訊會提供搜尋連結：
- `@ Kevin AI 什麼是人工智慧？`
- `@ Kevin AI 查詢 天氣預報`
- `@ Kevin AI 找 食譜`

### 翻譯功能
使用自然語言要求翻譯：
- `@ Kevin AI 翻譯 Hello 成中文`
- `@ Kevin AI 將「你好」翻譯成英文`
- `@ Kevin AI 幫我翻譯日文：こんにちは`

### 解釋功能
詢問概念或名詞解釋：
- `@ Kevin AI 什麼是人工智慧？`
- `@ Kevin AI 解釋一下量子計算`
- `@ Kevin AI 說明什麼是區塊鏈`

### 一般對話
直接與 AI 對話，回答各種問題：
- `@ Kevin AI 你好`
- `@ Kevin AI 今天天氣如何？`
- `@ Kevin AI 推薦一些好書`

## 注意事項

- 本專案使用記憶體儲存，資料在服務重啟後會消失
- 如需持久化儲存，建議使用 Vercel Postgres 或其他資料庫服務
- LINE Bot 免費方案每月有訊息數量限制

## 授權

MIT License

