import { PromptTemplate } from '@langchain/core/prompts';

export const seoPrompt = PromptTemplate.fromTemplate(`
根據以下背景知識，產出 5–10 組 SEO 關鍵字。

背景知識：
{background}

輸出格式：
{format_instructions}
`);
