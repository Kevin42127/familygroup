import { storageService } from '../services/storageService';

export function handleReminderCommand(userId: string, command: string, args: string[]): string {
  const action = args[0]?.toLowerCase();

  if (action === '新增' || action === 'add' || action === '建立') {
    if (args.length < 2) {
      return '提醒事項格式：提醒 新增 [內容]\n例如：提醒 新增 買菜\n\n也可以指定時間：提醒 新增 買菜 明天';
    }

    // 如果只有內容，沒有時間，預設為明天
    let content: string;
    let timeStr: string;
    
    if (args.length === 2) {
      // 只有內容，沒有時間
      content = args[1];
      timeStr = '明天';
    } else {
      // 有內容和時間
      content = args.slice(1, -1).join(' ');
      timeStr = args[args.length - 1];
    }

    const scheduledTime = parseTime(timeStr);
    if (!scheduledTime) {
      return '時間格式錯誤，支援格式：\n- 完整日期：2024-12-15 10:00\n- 只有日期：2024-12-15（預設9:00）\n- 相對時間：1小時後、30分鐘後\n- 簡單時間：10:00、明天 10:00\n- 關鍵字：明天、後天\n\n如果不指定時間，預設為明天早上9點';
    }

    const reminder = storageService.createReminder(userId, content, scheduledTime);
    const timeStrFormatted = new Date(scheduledTime).toLocaleString('zh-TW');
    return `已建立提醒事項：\n內容：${content}\n時間：${timeStrFormatted}`;
  }

  if (action === '查詢' || action === 'list' || action === '列表') {
    const reminders = storageService.getReminders(userId);
    if (reminders.length === 0) {
      return '目前沒有待處理的提醒事項。';
    }

    let result = `您有 ${reminders.length} 個待處理的提醒事項：\n\n`;
    reminders.forEach((r, index) => {
      const timeStr = new Date(r.scheduledTime).toLocaleString('zh-TW');
      result += `${index + 1}. ${r.content}\n   時間：${timeStr}\n\n`;
    });
    return result.trim();
  }

  if (action === '刪除' || action === 'delete' || action === 'remove' || action === '取消') {
    const reminders = storageService.getReminders(userId);
    if (reminders.length === 0) {
      return '目前沒有待處理的提醒事項。';
    }

    if (args.length < 2) {
      return `請指定要刪除的提醒事項。\n例如：提醒 刪除 1 或 提醒 刪除 買菜\n\n目前有 ${reminders.length} 個提醒事項。`;
    }

    const deleteTarget = args.slice(1).join(' ').toLowerCase();
    
    // 嘗試解析為編號（第一個、第二個、1、2等）
    const numberMatch = deleteTarget.match(/(\d+)|(第一|第二|第三|第四|第五|第六|第七|第八|第九|第十)/);
    if (numberMatch) {
      let index = -1;
      if (numberMatch[1]) {
        index = parseInt(numberMatch[1]) - 1;
      } else if (numberMatch[2]) {
        const numberMap: { [key: string]: number } = {
          '第一': 0, '第二': 1, '第三': 2, '第四': 3, '第五': 4,
          '第六': 5, '第七': 6, '第八': 7, '第九': 8, '第十': 9
        };
        index = numberMap[numberMatch[2]] || -1;
      }
      
      if (index >= 0 && index < reminders.length) {
        const reminder = reminders[index];
        const success = storageService.deleteReminder(reminder.id, userId);
        return success ? `已刪除提醒事項：${reminder.content}` : '刪除失敗。';
      } else {
        return `找不到第 ${index + 1} 個提醒事項，目前只有 ${reminders.length} 個。`;
      }
    }

    // 嘗試用內容關鍵字匹配
    const matchingReminders = reminders.filter(r => 
      r.content.toLowerCase().includes(deleteTarget) || 
      deleteTarget.includes(r.content.toLowerCase())
    );

    if (matchingReminders.length === 0) {
      return `找不到包含「${args.slice(1).join(' ')}」的提醒事項。\n\n目前有 ${reminders.length} 個提醒事項，請使用編號或內容關鍵字刪除。`;
    }

    if (matchingReminders.length === 1) {
      const success = storageService.deleteReminder(matchingReminders[0].id, userId);
      return success ? `已刪除提醒事項：${matchingReminders[0].content}` : '刪除失敗。';
    }

    // 多個匹配，列出讓用戶選擇
    let result = `找到 ${matchingReminders.length} 個匹配的提醒事項：\n\n`;
    reminders.forEach((r, index) => {
      if (matchingReminders.some(mr => mr.id === r.id)) {
        const timeStr = new Date(r.scheduledTime).toLocaleString('zh-TW');
        result += `${index + 1}. ${r.content}\n   時間：${timeStr}\n\n`;
      }
    });
    result += '請使用編號來指定要刪除的項目，例如：提醒 刪除 1';
    return result.trim();
  }

  return '提醒事項指令：\n- 提醒 新增 [內容] [時間]\n- 提醒 查詢\n- 提醒 刪除 [編號或內容]\n\n或使用自然語言：\n- 提醒我明天買菜\n- 記得後天開會\n- 幫我記一下明天10點買菜\n- 提醒 刪除 1 或 提醒 刪除 買菜';
}

export function parseNaturalLanguageReminder(text: string): { content: string; time: string } | null {
  const lowerText = text.toLowerCase();
  
  // 檢測提醒相關關鍵字
  const reminderKeywords = ['提醒', '記得', '幫我記', '幫我提醒', '記一下', '記住', '別忘了'];
  const hasReminderKeyword = reminderKeywords.some(keyword => lowerText.includes(keyword));
  
  if (!hasReminderKeyword) {
    return null;
  }

  // 移除提醒關鍵字，取得實際內容
  let cleanText = text;
  for (const keyword of reminderKeywords) {
    cleanText = cleanText.replace(new RegExp(keyword, 'gi'), '').trim();
  }
  
  // 移除常見的連接詞
  cleanText = cleanText.replace(/^(我|你|要|一下|的|啊|喔|哦|呢|吧)/gi, '').trim();
  
  if (!cleanText) {
    return null;
  }

  // 嘗試提取時間和內容
  // 模式1: 時間在前，內容在後（如：明天買菜、10點開會、後天買菜）
  const timeFirstPatterns = [
    /^(明天|後天|大後天|今天)\s*(.*)$/i,
    /^(\d{1,2}:\d{2}|明天\s+\d{1,2}:\d{2}|後天\s+\d{1,2}:\d{2})\s*(.*)$/i,
    /^(\d+\s*小時後|\d+\s*分鐘後)\s*(.*)$/i,
    /^(\d{4}[-\/]\d{2}[-\/]\d{2}(?:\s+\d{1,2}:\d{2})?)\s*(.*)$/i,
  ];

  for (const pattern of timeFirstPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[2]) {
      return {
        content: match[2].trim(),
        time: match[1].trim()
      };
    }
  }

  // 模式2: 內容在前，時間在後（如：買菜明天、開會10點）
  const contentFirstPatterns = [
    /^(.+?)\s+(明天|後天|大後天|今天)$/i,
    /^(.+?)\s+(\d{1,2}:\d{2})$/i,
    /^(.+?)\s+(明天|後天)\s+(\d{1,2}:\d{2})$/i,
    /^(.+?)\s+(\d+\s*小時後|\d+\s*分鐘後)$/i,
    /^(.+?)\s+(\d{4}[-\/]\d{2}[-\/]\d{2}(?:\s+\d{1,2}:\d{2})?)$/i,
  ];

  for (const pattern of contentFirstPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1] && match[2]) {
      let time = match[2].trim();
      if (match[3]) {
        time = `${match[2]} ${match[3]}`;
      }
      return {
        content: match[1].trim(),
        time: time
      };
    }
  }

  // 模式3: 只有內容，預設為明天（如：提醒我買菜）
  if (cleanText && !cleanText.match(/\d|明天|後天|今天|小時|分鐘/)) {
    return {
      content: cleanText,
      time: '明天'
    };
  }

  // 模式4: 嘗試分離時間和內容（如：明天10點買菜）
  const complexPattern = /^(.+?)\s+(明天|後天|今天)?\s*(\d{1,2}:\d{2})?\s*(.+)$/i;
  const complexMatch = cleanText.match(complexPattern);
  if (complexMatch) {
    const parts = [];
    if (complexMatch[2]) parts.push(complexMatch[2]);
    if (complexMatch[3]) parts.push(complexMatch[3]);
    const time = parts.join(' ') || '明天';
    const content = complexMatch[4] || complexMatch[1];
    
    if (content) {
      return {
        content: content.trim(),
        time: time.trim()
      };
    }
  }

  // 如果無法解析，返回 null（讓 AI 處理）
  return null;
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

