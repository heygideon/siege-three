import { Hono } from "hono";
import users from "./routes/users";
import { cors } from "hono/cors";
import room from "./routes/room";
import { websocket } from "hono/bun";

const app = new Hono()
  .use(
    cors({
      origin: ["http://localhost:5173", "https://siege-three.pages.dev"],
      credentials: true,
    })
  )
  .route("/users", users)
  .route("/room", room);

export type App = typeof app;

export default {
  fetch: app.fetch,
  websocket,
};
