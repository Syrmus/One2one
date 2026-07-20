import { Hono } from "hono";
import { auth } from "../auth";
import type { AppEnv } from "../types";

export const authRoute = new Hono<AppEnv>({ strict: false }).on(
  ["POST", "GET"],
  "/*",
  (c) => auth.handler(c.req.raw),
);
