import { StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { StateAnnotation } from './state.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';

const client = new MultiServerMCPClient({
  mcpServers: {
    'calculator': {
      url: MCP_SERVER_URL,
      transport: 'http',
    }
  }
});
const tools = await client.getTools();
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

graph.name = 'Calculator Agent';
