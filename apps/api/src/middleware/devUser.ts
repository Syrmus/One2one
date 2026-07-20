import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import type { AppEnv } from "../types";

// TEMPORARY: stands in for real sessions until the Auth slice wires up
// Better Auth + Google OAuth. A single hardcoded user is upserted once and
// reused for every request — matches the personal-use scope in SPEC §2.
// Routes read c.get("userId") the same way they will once real sessions
// exist, so only this file changes when Google OAuth lands.
const DEV_USER_EMAIL = "dev@weave.local";

let devUserId: string | null = null;

async function getOrCreateDevUser(): Promise<string> {
  if (devUserId) return devUserId;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, DEV_USER_EMAIL),
  });
  if (existing) {
    devUserId = existing.id;
    return existing.id;
  }

  const [created] = await db
    .insert(users)
    .values({ email: DEV_USER_EMAIL, name: "Dev User" })
    .returning();
  if (!created) throw new Error("Failed to create dev user");
  devUserId = created.id;
  return created.id;
}

export const devUserMiddleware: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  const userId = await getOrCreateDevUser();
  c.set("userId", userId);
  await next();
};
