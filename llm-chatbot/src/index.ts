import 'dotenv/config';
import readline from 'readline';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

async function main() {
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
  });

  const messages: BaseMessage[] = [
    new SystemMessage('你是一個樂於助人的 AI 助理。'),
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('LLM Chatbot 已啟動，輸入訊息開始對話（按 Ctrl+C 離開）。\n');
  rl.setPrompt('> ');
  rl.prompt();

  rl.on('line', async (input) => {
    messages.push(new HumanMessage(input));

    try {
      const stream = await llm.stream(messages);

      let aiMessage = '';

      process.stdout.write('\n');
      for await (const chunk of stream) {
        const content = chunk?.content ?? '';
        process.stdout.write(content.toString());
        aiMessage += content;
      }
      process.stdout.write('\n\n');

      messages.push(new AIMessage(aiMessage));
    } catch (err) {
      console.error(err);
    }

    rl.prompt();
  });
}

main();
