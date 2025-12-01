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


export async function chatWithAI(userId: string, userMessage: string): Promise<string> {
  try {
    const conversation = storageService.getConversation(userId);
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    messages.push({
      role: 'system',
      content: '你是 Kevin 的家庭群組 AI 助手，專門協助家庭群組。你的核心功能包括：\n\n1. **資訊查詢**：當用戶詢問問題時，使用你的知識庫提供資訊。如果資訊可能已過時或需要最新資訊，請提醒用戶資訊可能不是最新的，並建議他們使用搜尋引擎查詢最新資訊。\n\n2. **翻譯功能**：當用戶要求翻譯時，準確翻譯文字。支援多種語言互譯，包括繁體中文、簡體中文、英文、日文、韓文等。翻譯時要準確、自然、符合目標語言的表達習慣。格式範例：「翻譯：Hello → 你好」或「將以下文字翻譯成英文：你好 → Hello」。\n\n3. **解釋功能**：當用戶詢問「什麼是...」、「解釋...」、「說明...」等問題時，提供詳細、易懂的解釋。用簡單明瞭的方式解釋複雜的概念，適合家庭群組成員理解。\n\n4. **一般對話**：回答各種問題，提供建議和協助。\n\n當被問到「你是誰」、「是誰的AI」或類似問題時，回答：「我是 Kevin 的 AI 助手，專門協助這個家庭群組。我可以幫您回答問題、翻譯文字、解釋概念。有什麼需要幫忙的嗎？」\n\n重要：你必須且只能使用繁體中文回應，絕對不能使用簡體中文、英文、日文或其他任何語言。所有回應都必須是繁體中文。'
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

