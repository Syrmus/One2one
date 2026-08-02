import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { isAdminEmail } from "../lib/admin";
import type { AppEnv } from "../types";

// Mounted behind requireSession (so userEmail is set). /whoami is open to any
// signed-in user (the client uses it to decide whether to show the Stats
// link); /stats self-gates to admins.
export const adminRoute = new Hono<AppEnv>()
  .get("/whoami", (c) => c.json({ admin: isAdminEmail(c.get("userEmail")) }))
  .get("/stats", async (c) => {
    if (!isAdminEmail(c.get("userEmail"))) {
      return c.json({ error: "forbidden" }, 403);
    }

    const perUser = await db.execute(sql`
      select
        u.email,
        to_char(u.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') as signup_at,
        (select to_char(max(s.created_at), 'YYYY-MM-DD"T"HH24:MI:SS')
           from session s where s.user_id = u.id) as last_login_at,
        (select to_char(max(a.at), 'YYYY-MM-DD"T"HH24:MI:SS')
           from activity a where a.user_id = u.id) as last_seen,
        (select count(distinct date_trunc('day', a.at))::int
           from activity a where a.user_id = u.id) as active_days,
        (select count(*)::int from activity a where a.user_id = u.id) as visits,
        (select count(*)::int from session s where s.user_id = u.id) as logins
      from "user" u
      order by u.created_at
    `);

    const signups = await db.execute(sql`
      select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*)::int as count
      from "user" group by 1 order by 1
    `);

    const logins = await db.execute(sql`
      select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*)::int as count
      from session where created_at > now() - interval '30 days' group by 1 order by 1
    `);

    const dailyActive = await db.execute(sql`
      select to_char(date_trunc('day', at), 'YYYY-MM-DD') as day, count(distinct user_id)::int as users
      from activity where at > now() - interval '30 days' group by 1 order by 1
    `);

    const totals = await db.execute(sql`
      select
        (select count(*)::int from "user") as users,
        (select count(distinct user_id)::int from activity
           where at > date_trunc('day', now())) as active_today,
        (select count(distinct user_id)::int from activity
           where at > now() - interval '7 days') as active_7d,
        (select count(*)::int from (
           select user_id from activity
           group by user_id having count(distinct date_trunc('day', at)) > 1
        ) t) as returning_users
    `);

    return c.json({
      totals: totals.rows[0] ?? {},
      users: perUser.rows,
      signups: signups.rows,
      logins: logins.rows,
      dailyActive: dailyActive.rows,
    });
  });
