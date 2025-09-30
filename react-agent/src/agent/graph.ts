import { StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { TavilySearch } from '@langchain/tavily';
import { StateAnnotation } from './state.js';

const tools = [new TavilySearch({ maxResults: 3 })];
const toolNode = new ToolNode(tools);

const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
}).bindTools(tools);

function shouldContinue({ messages }: typeof StateAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls?.length) {
    return 'tools';
  }
  return END;
}

async function callModel(state: typeof StateAnnotation.State) {
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

const builder = new StateGraph(StateAnnotation)
  .addNode('agent', callModel)
  .addEdge(START, 'agent')
  .addNode('tools', toolNode)
  .addEdge('tools', 'agent')
  .addConditionalEdges('agent', shouldContinue);

export const graph = builder.compile();

graph.name = 'ReAct Agent';
