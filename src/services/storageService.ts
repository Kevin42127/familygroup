import { Conversation, Reminder, Schedule } from '../types';

class StorageService {
  private conversations: Map<string, Conversation> = new Map();
  private reminders: Map<string, Reminder> = new Map();
  private schedules: Map<string, Schedule> = new Map();

  getConversation(userId: string): Conversation | undefined {
    return this.conversations.get(userId);
  }

  createOrUpdateConversation(userId: string, message: { role: 'user' | 'assistant'; content: string }): void {
    const conversation = this.conversations.get(userId) || {
      userId,
      messages: []
    };

    conversation.messages.push({
      ...message,
      timestamp: Date.now()
    });

    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20);
    }

    this.conversations.set(userId, conversation);
  }

  getReminders(userId: string): Reminder[] {
    return Array.from(this.reminders.values())
      .filter(r => r.userId === userId && r.status === 'pending')
      .sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  createReminder(userId: string, content: string, scheduledTime: number): Reminder {
    const reminder: Reminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      content,
      scheduledTime,
      status: 'pending',
      createdAt: Date.now()
    };

    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  deleteReminder(id: string, userId: string): boolean {
    const reminder = this.reminders.get(id);
    if (reminder && reminder.userId === userId) {
      this.reminders.delete(id);
      return true;
    }
    return false;
  }

  clearUserData(userId: string): void {
    this.conversations.delete(userId);
    const userReminders = Array.from(this.reminders.entries())
      .filter(([_, reminder]) => reminder.userId === userId)
      .map(([id]) => id);
    userReminders.forEach(id => this.reminders.delete(id));
    const userSchedules = Array.from(this.schedules.entries())
      .filter(([_, schedule]) => schedule.userId === userId)
      .map(([id]) => id);
    userSchedules.forEach(id => this.schedules.delete(id));
  }

  getSchedules(userId: string, startDate?: number, endDate?: number): Schedule[] {
    let schedules = Array.from(this.schedules.values())
      .filter(s => s.userId === userId);

    if (startDate) {
      schedules = schedules.filter(s => s.date >= startDate);
    }
    if (endDate) {
      schedules = schedules.filter(s => s.date <= endDate);
    }

    return schedules.sort((a, b) => a.date - b.date);
  }

  createSchedule(userId: string, title: string, date: number, participants: string[]): Schedule {
    const schedule: Schedule = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      date,
      participants,
      createdAt: Date.now()
    };

    this.schedules.set(schedule.id, schedule);
    return schedule;
  }
}

export const storageService = new StorageService();

