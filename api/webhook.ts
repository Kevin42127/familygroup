import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WebhookEvent, MessageEvent, TextEventMessage } from '@line/bot-sdk';
import { validateSignature, replyMessage, pushMessage } from '../src/services/lineService';
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
    // 處理加入群組或聊天室事件
    if (event.type === 'join') {
      try {
        let targetId: string | null = null;
        
        // 檢查是群組還是聊天室
        if (event.source.type === 'group') {
          targetId = event.source.groupId;
        } else if (event.source.type === 'room') {
          targetId = event.source.roomId;
        }
        
        if (targetId) {
          const welcomeMessage = '大家好！我是 Kevin 最近開發的 AI 助手，想幫大家更方便地使用這個群組。\n\n我可以幫大家：\n\n- 翻譯文字（中英日韓等）\n\n- 回答問題、解釋概念\n\n- 提供建議和協助\n\n使用方式很簡單，只要 @ Kevin AI 然後問問題就可以了！\n\n例如：\n@ Kevin AI 翻譯 Hello 成中文\n@ Kevin AI 什麼是人工智慧？\n\n如果需要清除對話記錄，可以輸入：\n@ Kevin AI 清除資料';
          await pushMessage(targetId, welcomeMessage);
        }
      } catch (error) {
        console.error('Error sending welcome message:', error);
      }
      continue;
    }

    // 處理訊息事件
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
      await replyMessage(messageEvent.replyToken, '正在思考...');
      
      const replyText = await handleMessage(userId, cleanMessage);
      
      const targetId = messageEvent.source.type === 'group' 
        ? messageEvent.source.groupId 
        : messageEvent.source.type === 'room'
        ? messageEvent.source.roomId
        : userId;
      
      if (targetId) {
        await pushMessage(targetId, replyText);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      try {
        const targetId = messageEvent.source.type === 'group' 
          ? messageEvent.source.groupId 
          : messageEvent.source.type === 'room'
          ? messageEvent.source.roomId
          : userId;
        
        if (targetId) {
          await pushMessage(targetId, '處理訊息時發生錯誤，請稍後再試。');
        }
      } catch (replyError) {
        console.error('Error replying:', replyError);
      }
    }
  }

  return res.status(200).json({ success: true });
}

