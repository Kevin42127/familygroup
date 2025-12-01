import { chatWithAI } from '../services/groqService';
import { storageService } from '../services/storageService';

function detectLanguage(text: string): 'chinese' | 'english' {
  const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  const hasChinese = chinesePattern.test(text);
  
  if (hasChinese) {
    return 'chinese';
  }
  
  const englishPattern = /[a-zA-Z]/;
  const hasEnglish = englishPattern.test(text);
  
  if (hasEnglish && text.trim().length > 0) {
    return 'english';
  }
  
  return 'chinese';
}

export async function handleMessage(userId: string, text: string): Promise<string> {
  const trimmedText = text.trim();
  
  const clearKeywords = ['清除資料', '清除記錄', '清除對話', '刪除資料', '清除歷史', '清除'];
  const isClearCommand = clearKeywords.some(keyword => trimmedText.includes(keyword));
  
  if (isClearCommand) {
    storageService.clearUserData(userId);
    return '已清除您的所有對話記錄和資料。';
  }
  
  const language = detectLanguage(trimmedText);
  return await chatWithAI(userId, trimmedText, language);
}

