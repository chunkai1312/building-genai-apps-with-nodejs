import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  const client = new Client({ name: 'calculator-mcp-client', version: '1.0.0' });
  await client.connect(transport);
  console.log('Connected to MCP server at', MCP_SERVER_URL);

  const tools = await client.listTools();
  console.log('Available tools:', tools.tools.map((t) => t.name));

  console.log('Running Calculations:');
  const add = await client.callTool({ name: 'add', arguments: { a: 12, b: 8 } });
  const sub = await client.callTool({ name: 'subtract', arguments: { a: 10, b: 4 } });
  const mul = await client.callTool({ name: 'multiply', arguments: { a: 6, b: 7 } });
  const div = await client.callTool({ name: 'divide', arguments: { a: 20, b: 4 } });

  const getText = (r: any) => r.content?.[0]?.text ?? JSON.stringify(r);
  console.log('12 + 8 =', getText(add));
  console.log('10 - 4 =', getText(sub));
  console.log('6 × 7  =', getText(mul));
  console.log('20 ÷ 4 =', getText(div));

  await client.close();
  transport.close();
  console.log('Disconnected from MCP server');
}

main();
