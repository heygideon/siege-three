import { Hono } from "hono";
import users from "./routes/users";
import { cors } from "hono/cors";

const app = new Hono()
  .use(cors({ origin: ["http://localhost:5173"], credentials: true }))
  .route("/users", users);

export type App = typeof app;

export default app;
