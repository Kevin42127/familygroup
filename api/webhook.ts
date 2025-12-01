import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WebhookEvent, MessageEvent, TextEventMessage } from '@line/bot-sdk';
import { validateSignature, replyMessage } from '../src/services/lineService';
import { handleMessage } from '../src/handlers/messageHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-line-signature'] as string;
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  
  if (!validateSignature(bodyString, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

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
}

