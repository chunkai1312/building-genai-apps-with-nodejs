import { TavilySearch } from '@langchain/tavily';

export const searchTool = new TavilySearch({
  tavilyApiKey: process.env.TAVILY_API_KEY,
  maxResults: 5,
  topic: 'general',
  includeAnswer: true,
  includeRawContent: true
});
