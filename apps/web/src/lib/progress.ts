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

export const DAILY_MET_TARGET = 5;
export const DAILY_ADD_TARGET = 5;
export const WEEKLY_ADD_TARGET = 25;

export function isToday(ts: number): boolean {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return ts >= startOfDay.getTime();
}

/** Local Monday 00:00 of the current week (weeks run Mon–Sun). */
export function startOfWeek(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const daysSinceMonday = (d.getDay() + 6) % 7; // getDay: 0=Sun..6=Sat
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
}

function forLang(
  vocabulary: Record<string, VocabEntry>,
  targetLang: string | undefined,
): VocabEntry[] {
  return Object.values(vocabulary).filter(
    (e) => !targetLang || e.lang === targetLang,
  );
}

export type DailyGoal = {
  met: number;
  add: number;
  test: boolean;
  metDone: boolean;
  addDone: boolean;
  done: number;
};

export function dailyGoal(
  vocabulary: Record<string, VocabEntry>,
  targetLang: string | undefined,
  lastQuizAt: number | null,
): DailyGoal {
  const entries = forLang(vocabulary, targetLang);
  const met = entries.filter((e) => isToday(e.firstSeenAt)).length;
  const add = entries.filter((e) => e.added && isToday(e.addedAt ?? 0)).length;
  const test = lastQuizAt != null && isToday(lastQuizAt);

  const metDone = met >= DAILY_MET_TARGET;
  const addDone = add >= DAILY_ADD_TARGET;
  const done = [metDone, addDone, test].filter(Boolean).length;
  return { met, add, test, metDone, addDone, done };
}

export type WeeklyGoal = {
  wove: boolean;
  add: number;
  addDone: boolean;
  done: number;
};

export function weeklyGoal(
  vocabulary: Record<string, VocabEntry>,
  wovenAtByStory: Record<string, number>,
  targetLang: string | undefined,
): WeeklyGoal {
  const weekStart = startOfWeek();
  const wove = Object.values(wovenAtByStory).some((ts) => ts >= weekStart);
  const add = forLang(vocabulary, targetLang).filter(
    (e) => e.added && (e.addedAt ?? 0) >= weekStart,
  ).length;

  const addDone = add >= WEEKLY_ADD_TARGET;
  const done = [wove, addDone].filter(Boolean).length;
  return { wove, add, addDone, done };
}
