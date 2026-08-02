import { Hono } from "hono";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../db/client";
import { activity } from "../db/schema";
import type { AppEnv } from "../types";

// Records a visit for the logged-in user. The client throttles to ~1/hour;
// this also skips inserting if the user already has a row in the last 30 min,
// so the log stays bounded regardless of client behaviour.
export const activityRoute = new Hono<AppEnv>().post("/", async (c) => {
  const userId = c.get("userId");
  const recent = await db.query.activity.findFirst({
    where: and(
      eq(activity.userId, userId),
      gt(activity.at, sql`now() - interval '30 minutes'`),
    ),
  });
  if (!recent) {
    await db.insert(activity).values({ userId });
  }
  return c.json({ ok: true });
});
