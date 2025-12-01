import { chatWithAI } from '../services/groqService';
import { storageService } from '../services/storageService';

export async function handleMessage(userId: string, text: string): Promise<string> {
  const trimmedText = text.trim();
  
  const clearKeywords = ['清除資料', '清除記錄', '清除對話', '刪除資料', '清除歷史', '清除'];
  const isClearCommand = clearKeywords.some(keyword => trimmedText.includes(keyword));
  
  if (isClearCommand) {
    storageService.clearUserData(userId);
    return '已清除您的所有對話記錄和資料。';
  }
  
  return await chatWithAI(userId, trimmedText);
}

