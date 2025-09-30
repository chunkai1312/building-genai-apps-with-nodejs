import { PromptTemplate } from '@langchain/core/prompts';

export const editorPrompt = PromptTemplate.fromTemplate(`
根據提供資訊 {data}，輸出 Markdown 格式的文章。
`);
