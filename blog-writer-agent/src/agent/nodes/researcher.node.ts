import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import z from 'zod';
import { StateAnnotation } from '../state.js';

export async function researcherNode(state: typeof StateAnnotation.State) {
  const { messages, topic, background, references, reviewed } = state;

  const client = new MultiServerMCPClient({
    mcpServers: {
      tavily: {
        url: `https://mcp.tavily.com/mcp/?tavilyApiKey=${process.env.TAVILY_API_KEY}`,
        transport: 'http',
      },
    },
  });
  const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  const tools = await client.getTools();
  const researcherAgent = createReactAgent({ llm, tools });

  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      topic: z.string(),
      background: z.string(),
      references: z.array(
        z.object({
          title: z.string(),
          url: z.string().url()
        })
      ),
    }),
  );

  const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
你是一位專業研究員，負責根據使用者提供的主題進行調查與整理。  
請務必透過可用的搜尋工具獲取最新、可靠且相關的資訊，並用以補充背景知識。  

請注意:
- 優先檢索最新資料，避免僅依靠舊知識。
- 背景說明需詳盡（至少 1000 字），提供足夠脈絡讓讀者快速理解主題。
- 引用資訊時，請提供清楚的來源與連結（references），確保可追溯性與可信度。
- 如果搜尋結果中包含相互矛盾的觀點，請明確指出並比較。
- 若相關資訊不足，也要誠實說明並提出可能的研究方向。

{format_instructions}
  `);
  const systemMessage = await systemPrompt.format({
    format_instructions: parser.getFormatInstructions(),
  });

  if (background && topic && reviewed.feedback) {
    const humanPrompt = HumanMessagePromptTemplate.fromTemplate(`
主題: {topic}
背景資訊: {background}
參考資料: {references}
使用者建議: {feedback}

請務必依據上述建議調整研究方向，必要時更新主題描述、背景內容以及參考資料。

{format_instructions}
    `);
    const humanMessage = await humanPrompt.format({
      topic,
      background,
      references,
      feedback: reviewed.feedback,
      format_instructions: parser.getFormatInstructions(),
    });
    messages.push(humanMessage);
  }

  const result = await researcherAgent.invoke({
    messages: [ systemMessage, ...messages ],
  });
  const lastMessage = result.messages[result.messages.length - 1];
  const parsedMessage = await parser.parse(lastMessage.content as string);

  return {
    messages,
    topic: parsedMessage.topic,
    background: parsedMessage.background,
    references: parsedMessage.references,
  };
}
