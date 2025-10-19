import type { App } from "./index";
import { hc } from "hono/client";

export const client = hc<App>("http://localhost:3000", {
  init: { credentials: "include" },
});
