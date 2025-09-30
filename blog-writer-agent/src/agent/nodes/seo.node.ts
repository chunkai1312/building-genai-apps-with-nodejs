import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { CommaSeparatedListOutputParser } from '@langchain/core/output_parsers';
import { StateAnnotation } from '../state.js';

export async function seoNode(state: typeof StateAnnotation.State) {
  const { topic, background } = state;

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
  });

  const prompt = PromptTemplate.fromTemplate(`
你是一位 SEO 專家。請根據以下主題與背景知識，產出 **5–10 組適合搜尋優化的關鍵字**。  

要求:
- 關鍵字需與主題高度相關。  
- 請同時包含「短尾關鍵字」與「長尾關鍵字」。  
- 避免過度泛用或模糊的詞彙（例如：科技、新聞、文章）。  
- 僅輸出關鍵字清單，使用逗號分隔，不要多餘文字。  

主題: {topic}  
背景資訊: {background}  

{format_instructions}
  `);

  const parser = new CommaSeparatedListOutputParser();

  const result = prompt.pipe(llm).pipe(parser).invoke({
    topic,
    background,
    format_instructions: parser.getFormatInstructions(),
  });

  return {
    keywords: result,
  };
}
