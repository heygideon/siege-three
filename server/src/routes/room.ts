import { Hono, type Context } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { usersMap, type User } from "../db/users";
import { roomsMap } from "../db/rooms";

import { EventEmitter } from "node:events";
import { authMiddleware, type AuthMiddlewareEnv } from "../lib/middleware";
import { type } from "arktype";
import destr from "destr";
import { nanoid } from "nanoid";
import chalk from "chalk";

const MessageEvent = type({
  type: "'message'",
  userId: "string",
  content: "string",
});
const SysJoinEvent = type({
  type: "'sys-join'",
  userId: "string",
  users: type("object").as<({ id: string } & User)[]>(),
});
const SysLeaveEvent = type({
  type: "'sys-leave'",
  userId: "string",
  users: type("object").as<({ id: string } & User)[]>(),
});
export const Event = type.or(MessageEvent, SysJoinEvent, SysLeaveEvent);
export const UserSentEvent = type.or(MessageEvent);

const ee = new EventEmitter<{ event: [typeof Event.infer] }>();

const logEvent = (event: typeof Event.infer) => {
  if (event.type === "message") {
    console.log(
      chalk.blueBright.bold("event"),
      chalk.blueBright.italic(event.type),
      chalk.gray(`${event.userId}: ${event.content}`)
    );
  } else if (event.type === "sys-join" || event.type === "sys-leave") {
    console.log(
      chalk.blueBright.bold("event"),
      chalk.blueBright.italic(event.type),
      chalk.gray(`${event.userId} (${event.users.length} present)`)
    );
  }
};

const app = new Hono();

export default app
  .post("/", authMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.text("Unauthorized", 401);
    }
    const roomId = nanoid();
    roomsMap.set(roomId, new Set<string>());
    return c.json({ roomId });
  })
  .get(
    "/:roomId",
    authMiddleware,
    upgradeWebSocket((c: Context<AuthMiddlewareEnv>) => {
      return {
        onOpen(evt, ws) {
          const user = c.get("user");
          if (!user) {
            console.log("No user in WebSocket connection");
            ws.close(1008, "Unauthorized");
            return;
          }

          const room = roomsMap.get(c.req.param("roomId"));
          if (!room) {
            console.log("Room not found:", c.req.param("roomId"));
            ws.close(1008, "Room not found");
            return;
          }
          if (room.size >= 2 && !room.has(user.id)) {
            console.log("Room full:", c.req.param("roomId"));
            ws.close(1008, "Room is full");
            return;
          }
          if (room.has(user.id)) {
            console.log("User already in room:", user.id);
            ws.close(1008, "User already in room");
            return;
          }

          console.log(
            chalk.yellowBright.bold("ws open"),
            chalk.gray(
              `${user.name} (${user.id}) joined room ${c.req.param("roomId")}`
            )
          );

          room.add(user.id);

          ee.on("event", (event) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            logEvent(event);
            ws.send(JSON.stringify(event));
          });

          const users = Array.from(room.keys()).map((id) => ({
            id,
            ...usersMap.get(id)!,
          }));
          ee.emit("event", {
            type: "sys-join",
            userId: user.id,
            users,
          });
        },
        onMessage(evt, ws) {
          const data = UserSentEvent(destr(evt.data));
          if (data instanceof type.errors) {
            return;
          }

          const user = c.get("user")!;

          console.log(
            chalk.cyanBright.bold("ws message"),
            chalk.gray(JSON.stringify(data))
          );
          ee.emit("event", {
            type: "message",
            userId: user.id,
            content: data.content,
          });
        },
        onClose(evt, ws) {
          const room = roomsMap.get(c.req.param("roomId"));
          const user = c.get("user");
          if (!room || !user) {
            return;
          }

          console.log(
            chalk.yellowBright.bold("ws close"),
            chalk.gray(
              `${user.name} (${user.id}) left room ${c.req.param("roomId")}`
            )
          );

          room.delete(user.id);

          const users = Array.from(room.keys()).map((id) => ({
            id,
            ...usersMap.get(id)!,
          }));
          ee.emit("event", {
            type: "sys-leave",
            userId: user.id,
            users,
          });
        },
      };
    })
  );
