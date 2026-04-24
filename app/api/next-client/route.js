import { broadcastNextClient } from '../queue/route';

export async function POST(request) {
  const { numero } = await request.json();
  broadcastNextClient(numero);
  return Response.json({ success: true });
}
