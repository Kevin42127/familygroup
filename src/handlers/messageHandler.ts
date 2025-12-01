import { chatWithAI } from '../services/groqService';
import { storageService } from '../services/storageService';

function detectLanguage(text: string): 'chinese' | 'non-chinese' {
  const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  const hasChinese = chinesePattern.test(text);
  
  if (hasChinese) {
    return 'chinese';
  }
  
  const nonChinesePattern = /[a-zA-Z\u0080-\u024F\u1E00-\u1EFF]/;
  const hasNonChinese = nonChinesePattern.test(text);
  
  if (hasNonChinese && text.trim().length > 0) {
    return 'non-chinese';
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
  let processedText = trimmedText;
  
  if (language === 'non-chinese' && !trimmedText.toLowerCase().includes('翻譯') && !trimmedText.toLowerCase().includes('translate')) {
    processedText = `請將以下文字翻譯成繁體中文：${trimmedText}`;
  }
  
  return await chatWithAI(userId, processedText);
}

