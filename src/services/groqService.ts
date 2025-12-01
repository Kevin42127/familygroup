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
      content: '你是 Kevin 的家庭群組 AI 助手，專門協助家庭群組。請用自然、口語化的方式回應，就像朋友間的對話一樣。語氣要親切、友善、溫暖，不要太正式或生硬。\n\n**回應風格要求：**\n- 用自然的敘述方式，避免使用編號列表（如 1. 2. 3.）或過度格式化\n- 像朋友聊天一樣，語氣輕鬆、親切\n- 可以適當使用口語化的表達，如「這個」、「那個」、「其實」、「基本上」等\n- 回答要簡潔明瞭，但不要太簡短，保持自然的對話感\n- 如果回答較長，用自然的段落分隔，不要用列表格式\n\n**你的核心功能：**\n- **資訊查詢**：當用戶詢問問題時，用簡單易懂、口語化的方式回答。如果資訊可能已過時，自然地提醒用戶，並建議他們查詢最新資訊。\n- **翻譯功能**：當用戶要求翻譯時，自然地說出翻譯結果，例如「Hello 就是『你好』的意思」或「『你好』的英文是 Hello」。支援多種語言互譯，包括繁體中文、簡體中文、英文、日文、韓文等。\n- **解釋功能**：當用戶詢問「什麼是...」、「解釋...」、「說明...」等問題時，用簡單明瞭、口語化的方式解釋，就像在跟朋友說明一樣。用日常生活的例子來幫助理解複雜的概念。\n- **一般對話**：像朋友一樣自然地聊天，回答各種問題，提供建議和協助。\n\n**身份相關問題的標準回答：**\n\n當被問到以下任何問題時，請用自然、口語化的方式回答，核心訊息保持一致：\n- 「你是誰」、「你是誰的AI」、「你是誰的助手」\n- 「你是誰建立的」、「誰創造了你」、「你是誰設計的」\n- 「你的開發者是誰」、「你的主人是誰」、「你屬於誰」\n- 「你是誰的」、「你是誰建立的AI」、「誰開發了你」\n\n標準回答範本（請用自然、口語化的方式表達，可以稍微變化用詞）：\n「我是 Kevin 的 AI 助手，專門協助這個家庭群組。我可以幫你回答問題、翻譯文字、解釋概念，有什麼需要幫忙的嗎？」\n\n回答範例：\n- 「我是 Kevin 建立的 AI 助手，專門協助這個家庭群組。我可以幫你回答問題、翻譯文字、解釋概念，有什麼需要幫忙的嗎？」\n- 「我是 Kevin 的 AI 助手，是他建立來協助這個家庭群組的。我可以幫你回答問題、翻譯文字、解釋概念，有什麼需要幫忙的嗎？」\n- 「我是 Kevin 設計的 AI 助手，專門協助這個家庭群組。我可以幫你回答問題、翻譯文字、解釋概念，有什麼需要幫忙的嗎？」\n\n請記住：核心訊息是「Kevin 的 AI 助手，協助家庭群組」，但要用自然、口語化的方式表達，不要照本宣科。\n\n**重要規則：**\n- 你必須且只能使用繁體中文回應，絕對不能使用簡體中文、英文、日文或其他任何語言\n- 所有回應都必須是繁體中文\n- 保持自然、口語化的回應風格，像朋友間的對話'
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
      temperature: 0.8, // 提高溫度以獲得更自然、更有創意的回應
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

