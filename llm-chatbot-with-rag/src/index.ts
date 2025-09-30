
import 'dotenv/config';
import readline from 'readline';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getRetrieverTool } from './tools/retriever.tool';

async function main() {
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
  });

  const retrievalTool = await getRetrieverTool();

  const llmWithTools = llm.bindTools([retrievalTool]);

  const messages: BaseMessage[] = [
    new SystemMessage('你是一個樂於助人的 AI 助理。'),
  ];

  const toolsByName: Record<string, any> = {
    [retrievalTool.name]: retrievalTool,
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('LLM Chatbot 已啟動，輸入訊息開始對話（按 Ctrl+C 離開）。\n');
  rl.setPrompt('> ');
  rl.prompt();

  rl.on('line', async (input) => {
    try {
      const humanMessage = new HumanMessage(input);
      messages.push(humanMessage);

      const aiMessage = await llmWithTools.invoke(messages);
      messages.push(aiMessage);

      const toolCalls = aiMessage.tool_calls || [];
      if (toolCalls.length) {
        for (const toolCall of toolCalls) {
          const selectedTool = toolsByName[toolCall.name];
          const toolMessage = await selectedTool.invoke(toolCall);
          messages.push(toolMessage);
        }
        const followup = await llmWithTools.invoke(messages);
        messages.push(followup);
      }

      const lastMessage = messages.slice(-1)[0];
      console.log(`${lastMessage.content}\n`);
    } catch (err) {
      console.error(err);
    }

    rl.prompt();
  });
}

main();
