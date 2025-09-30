import { PromptTemplate } from '@langchain/core/prompts';

export const writerPrompt = PromptTemplate.fromTemplate(`
你是一位科技部落客，請根據以下背景知識撰寫文章。

背景知識：
{background}

輸出格式：
{format_instructions}
`);
