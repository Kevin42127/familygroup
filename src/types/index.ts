export interface Conversation {
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export interface Reminder {
  id: string;
  userId: string;
  content: string;
  scheduledTime: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
}

export interface Schedule {
  id: string;
  userId: string;
  title: string;
  date: number;
  participants: string[];
  createdAt: number;
}

