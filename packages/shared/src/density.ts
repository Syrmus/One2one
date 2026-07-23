import type { Story, StoryUnit, WeaveUnit, Pos } from "./story";

// Content vs. function-word classification drives the two-phase reveal
// (STORY_GENERATION_SPEC.md §4.1/§4.4): every content unit must have a lower
// weave_priority than any function unit, so Phase A (content) is guaranteed
// to finish before Phase B (function words) starts.
const CONTENT_POS = new Set<Pos>(["noun", "verb", "adjective", "adverb"]);

export function isContent(pos: Pos): boolean {
  return CONTENT_POS.has(pos);
}

export type DensityStep = {
  phase: "A" | "B";
  /** Percent of the phase's denominator (content words for A, all words for B). */
  target: number;
};

// Recommended step list from STORY_GENERATION_SPEC.md §4.2 — the
// "app-configurable array" the spec calls for. Swap this to try the
// alternative (§4.3) coarser list without touching the reveal algorithm.
export const DEFAULT_STEPS: DensityStep[] = [
  { phase: "A", target: 0 },
  { phase: "A", target: 25 },
  { phase: "A", target: 50 },
  { phase: "A", target: 75 },
  { phase: "A", target: 100 },
  { phase: "B", target: 70 },
  { phase: "B", target: 85 },
  { phase: "B", target: 100 },
];

export const MIN_STEP = 0;
export const MAX_STEP = DEFAULT_STEPS.length - 1;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type IndexedWeaveUnit = { unit: WeaveUnit; index: number };

/**
 * STORY_GENERATION_SPEC.md §4.5 reveal algorithm: at a given step, decide
 * which weave-unit indices in `story.units` should render as L2 ("revealed").
 * Phase A reveals content units (by weave_priority) until the woven share of
 * content words hits the step's target; Phase B first reveals all content,
 * then function units until the woven share of *all* words hits the target.
 * Multi-word reorder-group units (STORY_GENERATION_SPEC.md §4.6) are
 * revealed atomically — never partially — since we walk unit-by-unit.
 */
export function computeRevealedIndices(
  story: Story,
  step: number,
): Set<number> {
  const clamped = Math.max(MIN_STEP, Math.min(MAX_STEP, step));
  const config = DEFAULT_STEPS[clamped] ?? DEFAULT_STEPS[MIN_STEP]!;

  const weaveEntries: IndexedWeaveUnit[] = story.units
    .map((unit, index) => ({ unit, index }))
    .filter(
      (entry): entry is IndexedWeaveUnit => entry.unit.t === "weave",
    ) as unknown as IndexedWeaveUnit[];

  const content = weaveEntries
    .filter((e) => isContent(e.unit.pos))
    .sort((a, b) => a.unit.weave_priority - b.unit.weave_priority);
  const functionWords = weaveEntries
    .filter((e) => !isContent(e.unit.pos))
    .sort((a, b) => a.unit.weave_priority - b.unit.weave_priority);

  const revealed = new Set<number>();

  const contentWordTotal = content.reduce(
    (sum, e) => sum + wordCount(e.unit.l1),
    0,
  );

  if (config.phase === "A") {
    const target = Math.ceil((config.target / 100) * contentWordTotal);
    let revealedWords = 0;
    for (const entry of content) {
      if (revealedWords >= target) break;
      revealed.add(entry.index);
      revealedWords += wordCount(entry.unit.l1);
    }
    return revealed;
  }

  // Phase B: Phase A is complete — all content words are revealed — then
  // function words are added in priority order against the all-words target.
  for (const entry of content) revealed.add(entry.index);

  const allWordTotal =
    contentWordTotal +
    functionWords.reduce((sum, e) => sum + wordCount(e.unit.l1), 0);
  const target = Math.ceil((config.target / 100) * allWordTotal);
  let revealedWords = contentWordTotal;
  for (const entry of functionWords) {
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
