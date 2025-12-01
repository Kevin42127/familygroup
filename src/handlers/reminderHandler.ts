import { storageService } from '../services/storageService';

export function handleReminderCommand(userId: string, command: string, args: string[]): string {
  const action = args[0]?.toLowerCase();

  if (action === '新增' || action === 'add' || action === '建立') {
    if (args.length < 3) {
      return '提醒事項格式：提醒 新增 [內容] [時間]\n例如：提醒 新增 買菜 2024-01-15 10:00';
    }

    const content = args.slice(1, -1).join(' ');
    const timeStr = args[args.length - 1];

    const scheduledTime = parseTime(timeStr);
    if (!scheduledTime) {
      return '時間格式錯誤，請使用：YYYY-MM-DD HH:mm 或 相對時間（如：1小時後、明天10點）';
    }

    const reminder = storageService.createReminder(userId, content, scheduledTime);
    const timeStrFormatted = new Date(scheduledTime).toLocaleString('zh-TW');
    return `已建立提醒事項：\n內容：${content}\n時間：${timeStrFormatted}\nID：${reminder.id}`;
  }

  if (action === '查詢' || action === 'list' || action === '列表') {
    const reminders = storageService.getReminders(userId);
    if (reminders.length === 0) {
      return '目前沒有待處理的提醒事項。';
    }

    let result = `您有 ${reminders.length} 個待處理的提醒事項：\n\n`;
    reminders.forEach((r, index) => {
      const timeStr = new Date(r.scheduledTime).toLocaleString('zh-TW');
      result += `${index + 1}. ${r.content}\n   時間：${timeStr}\n   ID：${r.id}\n\n`;
    });
    return result.trim();
  }

  if (action === '刪除' || action === 'delete' || action === 'remove') {
    if (args.length < 2) {
      return '請提供要刪除的提醒事項 ID。';
    }

    const id = args[1];
    const success = storageService.deleteReminder(id, userId);
    return success ? '提醒事項已刪除。' : '找不到該提醒事項或您沒有權限刪除。';
  }

  return '提醒事項指令：\n- 提醒 新增 [內容] [時間]\n- 提醒 查詢\n- 提醒 刪除 [ID]';
}

function parseTime(timeStr: string): number | null {
  const now = Date.now();
  
  if (timeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
    const date = new Date(timeStr);
    return isNaN(date.getTime()) ? null : date.getTime();
  }

  if (timeStr.includes('小時後') || timeStr.includes('小时后')) {
    const hours = parseInt(timeStr);
    if (!isNaN(hours)) {
      return now + hours * 60 * 60 * 1000;
    }
  }

  if (timeStr.includes('分鐘後') || timeStr.includes('分钟后')) {
    const minutes = parseInt(timeStr);
    if (!isNaN(minutes)) {
      return now + minutes * 60 * 1000;
    }
  }

  if (timeStr === '明天') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.getTime();
  }

  return null;
}

