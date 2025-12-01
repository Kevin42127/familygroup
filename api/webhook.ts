import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WebhookEvent, MessageEvent, TextEventMessage } from '@line/bot-sdk';
import { validateSignature, replyMessage } from '../src/services/lineService';
import { handleMessage } from '../src/handlers/messageHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-line-signature'] as string;
  const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  
  // 處理 LINE 的驗證請求（沒有簽章或空請求體）
  if (!signature || !bodyString || bodyString === '{}' || bodyString === '') {
    return res.status(200).json({ success: true });
  }

  if (!validateSignature(bodyString, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const events: WebhookEvent[] = bodyData.events || [];

  // 如果沒有事件，返回成功（可能是驗證請求）
  if (!events || events.length === 0) {
    return res.status(200).json({ success: true });
  }

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

    const messageText = textEvent.text || '';
    
    // 檢查是否被 @ Kevin AI 提及（支援大小寫變體）
    const isMentioned = /@\s*Kevin\s+AI/i.test(messageText) || /@Kevin\s+AI/i.test(messageText);

    // 只在被 @ Kevin AI 提及時才回應（群組或個人聊天都適用）
    if (!isMentioned) {
      continue;
    }

    // 移除 @ Kevin AI 前綴，取得實際訊息內容
    const cleanMessage = messageText.replace(/@\s*Kevin\s+AI\s*/gi, '').trim();

    // 如果移除 @AI 後沒有內容，跳過
    if (!cleanMessage) {
      continue;
    }

    try {
      const replyText = await handleMessage(userId, cleanMessage);
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
}

