import { NextRequest } from "next/server";
import { auth } from "~/server/auth";
import PusherServer from "~/lib/pusher-server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { socket_id, channel_name } = body;

    // Validate Pusher specific format
    if (!socket_id?.match(/^\d+\.\d+$/) || !channel_name?.match(/^(private|presence)-[a-zA-Z0-9-_=@,.;]+$/)) {
      return new Response("Invalid socket_id or channel_name format", { status: 400 });
    }

    const presenceData = {
      user_id: session.user.id,
      user_info: {
        name: session.user.name || "Anonymous",
        email: session.user.email,
      },
    };

    const pusher = PusherServer.getInstance();
    let authResponse;

    try {
      if (channel_name.startsWith("presence-")) {
        authResponse = pusher.authenticate(socket_id, channel_name, presenceData);
      } else if (channel_name.startsWith("private-")) {
        authResponse = pusher.authenticate(socket_id, channel_name);
      } else {
        return new Response("Invalid channel type", { status: 400 });
      }

      return new Response(JSON.stringify(authResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Pusher authentication error:", error);
      return new Response("Authentication failed", { status: 500 });
    }
  } catch (error) {
    console.error("Route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
