import { isContent, type Story } from "@weave/shared";
import type { VocabEntry } from "../store/readerStore";

export type QuizPair = { id: string; l2: string; l1: string };

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function buildStoryQuizPairs(story: Story): QuizPair[] {
  const seen = new Set<string>();
  const pairs: QuizPair[] = [];
  for (const unit of story.units) {
    if (unit.t !== "weave") continue;
    if (!isContent(unit.pos)) continue;
    if (seen.has(unit.lemma)) continue;
    seen.add(unit.lemma);
    const l2 = unit.article ? `${unit.article} ${unit.lemma}` : unit.lemma;
    pairs.push({ id: unit.lemma, l2, l1: unit.gloss });
  }
  return pairs;
}

export function buildVocabQuizPairs(
  entries: VocabEntry[],
  lang: string,
  maxWords = 15,
): QuizPair[] {
  const eligible = entries.filter(
    (e) => e.lang === lang && e.added && (!e.pos || isContent(e.pos)),
  );
  return shuffle(eligible)
    .slice(0, maxWords)
    .map((e) => ({ id: e.lemma, l2: e.lemma, l1: e.gloss }));
}

/**
 * Split pairs into 5-pair screens. Fewer than 5 words: no quiz (caller must
 * check). 5-9 words: a single screen of 5 random words (re-shuffled, and
 * possibly a different 5 out of the pool, on every call). 10+ words: all of
 * them, chunked into screens of 5 (last screen may be smaller).
 */
export function buildQuizScreens(pairs: QuizPair[]): QuizPair[][] {
  if (pairs.length < 5) return [];
  const shuffled = shuffle(pairs);
  if (shuffled.length < 10) return [shuffled.slice(0, 5)];
  const screens: QuizPair[][] = [];
  for (let i = 0; i < shuffled.length; i += 5) {
    screens.push(shuffled.slice(i, i + 5));
  }
  return screens;
}

export { shuffle };
