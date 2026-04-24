if (!global._sseClients) global._sseClients = new Set();
export const clients = global._sseClients;

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

export { encoder };
