/**
 * SSE broadcaster for real-time updates
 */
import type { SSEEvent } from '../shared/types.js';

const clients = new Set<(data: string) => void>();

export function addClient(send: (data: string) => void): () => void {
  clients.add(send);
  return () => clients.delete(send);
}

export function broadcast(event: SSEEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const send of clients) {
    try { send(data); } catch { clients.delete(send); }
  }
}

export function getClientCount(): number {
  return clients.size;
}
