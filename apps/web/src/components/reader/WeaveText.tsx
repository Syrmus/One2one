import { useEffect, useMemo, useRef } from "react";
import type { Story } from "@weave/shared";
import { computeRevealedIndices, isWoven } from "@weave/shared";
import { splitIntoSentences } from "../../lib/sentences";

type Props = {
  story: Story;
  step: number;
  onSelectWeave: (unitIndex: number) => void;
  // Called whenever reading reaches a new furthest sentence — furthest is
  // 0-indexed, total is the sentence count. Furthest === total - 1 means the
  // reader has reached the end of the story.
  onProgress?: (furthestSentenceIndex: number, total: number) => void;
};

export function WeaveText({ story, step, onSelectWeave, onProgress }: Props) {
  const revealed = useMemo(
    () => computeRevealedIndices(story, step),
    [story, step],
  );
  const sentences = useMemo(
    () => splitIntoSentences(story.units),
    [story],
  );

  const sentenceRefs = useRef<Map<number, HTMLElement>>(new Map());
  const maxSeenRef = useRef(-1);

  useEffect(() => {
    maxSeenRef.current = -1;
  }, [story.id]);

  useEffect(() => {
    if (!onProgress || sentences.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let newMax = maxSeenRef.current;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number(
            (entry.target as HTMLElement).dataset.sentenceIndex,
          );
          if (idx > newMax) newMax = idx;
        }
        if (newMax > maxSeenRef.current) {
          maxSeenRef.current = newMax;
          onProgress(newMax, sentences.length);
        }
      },
      { threshold: 0 },
    );
    for (const el of sentenceRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [sentences, onProgress]);

  return (
    <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-100">
      {sentences.map((sentence, si) => (
        <span
          key={si}
          ref={(el) => {
            if (el) sentenceRefs.current.set(si, el);
            else sentenceRefs.current.delete(si);
          }}
          data-sentence-index={si}
        >
          {sentence.units.map(({ unit, index }) => {
            if (unit.t === "text") {
              return <span key={index}>{unit.l1}</span>;
            }
            if (!isWoven(unit, revealed, index)) {
              return <span key={index}>{unit.l1}</span>;
            }
            return (
              <button
                key={index}
                type="button"
                onClick={() => onSelectWeave(index)}
                className="inline appearance-none border-0 bg-transparent p-0 font-medium text-[#2f6fb0] underline decoration-dotted decoration-1 underline-offset-4 decoration-[#2f6fb0]/40 dark:text-[#8fc1ec] dark:decoration-[#8fc1ec]/40"
              >
                {unit.l2}
              </button>
            );
          })}
        </span>
      ))}
    </p>
  );
}
