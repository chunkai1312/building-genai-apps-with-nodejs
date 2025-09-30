import type { ChatCompletionTool } from 'openai/resources';

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getCurrentTime',
      description: '取得指定時區的當前時間',
      parameters: {
        type: 'object',
        properties: {
          timeZone: {
            type: 'string',
            description: 'IANA 時區名稱，例如 Asia/Taipei, America/New_York',
          },
        },
        required: ['timeZone'],
      },
    },
  },
];

export const toolFunctions: Record<string, any> = {
  getCurrentTime: async ({ timeZone }: { timeZone: string }) => {
    const date = new Date();
    return date.toLocaleString('zh-TW', { timeZone });
  },
};
