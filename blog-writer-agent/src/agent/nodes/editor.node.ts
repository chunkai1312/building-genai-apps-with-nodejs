import { ChatOpenAI } from '@langchain/openai';
import { HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { StateAnnotation } from '../state.js';

export async function editorNode(state: typeof StateAnnotation.State) {
  const { messages, title, content, keywords, references, draft, revised } = state;

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
  });
  
  if (!draft) {
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
你是一位專業編輯，請根據以下資訊撰寫一篇完整的文章，並輸出為 **Markdown 格式**。

要求: 
- 文章必須包含：標題、引言、主體（可用小標題分段）、結論。
- 適度融入提供的 SEO 關鍵字，但不要過度堆疊。
- 使用 Markdown 格式（# 標題、## 小標題、段落、列表）。
- 文風要流暢、自然，適合一般讀者閱讀。
- 若有參考資料，請在文末附上「參考資料」區塊。
- 請在文章最後新增一行，以 #hashtag 形式列出提供的 SEO 關鍵字。

{data}
    `);
    const systemMessage = await systemPrompt.format({
      data: JSON.stringify({ title, content, keywords, references }),
    });
    messages.push(systemMessage);
  } else {
    const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(`
你是一位專業編輯，請根據以下用戶建議修改文章，並輸出為 **Markdown 格式**。

要求: 
- 務必依照「使用者建議」進行調整。
- 在保留文章原有結構的基礎上，改善內容與表達。
- 若需要補充，請保持一致的語氣與風格。
- 確保仍包含標題、引言、主體、結論，並維持清晰結構。
- 請在文章最後新增一行，以 #hashtag 形式列出提供的 SEO 關鍵字。

使用者建議: {feedback}

{draft}
    `);
    const humanMessage = await humanMessagePrompt.format({
      draft,
      feedback: revised.feedback,
    })
    messages.push(humanMessage);
  }

  const parser = new StringOutputParser();
  const result = await llm.pipe(parser).invoke(messages);

  return {
    messages,
    draft: result,
  };
}
