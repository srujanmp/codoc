import { NextRequest } from "next/server";
import Pusher from "pusher";
import { env } from "~/env";
import { auth } from "~/server/auth";

const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { channel, event, ...data } = body;

  await pusher.trigger(channel, event, {
    ...data,
    timestamp: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
