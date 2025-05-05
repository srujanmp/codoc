import Pusher from "pusher";
import { env } from "~/env";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class PusherServer {
  private static instance: Pusher | null = null;
  
  private static createInstance(): Pusher {
    return new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
      timeout: 15000,
    });
  }

  static getInstance(): Pusher {
    if (!this.instance) {
      this.instance = this.createInstance();
    }
    return this.instance;
  }

  static async triggerWithRetry(
    channel: string,
    event: string,
    data: unknown,
    socketId?: string
  ) {
    let lastError: Error | null = null;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const pusher = this.getInstance();
        await pusher.trigger(channel, event, data, { socket_id: socketId });
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`Pusher trigger attempt ${i + 1} failed:`, error);
        
        if (i < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          this.instance = null; // Reset instance for retry
        }
      }
    }
    
    throw new Error(`Failed to trigger Pusher event after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  }
}

export default PusherServer;
