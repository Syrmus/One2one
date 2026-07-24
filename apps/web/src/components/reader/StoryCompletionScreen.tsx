import { DEFAULT_STEPS } from "@weave/shared";
import { useT } from "../../lib/i18n";

type Props = {
  step: number;
  seen: number;
  total: number;
  addedInStory: number;
  canRaiseDensity: boolean;
  canQuiz: boolean;
  onRaiseDensity: () => void;
  onQuiz: () => void;
  onNext: () => void;
  onClose: () => void;
};

export function StoryCompletionScreen({
  step,
  seen,
  total,
  addedInStory,
  canRaiseDensity,
  canQuiz,
  onRaiseDensity,
  onQuiz,
  onNext,
  onClose,
}: Props) {
  const t = useT();
  const densityTarget = DEFAULT_STEPS[step]?.target ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {t.completionTitle}
        </h2>

        <div className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <p>{t.completionDensity(densityTarget)}</p>
          <p>{t.completionTotalWords(total)}</p>
          <p>{t.completionSeen(seen)}</p>
          <p>{t.completionAdded(addedInStory)}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {canRaiseDensity && (
            <button
              type="button"
              onClick={onRaiseDensity}
              className="rounded-full bg-sage-500 px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]"
            >
              {t.completionRaiseDensity}
            </button>
          )}
          {canQuiz && (
            <button
              type="button"
              onClick={onQuiz}
              className="rounded-full bg-dusk-600 px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]"
            >
              {t.completionQuiz}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="rounded-full border border-cream-100 px-4 py-3 text-sm font-semibold text-slate-700 active:scale-[0.99] dark:border-slate-700 dark:text-slate-200"
          >
            {t.completionNext}
          </button>
        </div>
      </div>
    </div>
  );
}
