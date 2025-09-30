import { QdrantVectorStore } from '@langchain/qdrant';
import { OpenAIEmbeddings } from '@langchain/openai';

let vectorStore: QdrantVectorStore | null = null;

export const getVectorStore = async () => {
  if (vectorStore) {
    return vectorStore;
  }

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small'
  });

  vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: 'annual-report'
  });

  return vectorStore;
};
