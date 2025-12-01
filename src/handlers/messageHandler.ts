import { chatWithAI, getAvailableModels } from '../services/groqService';
import { handleReminderCommand } from './reminderHandler';
import { handleScheduleCommand } from './scheduleHandler';

export async function handleMessage(userId: string, text: string): Promise<string> {
  const trimmedText = text.trim();

  if (trimmedText.startsWith('模型') || trimmedText.startsWith('models') || trimmedText === '/models') {
    const models = await getAvailableModels();
    if (models.length === 0) {
      return '無法取得可用模型列表。';
    }
    return `可用模型：\n${models.join('\n')}`;
  }

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

