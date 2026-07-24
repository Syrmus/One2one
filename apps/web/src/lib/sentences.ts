import type { StoryUnit } from "@weave/shared";

export type SentenceUnit = { unit: StoryUnit; index: number };
export type Sentence = { units: SentenceUnit[] };

const TERMINAL_PUNCTUATION = /[.!?…]/;

/**
 * Groups a story's flat unit list into sentences, keeping each unit's
 * original index into `story.units` (needed by WeaveText's onSelectWeave,
 * which is keyed on that index). A sentence boundary is a text unit whose
 * l1 contains terminal punctuation — seed content never packs more than one
 * sentence-ending mark into a single text unit, so this is a simple scan
 * rather than a full tokenizer.
 */
export function splitIntoSentences(units: StoryUnit[]): Sentence[] {
  const sentences: Sentence[] = [];
  let current: SentenceUnit[] = [];

  units.forEach((unit, index) => {
    current.push({ unit, index });
    if (unit.t === "text" && TERMINAL_PUNCTUATION.test(unit.l1)) {
      sentences.push({ units: current });
      current = [];
    }
  });

  if (current.length > 0) sentences.push({ units: current });
  return sentences;
}
