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
