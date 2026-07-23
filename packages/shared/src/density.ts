import type { Story, StoryUnit, WeaveUnit, Pos } from "./story";

// Content vs. function-word classification. Every content unit has a lower
// weave_priority than any function unit (STORY_GENERATION_SPEC.md §4.4), so
// walking all weave units in priority order naturally reveals content words
// (meaning-bearing) before function words (grammatical glue) — no separate
// phase/denominator needed to get that ordering.
const CONTENT_POS = new Set<Pos>(["noun", "verb", "adjective", "adverb"]);

export function isContent(pos: Pos): boolean {
  return CONTENT_POS.has(pos);
}

/** Percent of the story's total word count revealed in L2 at this step. */
export type DensityStep = { target: number };

// A single, evenly-spaced scale over "% of the whole text" — deliberately
// uniform (unlike the earlier two-denominator content/function-word split,
// which produced uneven jumps per story, occasionally a dead 0-point step
// when a story's content words alone already exceeded a later step's
// target). Content-before-function ordering still holds via weave_priority.
export const DEFAULT_STEPS: DensityStep[] = [
  { target: 0 },
  { target: 15 },
  { target: 30 },
  { target: 45 },
  { target: 60 },
  { target: 75 },
  { target: 90 },
  { target: 100 },
];

export const MIN_STEP = 0;
export const MAX_STEP = DEFAULT_STEPS.length - 1;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type IndexedWeaveUnit = { unit: WeaveUnit; index: number };

/**
 * Decide which weave-unit indices in `story.units` render as L2 ("revealed")
 * at a given step: walk every weave unit in ascending weave_priority order,
 * revealing whole units (never partially — see STORY_GENERATION_SPEC.md
 * §4.6 reorder groups) until the revealed word count reaches the step's
 * target share of the story's total word count.
 */
export function computeRevealedIndices(
  story: Story,
  step: number,
): Set<number> {
  const clamped = Math.max(MIN_STEP, Math.min(MAX_STEP, step));
  const config = DEFAULT_STEPS[clamped] ?? DEFAULT_STEPS[MIN_STEP]!;

  const weaveEntries: IndexedWeaveUnit[] = (
    story.units
      .map((unit, index) => ({ unit, index }))
      .filter((entry) => entry.unit.t === "weave") as unknown as IndexedWeaveUnit[]
  ).sort((a, b) => a.unit.weave_priority - b.unit.weave_priority);

  const wordTotal = weaveEntries.reduce(
    (sum, e) => sum + wordCount(e.unit.l1),
    0,
  );
  const target = Math.ceil((config.target / 100) * wordTotal);

  const revealed = new Set<number>();
  let revealedWords = 0;
  for (const entry of weaveEntries) {
    if (revealedWords >= target) break;
    revealed.add(entry.index);
    revealedWords += wordCount(entry.unit.l1);
  }
  return revealed;
}

export function isWoven(
  unit: StoryUnit,
  revealedIndices: Set<number>,
  index: number,
): boolean {
  return unit.t === "weave" && revealedIndices.has(index);
}

export function displayText(
  unit: StoryUnit,
  revealedIndices: Set<number>,
  index: number,
): string {
  if (unit.t === "text") return unit.l1;
  return isWoven(unit, revealedIndices, index) ? unit.l2 : unit.l1;
}
