import {
  pgTable,
  uuid,
  text,
  integer,
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
