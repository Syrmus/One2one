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
}).get("/summary", async (c) => {
  const userId = c.get("userId");
  const res = await db.execute(sql`
    select to_char(date_trunc('day', at at time zone 'UTC'), 'YYYY-MM-DD') as day
    from activity
    where user_id = ${userId} and at > now() - interval '400 days'
    group by 1
  `);
  const days = new Set(
    (res.rows as { day: string }[]).map((r) => r.day),
  );

  const MS = 86400000;
  const utcDay = (t: number) => new Date(t).toISOString().slice(0, 10);
  const now = Date.now();
  const todayStr = utcDay(now);

  // Streak is intact if the last active day is today or yesterday; count back
  // over consecutive active days from there.
  let anchor: number | null = null;
  if (days.has(todayStr)) anchor = now;
  else if (days.has(utcDay(now - MS))) anchor = now - MS;

  let streak = 0;
  if (anchor !== null) {
    for (let t = anchor; days.has(utcDay(t)); t -= MS) streak++;
  }

  const monthAgo = now - 30 * MS;
  let activeDaysLast30 = 0;
  for (const d of days) {
    if (Date.parse(`${d}T00:00:00Z`) >= monthAgo) activeDaysLast30++;
  }

  return c.json({
    streak,
    activeDaysLast30,
    activeToday: days.has(todayStr),
  });
});
