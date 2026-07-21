import { Hono } from "hono";
import { getStories, getStoryById } from "../content/loadSeedStories";
import type { AppEnv } from "../types";

export const storiesRoute = new Hono<AppEnv>()
  .get("/", (c) => {
    const lang = c.req.query("lang");
    const nativeLang = c.req.query("nativeLang");
    return c.json(getStories(lang, nativeLang));
  })
  .get("/:id", (c) => {
    const story = getStoryById(c.req.param("id"));
    if (!story) return c.json({ error: "not found" }, 404);
    return c.json(story);
  });
