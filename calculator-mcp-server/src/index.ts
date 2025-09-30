import express from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        transports[sessionId] = transport;
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = new McpServer({
      name: 'calculator-mcp-server',
      version: '1.0.0',
    });

    const asText = (text: string) => {
      return { content: [{ type: 'text' as const, text }] }
    };

    server.registerTool(
      'add',
      { title: 'Addition', description: 'Add two numbers', inputSchema: { a: z.number(), b: z.number() } },
      async ({ a, b }) => asText(String(a + b))
    );

    server.registerTool(
      'subtract',
      { title: 'Subtraction', description: 'Subtract b from a', inputSchema: { a: z.number(), b: z.number() } },
      async ({ a, b }) => asText(String(a - b))
    );

    server.registerTool(
      'multiply',
      { title: 'Multiplication', description: 'Multiply two numbers', inputSchema: { a: z.number(), b: z.number() } },
      async ({ a, b }) => asText(String(a * b))
    );

    server.registerTool(
      'divide',
      { title: 'Division', description: 'Divide a by b', inputSchema: { a: z.number(), b: z.number() } },
      async ({ a, b }) => {
        if (b === 0) return { ...asText('Error: Division by zero'), isError: true as const };
        return asText(String(a / b));
      }
    );

    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);

app.listen(PORT, () => {
  console.log(`[calculator-mcp-server] listening on port ${PORT}`);
});
