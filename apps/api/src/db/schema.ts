import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./authSchema";

export * from "./authSchema";

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lang: text("lang").notNull(),
    lemma: text("lemma").notNull(),
    gloss: text("gloss").notNull(),
    pos: text("pos"),
    added: boolean("added").notNull().default(false),
    // When `added` was last flipped to true (null when never added / unmarked).
    // Lets "added this week / today" metrics survive across devices.
    addedAt: timestamp("added_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    seenCount: integer("seen_count").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("progress_user_lang_lemma_idx").on(
      table.userId,
      table.lang,
      table.lemma,
    ),
  ],
);

export const readingProgress = pgTable(
  "reading_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    storyId: text("story_id").notNull(),
    densityStep: integer("density_step").notNull().default(0),
    scrollPosition: integer("scroll_position").notNull().default(0),
    reachedEndAt: timestamp("reached_end_at", { withTimezone: true }),
    maxCompletedStep: integer("max_completed_step").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reading_progress_user_story_idx").on(
      table.userId,
      table.storyId,
    ),
  ],
);
