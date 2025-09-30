import 'dotenv/config';
import inquirer from 'inquirer';
import ora from 'ora';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableSequence, RunnableParallel, RunnableLambda } from '@langchain/core/runnables';
import { searchTool } from './tools/search.tool';
import { researcherPrompt } from './prompts/researcher.prompt';
import { writerPrompt } from './prompts/writer.prompt';
import { seoPrompt } from './prompts/seo.prompt';
import { editorPrompt } from './prompts/editor.prompt';
import { researcherParser } from './parsers/researcher.parser';
import { writerParser } from './parsers/writer.parser';
import { seoParser } from './parsers/seo.parser';
import { editorParser } from './parsers/editor.parser';

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
});

const llmWithTools = llm.bindTools([searchTool]);

const chain = RunnableSequence.from([
  RunnableLambda.from(async (input: string) => {
    const formatInstr = researcherParser.getFormatInstructions();
    const messages = await researcherPrompt.formatMessages({ input, format_instructions: formatInstr });
    const aiMessage = await llmWithTools.invoke(messages);
    messages.push(aiMessage);

    const toolCalls = aiMessage.tool_calls || [];
    if (toolCalls.length) {
      for (const toolCall of toolCalls) {
        const toolMessage = await searchTool.invoke(toolCall);
        messages.push(toolMessage);
      }
      const followup = await llmWithTools.invoke(messages);
      messages.push(followup);
    }

    const lastMessage = messages.slice(-1)[0].content as string;
    return researcherParser.parse(lastMessage);
  }),
  RunnableParallel.from({
    draft: RunnableLambda.from(async (input) => {
      return await writerPrompt
        .pipe(llm)
        .pipe(writerParser)
        .invoke({
          background: input.background,
          format_instructions: writerParser.getFormatInstructions(),
        });
    }),
    keywords: RunnableLambda.from(async (input) => {
      return await seoPrompt
        .pipe(llm)
        .pipe(seoParser)
        .invoke({
          background: input.background,
          format_instructions: seoParser.getFormatInstructions(),
        });
    }),
    references: RunnableLambda.from((input) => input.references),
  }),
  RunnableLambda.from(async (input) => {
    return await editorPrompt
      .pipe(llm)
      .pipe(editorParser)
      .invoke({
        data: JSON.stringify({
          title: input.draft.title,
          content: input.draft.content,
          keywords: input.keywords,
          references: input.references,
        }),
      });
  }),
]);

async function main() {
  console.log('=== Blog Writer 已啟動 ===');

  while (true) {
    const { topic } = await inquirer.prompt<{ topic: string }>([
      {
        type: 'input',
        name: 'topic',
        message: '請輸入文章主題:',
        filter: (v) => (v ?? '').trim(),
      },
    ]);

    if (!topic) break;

    const spinner = ora('正在產生內容, 請稍候...').start();
    try {
      const result = await chain.invoke(topic);
      spinner.succeed('完成!');
      console.log('\n=== 產出結果 ===\n');
      console.log(result);
      console.log('\n=================\n');
    } catch (err) {
      spinner.fail('發生錯誤:');
      console.error(err);
    }

    const { again } = await inquirer.prompt<{ again: boolean }>([
      {
        type: 'confirm',
        name: 'again',
        message: '要再產生一篇嗎?',
        default: false,
      },
    ]);

    if (!again) break;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
