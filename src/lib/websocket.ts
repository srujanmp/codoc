import Pusher from "pusher-js";
import { env } from "~/env";

export interface WebSocketMessage { // <-- add export here
  type: string;
  content?: string;
  documentId: string;
  userId?: string;
}

export interface WebSocketService {
  connect: (documentId: string, userId: string) => void;
  disconnect: () => void;
  send: (message: WebSocketMessage) => void;
  onMessage: (callback: (data: WebSocketMessage) => void) => void;
}

export class PusherService implements WebSocketService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private messageCallback: ((data: WebSocketMessage) => void) | null = null;
  private documentId: string = "";

  connect(documentId: string, userId: string) {
    if (!documentId || !userId) return;

    this.documentId = documentId;

    try {
      this.pusher = new Pusher(env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
        forceTLS: true
      });

      const channelName = `presence-document-${documentId}`;
      this.channel = this.pusher.subscribe(channelName);

      this.channel.bind('content-update', (data: WebSocketMessage) => {
        if (data.userId !== userId && this.messageCallback) {
          this.messageCallback(data);
        }
      });
    } catch (error) {
      console.error('Pusher connection error:', error);
    }
  }

  disconnect() {
    try {
      if (this.channel && this.documentId) {
        this.channel.unbind_all();
        const channelName = `presence-document-${this.documentId}`;
        this.pusher?.unsubscribe(channelName);
      }
      this.pusher?.disconnect();
    } catch (error) {
      console.error('Pusher disconnection error:', error);
    } finally {
      this.reset();
    }
  }

  send(message: WebSocketMessage) {
    fetch("/api/pusher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...message,
        event: 'content-update',
        channel: `document-${this.documentId}`
      }),
    }).catch(console.error);
  }

  onMessage(callback: (data: WebSocketMessage) => void) {
    this.messageCallback = callback;
  }

  private reset() {
    this.pusher = null;
    this.channel = null;
    this.documentId = "";
    this.messageCallback = null;
  }
}

// Simplified factory function that only returns Pusher service
export function createWebSocketService(): WebSocketService {
  return new PusherService();
}
