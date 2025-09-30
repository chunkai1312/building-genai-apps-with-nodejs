import 'dotenv/config';
import inquirer from 'inquirer';
import ora from 'ora';
import { randomUUID } from 'crypto';
import { Command, INTERRUPT, isInterrupted, type Interrupt } from '@langchain/langgraph';
import { graph } from './agent/graph.js';
import { StateAnnotation } from './agent/state.js';

async function promptTopicInput() {
  const { topic } = await inquirer.prompt<{ topic: string }>([
    {
      type: 'input',
      name: 'topic',
      message: '請輸入文章主題:',
      filter: (value) => (value ?? '').trim(),
      validate: (value: string) => value.trim().length > 0 || '請輸入主題',
    },
  ]);

  return { messages: [{ role: 'user', content: topic }] };
}

async function promptSourceReview(payload: {
  topic: string;
  background: string;
  references: Array<{ title: string; url: string }>;
}) {
  console.log('\n=== 研究結果審核 ===');
  console.log(`主題: ${payload.topic}`);
  console.log('\n背景概要:\n');
  console.log(payload.background);

  if (payload.references?.length) {
    console.log('\n參考資料:');
    payload.references.forEach((ref, index) => {
      console.log(`  ${index + 1}. ${ref.title} - ${ref.url}`);
    });
  }

  const answers = await inquirer.prompt<{
    decision: 'approve' | 'reject';
    provideFeedback?: boolean;
    feedback?: string;
  }>([
    {
      type: 'list',
      name: 'decision',
      message: '請選擇審核結果:',
      choices: [
        { name: '批准內容，進入撰稿階段', value: 'approve' },
        { name: '退回內容，提供修正建議', value: 'reject' },
      ],
      default: 'approve',
    },
    {
      type: 'input',
      name: 'feedback',
      message: '請輸入需要補充或修正的說明:',
      when: (prev) => prev.decision !== 'approve',
      filter: (value: string) => value.trim(),
      validate: (value: string) => value.trim().length > 0 || '請提供說明內容',
    },
  ]);

  return {
    isApproved: answers.decision === 'approve',
    ...(answers.feedback ? { feedback: answers.feedback } : {}),
  };
}

async function promptArticleReview(payload: { draft: string }) {
  console.log('\n=== 文章初稿 ===\n');
  console.log(payload.draft);

  const answers = await inquirer.prompt<{
    decision: 'approve' | 'revise';
    feedback?: string;
  }>([
    {
      type: 'list',
      name: 'decision',
      message: '請選擇後續動作:',
      choices: [
        { name: '接受內容，輸出完整文章', value: 'approve' },
        { name: '重新編輯，提出修改建議', value: 'revise' },
      ],
      default: 'approve',
    },
    {
      type: 'input',
      name: 'feedback',
      message: '請輸入修改建議:',
      when: (prev) => prev.decision !== 'approve',
      filter: (value: string) => value.trim(),
      validate: (value: string) => value.trim().length > 0 || '請提供具體建議',
    },
  ]);

  return {
    isApproved: answers.decision === 'approve',
    ...(answers.feedback ? { feedback: answers.feedback } : {}),
  };
}

async function resolveInterrupt(interrupt: Interrupt): Promise<unknown> {
  const { type, payload } = interrupt.value;
  switch (type) {
    case 'source_review': return promptSourceReview(payload); 
    case 'article_revision': return promptArticleReview(payload);
    default: throw new Error('unknown interrupt type');
  }
}

async function main() {
  const spinner = ora();
  const threadConfig = { configurable: { thread_id: randomUUID() } };
  let finalState: typeof StateAnnotation.State;
  let nextInput;

  console.log(`=== ${graph.name} 已啟動 ===`);
  nextInput = await promptTopicInput();

  try {
    while (true) {
      spinner.start('處理中, 請稍候...');
      const result = await graph.invoke(nextInput, threadConfig);

      if (isInterrupted(result)) {
        spinner.stop();
        const interrupts = result[INTERRUPT] ?? [];
        const resume = await resolveInterrupt(interrupts[0]);
        nextInput = new Command({ resume });
        continue;
      }

      finalState = result;
      break;
    }

    spinner.succeed('完成！');
  } catch (error) {
    spinner.fail('發生錯誤:');
    throw error;
  }

  console.log('\n=== 文章內容 ===\n');
  console.log(finalState.article);
  process.exit(0);
}

main().catch(console.error);
