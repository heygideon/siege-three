import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { usersMap, type User } from "../db/users";
import { roomsMap } from "../db/rooms";

import { EventEmitter } from "node:events";
import { authMiddleware } from "../lib/middleware";
import { type } from "arktype";
import destr from "destr";
import { nanoid } from "nanoid";

const MessageEvent = type({
  type: "'message'",
  userId: "string",
  content: "string",
});
const SysJoinEvent = type({
  type: "'sys-join'",
  userId: "string",
  users: type("object").as<User[]>(),
});
const SysLeaveEvent = type({
  type: "'sys-leave'",
  userId: "string",
  users: type("object").as<User[]>(),
});
export const Event = type.or(MessageEvent, SysJoinEvent, SysLeaveEvent);
export const UserSentEvent = type.or(MessageEvent);

const ee = new EventEmitter<{ event: [typeof Event.infer] }>();

const app = new Hono();

export default app
  .post("/", authMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.text("Unauthorized", 401);
    }
    const roomId = nanoid();
    roomsMap.set(roomId, { _id: roomId, users: [user.id] });
    return c.json({ roomId });
  })
  .get(
    "/:roomId",
    authMiddleware,
    upgradeWebSocket((c) => {
      return {
        onOpen(evt, ws) {
          const user = c.get("user") as User | null;
          if (!user) {
            console.log("No user in WebSocket connection");
            ws.close(1008, "Unauthorized");
            return;
          }
          console.log(
            "WebSocket connection opened",
            c.req.param("roomId"),
            user._id
          );

          const room = roomsMap.get(c.req.param("roomId"));
          if (!room) {
            console.log("Room not found:", c.req.param("roomId"));
            ws.close(1008, "Room not found");
            return;
          }
          if (room.users.length >= 2) {
            console.log("Room full:", c.req.param("roomId"));
            ws.close(1008, "Room is full");
            return;
          }

          room.users.push(user._id);

          ee.on("event", (event) => {
            console.log("Emitting event to WebSocket:", event);
            ws.send(JSON.stringify(event));
          });

          const users = room.users.map((id) => usersMap.get(id)!);
          ee.emit("event", {
            type: "sys-join",
            userId: user._id,
            users,
          });
        },
        onMessage(evt, ws) {
          const data = UserSentEvent(destr(evt.data));
          if (data instanceof type.errors) {
            return;
          }

          const user = c.get("user") as User;

          console.log("Received message from WebSocket:", data);
          ee.emit("event", {
            type: "message",
            userId: user._id,
            content: data.content,
          });
        },
        onClose(evt, ws) {
          const room = roomsMap.get(c.req.param("roomId"));
          const user = c.get("user");
          if (!room || !user) {
            return;
          }
          room.users = room.users.filter((id) => id !== user.id);

          const users = room.users.map((id) => usersMap.get(id)!);
          ee.emit("event", {
            type: "sys-leave",
            userId: user.id,
            users,
          });
        },
      };
    })
  );
