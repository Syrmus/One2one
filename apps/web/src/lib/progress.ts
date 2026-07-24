import { MAX_STEP } from "@weave/shared";
import type { Story } from "@weave/shared";
import type { VocabEntry } from "../store/readerStore";

export function storyLemmas(story: Story): string[] {
  const lemmas = new Set<string>();
  for (const unit of story.units) {
    if (unit.t === "weave") lemmas.add(unit.lemma);
  }
  return [...lemmas];
}

export function storyProgress(
  story: Story,
  vocabulary: Record<string, VocabEntry>,
): { seen: number; total: number; ratio: number } {
  const lemmas = storyLemmas(story);
  const seen = lemmas.filter(
    (lemma) => vocabulary[`${story.l2}:${lemma}`],
  ).length;
  const total = lemmas.length;
  return { seen, total, ratio: total === 0 ? 0 : seen / total };
}

export type StoryStatus = "unopened" | "started" | "read" | "woven";

/**
 * `maxCompletedStep` is only ever >= 1 when the story has been read to the
 * end at a non-zero density (readerStore.markReachedEnd is a no-op below
 * step 1), so it alone is enough to derive "read" vs "woven" — no separate
 * reachedEnd flag needed here.
 */
export function storyStatus(args: {
  hasProgress: boolean;
  maxCompletedStep: number;
}): StoryStatus {
  if (args.maxCompletedStep >= MAX_STEP) return "woven";
  if (args.maxCompletedStep >= 1) return "read";
  if (args.hasProgress) return "started";
  return "unopened";
}

export const NEW_WORDS_TARGET = 5;
export const ADD_WORDS_TARGET = 5;

export function isToday(ts: number): boolean {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return ts >= startOfDay.getTime();
}

export type DailyGoal = {
  readStory: boolean;
  metWords: boolean;
  addedWords: boolean;
  done: number;
};

export function dailyGoal(
  vocabulary: Record<string, VocabEntry>,
  reachedEndByStory: Record<string, number>,
  targetLang: string | undefined,
): DailyGoal {
  const readStory = Object.values(reachedEndByStory).some(isToday);

  const entries = Object.values(vocabulary).filter(
    (e) => !targetLang || e.lang === targetLang,
  );
  const metWords =
    entries.filter((e) => isToday(e.firstSeenAt)).length >= NEW_WORDS_TARGET;
  const addedWords =
    entries.filter((e) => e.added && isToday(e.addedAt ?? 0)).length >=
    ADD_WORDS_TARGET;

  const done = [readStory, metWords, addedWords].filter(Boolean).length;
  return { readStory, metWords, addedWords, done };
}
