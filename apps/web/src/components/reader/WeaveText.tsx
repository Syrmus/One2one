import type { Story } from "@weave/shared";
import { isWoven } from "@weave/shared";

type Props = {
  story: Story;
  threshold: number;
  onSelectWeave: (unitIndex: number) => void;
};

export function WeaveText({ story, threshold, onSelectWeave }: Props) {
  return (
    <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-100">
      {story.units.map((unit, i) => {
        if (unit.t === "text") {
          return <span key={i}>{unit.l1}</span>;
        }
        if (!isWoven(unit, threshold)) {
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
