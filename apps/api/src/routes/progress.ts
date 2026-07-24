import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { progress } from "../db/schema";
import type { AppEnv } from "../types";

type SeenBody = { lang?: string; lemma?: string; gloss?: string; pos?: string };
type AddedBody = {
  lang?: string;
  lemma?: string;
  gloss?: string;
  pos?: string;
  added?: boolean;
};

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
    const { lang, lemma, gloss, pos } = await c.req.json<SeenBody>();
    if (!lang || !lemma || !gloss) {
      return c.json({ error: "lang, lemma and gloss are required" }, 400);
    }

    const [row] = await db
      .insert(progress)
      .values({ userId, lang, lemma, gloss, pos })
      .onConflictDoUpdate({
        target: [progress.userId, progress.lang, progress.lemma],
        set: {
          seenCount: sql`${progress.seenCount} + 1`,
          updatedAt: sql`now()`,
          gloss,
          pos,
        },
      })
      .returning();

    return c.json(row);
  })
  .post("/added", async (c) => {
    const userId = c.get("userId");
    const { lang, lemma, gloss, pos, added } = await c.req.json<AddedBody>();
    if (!lang || !lemma || !gloss || typeof added !== "boolean") {
      return c.json(
        { error: "lang, lemma, gloss and added are required" },
        400,
      );
    }

    const [row] = await db
      .insert(progress)
      .values({ userId, lang, lemma, gloss, pos, added })
      .onConflictDoUpdate({
        target: [progress.userId, progress.lang, progress.lemma],
        set: { added, updatedAt: sql`now()` },
      })
      .returning();

    return c.json(row);
  });
