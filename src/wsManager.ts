import WebSocket from 'ws';
import { OrderUpdateEvent } from './types';

interface Client {
  id: string;
  socket: WebSocket;
}

interface WsMessage<T = unknown> {
  event: string;
  payload: T;
}

const clients = new Map<string, Client>();

export const WsManager = {
  add(id: string, socket: WebSocket) {
    clients.set(id, { id, socket });
  },
  
  remove(id: string) {
    clients.delete(id);
  },
  
  getConnectionCount(): number {
    return clients.size;
  },

  broadcast(event: string, payload: OrderUpdateEvent) {
    const msg = JSON.stringify({ event, payload } satisfies WsMessage<OrderUpdateEvent>);
    for (const c of clients.values()) {
      try {
        c.socket.send(msg);
      } catch (err) {
        // ignore per-client failures
        console.warn(`Failed to send to client ${c.id}:`, err instanceof Error ? err.message : String(err));
      }
    }
  }
};
