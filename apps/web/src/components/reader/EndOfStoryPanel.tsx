import { DEFAULT_STEPS, MAX_STEP } from "@weave/shared";
import { useT } from "../../lib/i18n";

type Props = {
  step: number;
  seen: number;
  addedInStory: number;
  canQuiz: boolean;
  onRaiseDensity: () => void;
  onQuiz: () => void;
  onNext: () => void;
};

/**
 * In-flow panel rendered at the end of the story text (not a modal). Because
 * seed stories are short and fit on one screen, this is visible without
 * scrolling — it's the explicit "you're done reading" affordance. Any forward
 * action here is what marks the story read at the current density; the reader
 * wires that via markReachedEnd in the handlers below.
 */
export function EndOfStoryPanel({
  step,
  seen,
  addedInStory,
  canQuiz,
  onRaiseDensity,
  onQuiz,
  onNext,
}: Props) {
  const t = useT();
  const atMax = step >= MAX_STEP;
  const nextTarget = DEFAULT_STEPS[step + 1]?.target ?? 100;

  const primaryClass =
    "rounded-full bg-sage-500 px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]";
  const secondaryClass =
    "rounded-full border border-cream-100 px-4 py-3 text-sm font-semibold text-slate-700 active:scale-[0.99] dark:border-slate-700 dark:text-slate-200";

  return (
    <div className="mt-8 rounded-3xl border border-cream-100 bg-cream-50 p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-slate-500">
        <span className="h-px flex-1 bg-cream-100 dark:bg-slate-700" />
        {atMax ? t.endMastered : t.endOfStory}
        <span className="h-px flex-1 bg-cream-100 dark:bg-slate-700" />
      </div>

      <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
        {t.completionSeen(seen)} · {t.completionAdded(addedInStory)}
      </p>

      <div className="mt-5 flex flex-col gap-2">
        {!atMax && (
          <button
            type="button"
            onClick={onRaiseDensity}
            className={primaryClass}
          >
            {t.endRaiseDensity(nextTarget)}
          </button>
        )}
        {canQuiz && (
          <button
            type="button"
            onClick={onQuiz}
            className={atMax ? primaryClass : secondaryClass}
          >
            {t.completionQuiz}
          </button>
        )}
        <button type="button" onClick={onNext} className={secondaryClass}>
          {t.completionNext}
        </button>
      </div>
    </div>
  );
}
