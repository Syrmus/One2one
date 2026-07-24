import { useReaderStore } from "../../store/readerStore";
import { dailyGoal, NEW_WORDS_TARGET, ADD_WORDS_TARGET } from "../../lib/progress";
import { useT } from "../../lib/i18n";

function GoalRow({ done, label }: { done: boolean; label: string }) {
  return (
    <p
      className={`text-sm ${done ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}
    >
      <span aria-hidden>{done ? "✓" : "◌"}</span> {label}
    </p>
  );
}

export function DailyGoalCard({ targetLanguage }: { targetLanguage?: string }) {
  const t = useT();
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const reachedEndByStory = useReaderStore((s) => s.reachedEndByStory);
  const goal = dailyGoal(vocabulary, reachedEndByStory, targetLanguage);

  return (
    <div className="mb-4 rounded-2xl border border-cream-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
        {goal.done === 3 ? t.dailyGoalDone : t.dailyGoalTitle(goal.done)}
      </p>
      <div className="mt-1 space-y-0.5">
        <GoalRow done={goal.readStory} label={t.dailyGoalReadStory} />
        <GoalRow
          done={goal.metWords}
          label={t.dailyGoalMetWords(NEW_WORDS_TARGET)}
        />
        <GoalRow
          done={goal.addedWords}
          label={t.dailyGoalAddWords(ADD_WORDS_TARGET)}
        />
      </div>
    </div>
  );
}
