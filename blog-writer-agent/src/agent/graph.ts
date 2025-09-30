import { StateGraph, MemorySaver, START, END } from '@langchain/langgraph';
import { StateAnnotation } from './state.js';
import { researcherNode } from './nodes/researcher.node.js';
import { sourceReviewNode } from './nodes/source-review.node.js';
import { writerNode } from './nodes/writer.node.js';
import { seoNode } from './nodes/seo.node.js';
import { editorNode } from './nodes/editor.node.js';
import { articleRevisionNode } from './nodes/article-revision.node.js';

const builder = new StateGraph(StateAnnotation)
  .addNode('researcher', researcherNode)
  .addNode('source_review', sourceReviewNode, { ends: ['researcher', 'writer', 'seo'] })
  .addNode('writer', writerNode, { ends: ['editor'] })
  .addNode('seo', seoNode, { ends: ['editor'] })
  .addNode('editor', editorNode)
  .addNode('article_revision', articleRevisionNode, { ends: ['editor', END] })
  .addEdge(START, 'researcher')
  .addEdge('researcher', 'source_review')
  .addEdge('writer', 'editor')
  .addEdge('seo', 'editor')
  .addEdge('editor', 'article_revision')
  .addEdge('article_revision', END);

export const graph = builder.compile({
  checkpointer: new MemorySaver(),
});

graph.name = 'Blog Writter Agent';
