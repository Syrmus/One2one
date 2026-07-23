import { useMemo } from "react";
import type { Story } from "@weave/shared";
import { computeRevealedIndices, isWoven } from "@weave/shared";

type Props = {
  story: Story;
  step: number;
  onSelectWeave: (unitIndex: number) => void;
};

export function WeaveText({ story, step, onSelectWeave }: Props) {
  const revealed = useMemo(
    () => computeRevealedIndices(story, step),
    [story, step],
  );

  return (
    <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-100">
      {story.units.map((unit, i) => {
        if (unit.t === "text") {
          return <span key={i}>{unit.l1}</span>;
        }
        if (!isWoven(unit, revealed, i)) {
          return <span key={i}>{unit.l1}</span>;
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelectWeave(i)}
            className="mx-0.5 rounded px-0.5 bg-blue-50 text-blue-700 underline decoration-blue-400 decoration-2 underline-offset-2 dark:bg-blue-950 dark:text-blue-300"
          >
            {unit.l2}
          </button>
        );
      })}
    </p>
  );
}
