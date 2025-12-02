import { Client, TextMessage, ImageMessage, FlexMessage, FlexBubble, validateSignature as lineValidateSignature } from '@line/bot-sdk';
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

export function createAIReplyFlexMessage(text: string): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '🤖',
              size: 'lg',
              flex: 0
            },
            {
              type: 'text',
              text: 'Kevin AI',
              weight: 'bold',
              color: '#FFFFFF',
              size: 'lg',
              flex: 1
            }
          ],
          spacing: 'sm',
          alignItems: 'center'
        }
      ],
      backgroundColor: '#1DB446',
      paddingTop: '16px',
      paddingBottom: '16px',
      paddingStart: '16px',
      paddingEnd: '16px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'separator',
          color: '#E5E5E5',
          margin: 'md'
        },
        {
          type: 'text',
          text: text,
          wrap: true,
          color: '#333333',
          size: 'md',
          lineSpacing: '4px',
          margin: 'md'
        },
        {
          type: 'separator',
          color: '#E5E5E5',
          margin: 'md'
        }
      ],
      paddingTop: '8px',
      paddingBottom: '8px',
      paddingStart: '16px',
      paddingEnd: '16px'
    }
  };

  return {
    type: 'flex',
    altText: text,
    contents: bubble
  };
}

export function replyFlexMessage(replyToken: string, text: string): Promise<any> {
  const message = createAIReplyFlexMessage(text);
  return getClient().replyMessage(replyToken, message);
}

export function pushFlexMessage(userId: string, text: string): Promise<any> {
  const message = createAIReplyFlexMessage(text);
  return getClient().pushMessage(userId, message);
}

export { getClient as client };

