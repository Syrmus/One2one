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
            className="appearance-none border-0 bg-transparent p-0 font-medium text-[#1d4e89] dark:text-[#6fa8dc]"
          >
            {unit.l2}
          </button>
        );
      })}
    </p>
  );
}
