import 'dotenv/config';
import readline from 'readline';
import yargs, { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { OpenAI } from 'openai';
import { roles } from './prompts';
import { tools, toolFunctions } from './tools';

interface Argv {
  role: keyof typeof roles;
  temperature: number;
  top_p: number;
}

const argv = yargs(hideBin(process.argv))
  .option('role', {
    alias: 'r',
    type: 'string',
    choices: Object.keys(roles) as (keyof typeof roles)[],
    default: 'default',
    description: '指定助理角色',
  })
  .option('temperature', {
    alias: 't',
    type: 'number',
    description: '控制模型的創造力 (0 ~ 2)',
    default: 1,
  })
  .option('top_p', {
    alias: 'tp',
    type: 'number',
    description: '限制模型的選詞範圍 (0 ~ 1)',
    default: 1,
  })
  .help()
  .parseSync();

async function main(argv: Arguments<Argv>) {
  const openai = new OpenAI();
  const messages = [...roles[argv.role]];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('GPT Chatbot 已啟動，輸入訊息開始對話（按 Ctrl+C 離開）。\n');
  rl.setPrompt('> ');
  rl.prompt();

  rl.on('line', async (input) => {
    messages.push({ role: 'user', content: input });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
      });
      const message = response.choices[0].message;

      if (message.tool_calls) {
        const toolCall = message.tool_calls[0];
        const fn = toolFunctions[toolCall.function.name];
        const args = JSON.parse(toolCall.function.arguments);
        const result = await fn(args);

        messages.push(message);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        stream: true,
        temperature: argv.temperature,
        top_p: argv.top_p,
        messages,
      });

      let reply = '';

      process.stdout.write('\n');
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content);
        reply += content;
      }
      process.stdout.write('\n\n');

      messages.push({ role: 'assistant', content: reply });
    } catch (err) {
      console.error(err);
    }

    rl.prompt();
  });
}

main(argv);
