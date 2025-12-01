import { chatWithAI, getAvailableModels } from '../services/groqService';
import { handleReminderCommand, parseNaturalLanguageReminder } from './reminderHandler';
import { handleScheduleCommand } from './scheduleHandler';
import { storageService } from '../services/storageService';

function parseNaturalLanguageDelete(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // 移除常見的連接詞
  let cleanText = text.replace(/(提醒|事項|的|那個|這個)/gi, '').trim();
  
  // 嘗試提取編號
  const numberMatch = cleanText.match(/(\d+)|(第一|第二|第三|第四|第五|第六|第七|第八|第九|第十)/);
  if (numberMatch) {
    if (numberMatch[1]) {
      return numberMatch[1];
    } else if (numberMatch[2]) {
      const numberMap: { [key: string]: string } = {
        '第一': '1', '第二': '2', '第三': '3', '第四': '4', '第五': '5',
        '第六': '6', '第七': '7', '第八': '8', '第九': '9', '第十': '10'
      };
      return numberMap[numberMatch[2]] || null;
    }
  }
  
  // 嘗試提取內容關鍵字
  const contentMatch = cleanText.match(/(刪除|取消|移除|刪掉|不要)\s*(.+)/i);
  if (contentMatch && contentMatch[2]) {
    return contentMatch[2].trim();
  }
  
  return null;
}

export async function handleMessage(userId: string, text: string): Promise<string> {
  const trimmedText = text.trim();

  if (trimmedText.startsWith('模型') || trimmedText.startsWith('models') || trimmedText === '/models') {
    const models = await getAvailableModels();
    if (models.length === 0) {
      return '無法取得可用模型列表。';
    }
    return `可用模型：\n${models.join('\n')}`;
  }

  // 自然語言提醒識別
  const reminderMatch = parseNaturalLanguageReminder(trimmedText);
  if (reminderMatch) {
    return handleReminderCommand(userId, 'reminder', ['新增', reminderMatch.content, reminderMatch.time]);
  }

  // 自然語言刪除識別
  const deleteKeywords = ['刪除', '取消', '移除', '刪掉', '不要'];
  const hasDeleteKeyword = deleteKeywords.some(keyword => trimmedText.includes(keyword));
  if (hasDeleteKeyword && (trimmedText.includes('提醒') || trimmedText.includes('第一個') || trimmedText.includes('第二個') || trimmedText.match(/\d/))) {
    const deleteMatch = parseNaturalLanguageDelete(trimmedText);
    if (deleteMatch) {
      const reminders = storageService.getReminders(userId);
      if (reminders.length === 0) {
        return '目前沒有待處理的提醒事項。';
      }
      return handleReminderCommand(userId, 'reminder', ['刪除', deleteMatch]);
    }
  }

  // 傳統指令格式（保留向後相容）
  if (trimmedText.startsWith('提醒')) {
    const args = trimmedText.substring(2).trim().split(/\s+/);
    return handleReminderCommand(userId, 'reminder', args);
  }

  if (trimmedText.startsWith('行程')) {
    const args = trimmedText.substring(2).trim().split(/\s+/);
    return handleScheduleCommand(userId, 'schedule', args);
  }

  return await chatWithAI(userId, trimmedText);
}

