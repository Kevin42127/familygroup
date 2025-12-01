export async function searchWeb(query: string): Promise<string> {
  try {
    // 提供搜尋連結，讓用戶自行查詢
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return `根據您的搜尋：「${query}」\n\n建議您直接使用搜尋引擎查詢：\n${searchUrl}\n\n我會盡力根據我的知識庫提供相關資訊，但請注意資訊可能不是最新的。`;
  } catch (error) {
    console.error('Error in searchWeb:', error);
    return '搜尋功能暫時無法使用，請稍後再試。';
  }
}

