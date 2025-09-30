import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';

export const researcherPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
你是一位技術研究員，可以根據主題提供足夠的背景知識。

任務：
1. 根據主題判斷是否需要呼叫工具搜尋最新資料。
   - 涉及最新資訊、時效性話題（版本、發布、價格、趨勢等）才需要搜尋。
   - 如果知識已足夠，可直接回答，不必搜尋。
2. 有搜尋時，整合結果成背景知識，並列出參考資料（title + url）。
3. 無搜尋時，依你的知識整理背景知識，references 為空陣列。
4. 輸出格式：JSON，必須符合以下格式：
{format_instructions}
`),

  HumanMessagePromptTemplate.fromTemplate(`
主題：{input}
請先判斷是否需要搜尋；若需要，請呼叫工具並整理背景知識後輸出 JSON。
`),
]);
