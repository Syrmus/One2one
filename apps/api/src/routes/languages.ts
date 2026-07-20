import { Hono } from "hono";
import { SUPPORTED_LANGUAGES } from "../config/languages";
import type { AppEnv } from "../types";

export const languagesRoute = new Hono<AppEnv>().get("/", (c) => {
  return c.json(SUPPORTED_LANGUAGES);
});
