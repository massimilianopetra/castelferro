export const dynamic = 'force-dynamic';

if (!global._sseClients) global._sseClients = new Set();
const clients = global._sseClients;

const encoder = new TextEncoder();

export function broadcastNextClient(numero) {
  const message = encoder.encode(`data: ${JSON.stringify({ numero })}\n\n`);
  for (const controller of clients) {
    try {
      controller.enqueue(message);
    } catch {
      clients.delete(controller);
    }
  }
}

export async function GET() {
  let controller;
  let heartbeatId;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
      clients.add(c);
      c.enqueue(encoder.encode(': connected\n\n'));

      heartbeatId = setInterval(() => {
        try {
          c.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeatId);
          clients.delete(c);
        }
      }, 30000);
    },
    cancel() {
      clearInterval(heartbeatId);
      clients.delete(controller);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
