import { chatWithAI } from '../services/groqService';

export async function handleMessage(userId: string, text: string): Promise<string> {
  const trimmedText = text.trim();
  return await chatWithAI(userId, trimmedText);
}

