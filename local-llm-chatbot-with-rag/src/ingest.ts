import 'dotenv/config';
import { OllamaEmbeddings } from '@langchain/ollama';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import fetch from 'node-fetch';

const filePath = process.env.PDF_FILE_PATH as string;

async function ingest() {
  const loader =  new PDFLoader(filePath);
  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments(rawDocs);

  const embeddings = new OllamaEmbeddings({
    model: 'bge-m3',
    baseUrl: process.env.OLLAMA_BASE_URL,
    fetch: fetch as any,
  });

  await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: 'annual-report',
  });

  console.log('done');
}

ingest();
