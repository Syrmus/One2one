import { z } from "zod";

export const posSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "article",
  "preposition",
  "pronoun",
  "conjunction",
  "auxiliary",
  "numeral",
  "particle",
]);
export type Pos = z.infer<typeof posSchema>;

export const textUnitSchema = z.object({
  t: z.literal("text"),
  l1: z.string(),
});
export type TextUnit = z.infer<typeof textUnitSchema>;

export const weaveUnitSchema = z.object({
  t: z.literal("weave"),
  l1: z.string(),
  l2: z.string(),
  lemma: z.string(),
  pos: posSchema,
  // "c" = common gender (Dutch de-words; German/Spanish use m/f/n)
  gender: z.enum(["m", "f", "n", "c"]).nullable().optional(),
  article: z.string().nullable().optional(),
  case: z.string().nullable().optional(),
  gloss: z.string(),
  ipa: z.string().nullable().optional(),
  weave_priority: z.number(),
  // Proper nouns (person/place/brand names): still woven and revealed like
  // any other content word, but not real vocabulary — the reader can't add
  // them to their word list and they're excluded from quizzes.
  proper_noun: z.boolean().optional(),
});
export type WeaveUnit = z.infer<typeof weaveUnitSchema>;

export const storyUnitSchema = z.discriminatedUnion("t", [
  textUnitSchema,
  weaveUnitSchema,
]);
export type StoryUnit = z.infer<typeof storyUnitSchema>;

export const storySchema = z.object({
  id: z.string(),
  l1: z.string(),
  l2: z.string(),
  level: z.enum(["A1", "A2", "B1"]),
  topic: z.string(),
  title: z.string(),
  units: z.array(storyUnitSchema),
});
export type Story = z.infer<typeof storySchema>;
