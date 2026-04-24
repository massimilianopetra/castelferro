import { clients, encoder } from './broadcast';

export const dynamic = 'force-dynamic';

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
