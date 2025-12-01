import Groq from 'groq-sdk';
import { Conversation } from '../types';
import { storageService } from './storageService';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY 未設定，請檢查 .env 檔案');
    }
    groqClient = new Groq({
      apiKey: apiKey
    });
  }
  return groqClient;
}

export async function getAvailableModels(): Promise<string[]> {
  try {
    const models = await getGroqClient().models.list();
    return models.data.map(model => model.id);
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

export async function chatWithAI(userId: string, userMessage: string): Promise<string> {
  try {
    const conversation = storageService.getConversation(userId);
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (conversation && conversation.messages.length > 0) {
      const recentMessages = conversation.messages.slice(-10);
      for (const msg of recentMessages) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    messages.push({
      role: 'user',
      content: userMessage
    });

    const completion = await getGroqClient().chat.completions.create({
      messages: messages as any,
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024
    });

    const assistantMessage = completion.choices[0]?.message?.content || '抱歉，我無法回應。';

    storageService.createOrUpdateConversation(userId, {
      role: 'user',
      content: userMessage
    });

    storageService.createOrUpdateConversation(userId, {
      role: 'assistant',
      content: assistantMessage
    });

    return assistantMessage;
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    return '抱歉，處理您的訊息時發生錯誤。';
  }
}

