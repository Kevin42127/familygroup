import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { WebhookEvent, MessageEvent, TextEventMessage } from '@line/bot-sdk';
import { validateSignature, replyMessage } from './src/services/lineService';
import { handleMessage } from './src/handlers/messageHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'LINE Bot is running' });
});

app.post('/webhook', async (req, res) => {
  const signature = req.headers['x-line-signature'] as string;
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const body = (req as any).rawBody || JSON.stringify(req.body);
  
  if (!validateSignature(body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const events: WebhookEvent[] = bodyData.events || [];

  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') {
      continue;
    }

    const messageEvent = event as MessageEvent;
    const textEvent = messageEvent.message as TextEventMessage;
    const userId = messageEvent.source.userId;

    if (!userId) {
      continue;
    }

    try {
      const replyText = await handleMessage(userId, textEvent.text);
      await replyMessage(messageEvent.replyToken, replyText);
    } catch (error) {
      console.error('Error handling message:', error);
      try {
        await replyMessage(messageEvent.replyToken, '處理訊息時發生錯誤，請稍後再試。');
      } catch (replyError) {
        console.error('Error replying:', replyError);
      }
    }
  }

  return res.status(200).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
  console.log('請使用 ngrok 或其他工具將此 URL 暴露給 LINE Webhook');
});

