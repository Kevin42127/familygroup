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
      return '時間格式錯誤，支援格式：\n- 完整日期：2024-12-15 10:00\n- 只有日期：2024-12-15（預設9:00）\n- 相對時間：1小時後、30分鐘後\n- 簡單時間：10:00、明天 10:00\n- 關鍵字：明天、後天';
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
  const timeStrLower = timeStr.toLowerCase().trim();
  
  // 完整日期時間格式：2024-12-15 10:00 或 2024/12/15 10:00
  if (timeStr.match(/^\d{4}[-\/]\d{2}[-\/]\d{2}\s+\d{2}:\d{2}$/)) {
    const dateStr = timeStr.replace(/\//g, '-');
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  // 只有日期：2024-12-15（預設為當天 9:00）
  if (timeStr.match(/^\d{4}[-\/]\d{2}[-\/]\d{2}$/)) {
    const dateStr = timeStr.replace(/\//g, '-') + ' 09:00';
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  // X小時後
  const hoursMatch = timeStr.match(/(\d+)\s*小時後?/i);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    if (!isNaN(hours)) {
      return now + hours * 60 * 60 * 1000;
    }
  }

  // X分鐘後
  const minutesMatch = timeStr.match(/(\d+)\s*分鐘後?/i);
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1]);
    if (!isNaN(minutes)) {
      return now + minutes * 60 * 1000;
    }
  }

  // 明天（預設早上9點）
  if (timeStrLower === '明天' || timeStrLower === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.getTime();
  }

  // 後天
  if (timeStrLower === '後天' || timeStrLower === 'day after tomorrow') {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(9, 0, 0, 0);
    return dayAfter.getTime();
  }

  // 今天 + 時間：今天 10:00
  if (timeStrLower.startsWith('今天')) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const today = new Date(now);
      today.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      if (today.getTime() > now) {
        return today.getTime();
      } else {
        // 如果時間已過，設為明天
        today.setDate(today.getDate() + 1);
        return today.getTime();
      }
    }
  }

  // 明天 + 時間：明天 10:00
  if (timeStrLower.startsWith('明天')) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      return tomorrow.getTime();
    }
  }

  // 簡單時間格式：10:00（預設為今天，如果已過則為明天）
  if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const today = new Date(now);
      today.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      if (today.getTime() > now) {
        return today.getTime();
      } else {
        // 如果時間已過，設為明天
        today.setDate(today.getDate() + 1);
        return today.getTime();
      }
    }
  }

  return null;
}

