import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { usersMap } from "../db/users";
import { nanoid } from "nanoid";
import { createSession } from "../db/sessions";
import { setCookie } from "hono/cookie";
import { type } from "arktype";
import { authMiddleware } from "../lib/middleware";

export const User = type({
  name: type("string.trim").to("string <= 40"),
});

const app = new Hono();

export default app
  .get("/", authMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.text("Unauthorized", 401);
    }
    return c.json(user);
  })
  .post("/", sValidator("json", User), async (c) => {
    const user = c.req.valid("json");
    const userId = nanoid();

    usersMap.set(userId, { ...user, _id: userId });

    const sessionId = createSession(userId);
    setCookie(c, "session", sessionId, { httpOnly: true });

    return c.json({ userId });
  })
  .patch("/", sValidator("json", User.partial()), authMiddleware, async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.text("Unauthorized - create a user first", 401);
    }
    const body = c.req.valid("json");
    const updatedUser = { ...user, ...body };
    usersMap.set(user.id, updatedUser);

    return c.json({ userId: user.id });
  });
