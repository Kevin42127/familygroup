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
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    messages.push({
      role: 'system',
      content: '你是 Kevin 的家庭群組 AI 助手，專門協助家庭群組管理。當被問到「你是誰」、「是誰的AI」或類似問題時，回答：「我是 Kevin 的 AI 助手，專門協助這個家庭群組管理各種事務，包括提醒事項、行程安排等。有什麼需要幫忙的嗎？」重要：你必須且只能使用繁體中文回應，絕對不能使用簡體中文、英文、日文或其他任何語言。所有回應都必須是繁體中文。'
    });

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
      model: 'llama-3.1-8b-instant',
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

