import { QdrantVectorStore } from '@langchain/qdrant';
import { OllamaEmbeddings } from '@langchain/ollama';
import fetch from 'node-fetch';

let vectorStore: QdrantVectorStore | null = null;

export const getVectorStore = async () => {
  if (vectorStore) {
    return vectorStore;
  }

  const embeddings = new OllamaEmbeddings({
    model: 'bge-m3',
    baseUrl: process.env.OLLAMA_BASE_URL,
    fetch: fetch as any,
  });

  vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: 'annual-report'
  });

  return vectorStore;
};
