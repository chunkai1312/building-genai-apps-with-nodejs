import { createRetrieverTool } from 'langchain/tools/retriever';
import { getVectorStore } from '../vectorstores/qdrant.vectorstore';

export const getRetrieverTool = async () => {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever(3);

  return createRetrieverTool(retriever, {
    name: "annual-report-retriever",
    description: "檢索公司年報內容，提供與查詢問題最相關的內容片段",
  });
};
