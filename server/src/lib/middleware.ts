import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { getUserFromSession } from "../db/sessions";
import type { Env } from "hono";

export interface AuthMiddlewareEnv extends Env {
  Variables: {
    user: ReturnType<typeof getUserFromSession>;
  };
}

export const authMiddleware = createMiddleware<AuthMiddlewareEnv>(
  async (c, next) => {
    const sessionId = getCookie(c, "session");
    if (sessionId) {
      const user = getUserFromSession(sessionId);
      c.set("user", user);
    } else {
      c.set("user", null);
    }

    await next();
  }
);
