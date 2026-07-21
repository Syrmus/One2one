import { z } from "zod";

export const posSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "function_word",
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
  gender: z.enum(["m", "f", "n", "c"]).optional(),
  article: z.string().optional(),
  case: z.string().optional(),
  gloss: z.string(),
  ipa: z.string(),
  weave_priority: z.number(),
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
  level: z.enum(["A1", "A2"]),
  topic: z.string(),
  title: z.string(),
  units: z.array(storyUnitSchema),
});
export type Story = z.infer<typeof storySchema>;
