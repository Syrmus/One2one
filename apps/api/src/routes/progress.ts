import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { progress } from "../db/schema";
import type { AppEnv } from "../types";

type SeenBody = { lang?: string; lemma?: string; gloss?: string };

export const progressRoute = new Hono<AppEnv>()
  .get("/", async (c) => {
    const userId = c.get("userId");
    const rows = await db.query.progress.findMany({
      where: eq(progress.userId, userId),
    });
    return c.json(rows);
  })
  .post("/seen", async (c) => {
    const userId = c.get("userId");
    const { lang, lemma, gloss } = await c.req.json<SeenBody>();
    if (!lang || !lemma || !gloss) {
      return c.json({ error: "lang, lemma and gloss are required" }, 400);
    }

    const [row] = await db
      .insert(progress)
      .values({ userId, lang, lemma, gloss })
      .onConflictDoUpdate({
        target: [progress.userId, progress.lang, progress.lemma],
        set: {
          seenCount: sql`${progress.seenCount} + 1`,
          updatedAt: sql`now()`,
          gloss,
        },
      })
      .returning();

    return c.json(row);
  });
