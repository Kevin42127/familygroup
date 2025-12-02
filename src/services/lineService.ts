import { Client, TextMessage, ImageMessage, validateSignature as lineValidateSignature } from '@line/bot-sdk';
import * as crypto from 'crypto';

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const secret = process.env.LINE_CHANNEL_SECRET;
    
    if (!token || !secret) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN 或 LINE_CHANNEL_SECRET 未設定，請檢查 .env 檔案');
    }
    
    client = new Client({
      channelAccessToken: token,
      channelSecret: secret
    });
  }
  return client;
}

export function replyMessage(replyToken: string, text: string): Promise<any> {
  const message: TextMessage = {
    type: 'text',
    text: text
  };

  return getClient().replyMessage(replyToken, message);
}

export function pushMessage(userId: string, text: string): Promise<any> {
  const message: TextMessage = {
    type: 'text',
    text: text
  };

  return getClient().pushMessage(userId, message);
}

export function pushImageMessage(userId: string, imageUrl: string, previewUrl?: string): Promise<any> {
  const message: ImageMessage = {
    type: 'image',
    originalContentUrl: imageUrl,
    previewImageUrl: previewUrl || imageUrl
  };

  return getClient().pushMessage(userId, message);
}

export function validateSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

export { getClient as client };

