import { type } from "arktype";
import type { BunRequest, Server } from "bun";
import { nanoid } from "nanoid";

const User = type({
  name: "string",
});

const Room = type({
  users: "string[]",
});

const MessageEvent = type({
  type: "'message'",
  content: "string",
});
const SysJoinEvent = type({
  type: "'sys_join'",
  userId: "string",
  users: User.array(),
});
const SysLeaveEvent = type({
  type: "'sys_leave'",
  userId: "string",
  users: User.array(),
});
const Event = type.or(MessageEvent, SysJoinEvent, SysLeaveEvent);

const toEvent = <T extends typeof Event.infer>(data: T): T => {
  const v = Event(data);
  if (v instanceof type.errors) {
    throw new Error("Invalid event");
  }
  return v as T;
};

const users = new Map<string, typeof User.infer>();
const sessions = new Map<string, string>();
const rooms = new Map<string, typeof Room.infer>();

const getUserFromReq = (req: BunRequest) => {
  const sessionId = req.cookies.get("session");
  if (!sessionId) return { id: null, user: null };

  const userId = sessions.get(sessionId);
  if (!userId) return { id: null, user: null };

  const user = users.get(userId);
  if (!user) return { id: null, user: null };

  return { id: userId, user };
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const server = Bun.serve({
  // fetch(req, server) {
  //   const url = new URL(req.url);
  //   if (url.pathname === "/chat") {
  //     console.log(`upgrade!`);
  //     const username = getUsernameFromReq(req);
  //     const success = server.upgrade(req, { data: { username } });
  //     return success
  //       ? undefined
  //       : new Response("WebSocket upgrade error", { status: 400 });
  //   }

  //   return new Response("Hello world");
  // },
  routes: {
    "/user": {
      async POST(req) {
        const body = await req.json();
        const result = User(body);
        if (result instanceof type.errors) {
          return new Response("Invalid user", { status: 400 });
        }

        const userId = nanoid();
        users.set(userId, result);

        const sessionId = crypto.randomUUID();
        sessions.set(sessionId, userId);
        req.cookies.set("session", sessionId, { httpOnly: true, path: "/" });

        return new Response(JSON.stringify({ userId }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      },
      async PATCH(req) {
        const { id, user } = getUserFromReq(req);
        if (!user) {
          return new Response("Unauthorized - create a user first", {
            status: 401,
          });
        }

        const body = await req.json();
        const result = User.partial()(body);
        if (result instanceof type.errors) {
          return new Response("Invalid user", { status: 400 });
        }
        users.set(id, { ...user, ...result });

        return new Response(JSON.stringify({ userId: id }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      },
    },
    "/room/new": {
      async POST(req) {
        const { id } = getUserFromReq(req);
        if (!id) {
          return new Response("Unauthorized - create a user first", {
            status: 401,
          });
        }

        const roomId = nanoid();
        // rooms.set(roomId, { users: [id] });
        return new Response(JSON.stringify({ roomId }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      },
    },
    "/room/:roomId": (req, server) => {
      const { id } = getUserFromReq(req);
      if (!id) {
        return new Response("Unauthorized - create a user first", {
          status: 401,
        });
      }
      const room = rooms.get(req.params.roomId);
      if (!room) {
        return new Response("Room not found", {
          status: 404,
          headers: CORS_HEADERS,
        });
      }
      const success = server.upgrade(req, {
        data: { userId: id, roomId: req.params.roomId },
      });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", {
            status: 400,
            headers: CORS_HEADERS,
          });
    },
  },
  websocket: {
    // TypeScript: specify the type of ws.data like this
    data: {} as { userId: string; roomId: string },

    open(ws) {
      const room = rooms.get(ws.data.roomId);
      if (!room) {
        ws.close(1008, "Invalid room");
        return;
      }

      room.users.push(ws.data.userId);

      const event = toEvent({
        type: "sys_join",
        userId: ws.data.userId,
        users: room.users.map((id) => users.get(id)).filter((v) => !!v),
      });

      ws.subscribe(ws.data.roomId);
      server.publish(ws.data.roomId, JSON.stringify(event));
    },
    message(ws, message) {
      const event = toEvent({
        type: "message",
        content: message.toString(),
      });
      server.publish(ws.data.roomId, JSON.stringify(event));
    },
    close(ws) {
      const room = rooms.get(ws.data.roomId);
      if (!room) return;

      room.users = room.users.filter((id) => id !== ws.data.userId);

      const event = toEvent({
        type: "sys_leave",
        userId: ws.data.userId,
        users: room.users.map((id) => users.get(id)).filter((v) => !!v),
      });

      ws.unsubscribe(ws.data.roomId);
      server.publish(ws.data.roomId, JSON.stringify(event));
    },
  },

  fetch(req) {
    const res = new Response("hello world");
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    // add Access-Control-Allow-Headers if needed
    return res;
  },
});
