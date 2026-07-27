import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { MAX_STEP, MIN_STEP } from "@weave/shared";
import { db } from "../db/client";
import { readingProgress } from "../db/schema";
import type { AppEnv } from "../types";

type SaveBody = {
  storyId?: string;
  densityStep?: number;
  scrollPosition?: number;
};

type CompletedBody = {
  storyId?: string;
  densityStep?: number;
};

export const readingProgressRoute = new Hono<AppEnv>()
  .get("/", async (c) => {
    const userId = c.get("userId");
    const rows = await db.query.readingProgress.findMany({
      where: eq(readingProgress.userId, userId),
    });
    return c.json(rows);
  })
  .post("/", async (c) => {
    const userId = c.get("userId");
    const { storyId, densityStep, scrollPosition } =
      await c.req.json<SaveBody>();
    if (
      !storyId ||
      typeof densityStep !== "number" ||
      typeof scrollPosition !== "number"
    ) {
      return c.json(
        { error: "storyId, densityStep and scrollPosition are required" },
        400,
      );
    }

    const [row] = await db
      .insert(readingProgress)
      .values({ userId, storyId, densityStep, scrollPosition })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.storyId],
        set: {
          densityStep,
          scrollPosition,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return c.json(row);
  })
  .post("/completed", async (c) => {
    const userId = c.get("userId");
    const { storyId, densityStep } = await c.req.json<CompletedBody>();
    if (
      !storyId ||
      typeof densityStep !== "number" ||
      densityStep < Math.max(1, MIN_STEP) ||
      densityStep > MAX_STEP
    ) {
      return c.json(
        { error: "storyId is required and densityStep must be in [1, MAX_STEP]" },
        400,
      );
    }

    const [row] = await db
      .insert(readingProgress)
      .values({
        userId,
        storyId,
        densityStep,
        scrollPosition: 0,
        reachedEndAt: sql`now()`,
        maxCompletedStep: densityStep,
      })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.storyId],
        set: {
          reachedEndAt: sql`now()`,
          maxCompletedStep: sql`GREATEST(${readingProgress.maxCompletedStep}, ${densityStep})`,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return c.json(row);
  });
