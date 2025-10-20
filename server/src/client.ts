import type { App } from "./index";
import { hc } from "hono/client";
import type { Event } from "./routes/room";

export const client = hc<App>(
  import.meta.env.VITE_API_URL || "https://localhost:3000",
  {
    init: { credentials: "include" },
  }
);

export type WSEvent = typeof Event.infer;
