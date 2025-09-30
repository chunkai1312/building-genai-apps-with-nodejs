import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import z from 'zod';
import { StateAnnotation } from '../state.js';

export async function writerNode(state: typeof StateAnnotation.State) {
  const { topic, background } = state;

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
  });

  const prompt = PromptTemplate.fromTemplate(`
你是一位專業部落格寫手，請根據以下主題與背景知識撰寫一篇文章。  

要求：  
- 文章必須有清晰的結構（引言、主體、結論）。  
- 內容需至少 800 字，條理分明，避免只有單一大段文字。  
- 風格要流暢、具吸引力，讓一般讀者容易理解。  
- 標題要簡潔、吸睛，並能反映主題核心。  
- 適度使用小標題或段落分隔，提升可讀性。  

主題: {topic}  
背景資訊: {background}  

{format_instructions}
  `);

  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      title: z.string(),
      content: z.string(),
    }),
  );

  const result = await prompt.pipe(llm).pipe(parser).invoke({
    topic,
    background,
    format_instructions: parser.getFormatInstructions(),
  });
    
  return {
    title: result.title,
    content: result.content,
  };
}
