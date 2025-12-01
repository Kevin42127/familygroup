import { storageService } from '../services/storageService';

export function handleScheduleCommand(userId: string, command: string, args: string[]): string {
  const action = args[0]?.toLowerCase();

  if (action === '新增' || action === 'add' || action === '建立') {
    if (args.length < 3) {
      return '行程格式：行程 新增 [標題] [日期時間] [參與者...]\n例如：行程 新增 家庭聚餐 2024-01-15 18:00 爸爸 媽媽';
    }

    const title = args[1];
    const dateStr = args[2];
    const participants = args.slice(3) || [];

    const date = parseDate(dateStr);
    if (!date) {
      return '日期格式錯誤，請使用：YYYY-MM-DD HH:mm';
    }

    const schedule = storageService.createSchedule(userId, title, date, participants);
    const dateStrFormatted = new Date(date).toLocaleString('zh-TW');
    let result = `已建立行程：\n標題：${title}\n時間：${dateStrFormatted}`;
    if (participants.length > 0) {
      result += `\n參與者：${participants.join('、')}`;
    }
    result += `\nID：${schedule.id}`;
    return result;
  }

  if (action === '查詢' || action === 'list' || action === '列表') {
    const now = Date.now();
    const startDate = args[1] ? parseDate(args[1]) : now;
    const endDate = args[2] ? parseDate(args[2]) : undefined;

    const schedules = storageService.getSchedules(userId, startDate || undefined, endDate || undefined);
    if (schedules.length === 0) {
      return '目前沒有行程。';
    }

    let result = `您有 ${schedules.length} 個行程：\n\n`;
    schedules.forEach((s, index) => {
      const dateStr = new Date(s.date).toLocaleString('zh-TW');
      result += `${index + 1}. ${s.title}\n   時間：${dateStr}`;
      if (s.participants.length > 0) {
        result += `\n   參與者：${s.participants.join('、')}`;
      }
      result += `\n   ID：${s.id}\n\n`;
    });
    return result.trim();
  }

  return '行程指令：\n- 行程 新增 [標題] [日期時間] [參與者...]\n- 行程 查詢 [開始日期] [結束日期]';
}

function parseDate(dateStr: string): number | null {
  if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.getTime();
  }

  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(dateStr + ' 00:00');
    return isNaN(date.getTime()) ? null : date.getTime();
  }

  return null;
}

