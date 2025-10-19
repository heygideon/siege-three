import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { getUserFromSession } from "../db/sessions";

export const authMiddleware = createMiddleware<{
  Variables: {
    user: ReturnType<typeof getUserFromSession>;
  };
}>(async (c, next) => {
  const sessionId = getCookie(c, "session");
  if (sessionId) {
    const user = getUserFromSession(sessionId);
    c.set("user", user);
  } else {
    c.set("user", null);
  }

  await next();
});
