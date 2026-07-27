import { useReaderStore } from "../../store/readerStore";
import { weeklyGoal, WEEKLY_ADD_TARGET } from "../../lib/progress";
import { useT } from "../../lib/i18n";

function GoalRow({
  done,
  label,
  count,
  target,
}: {
  done: boolean;
  label: string;
  count: number;
  target: number;
}) {
  return (
    <p
      className={`flex items-center justify-between gap-2 text-sm ${done ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}
    >
      <span>
        <span aria-hidden>{done ? "✓" : "◌"}</span> {label}
      </span>
      <span className="tabular-nums text-xs">
        {Math.min(count, target)}/{target}
      </span>
    </p>
  );
}

export function WeeklyGoalCard({ targetLanguage }: { targetLanguage?: string }) {
  const t = useT();
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const wovenAtByStory = useReaderStore((s) => s.wovenAtByStory);
  const goal = weeklyGoal(vocabulary, wovenAtByStory, targetLanguage);

  return (
    <div className="mb-4 rounded-2xl border border-cream-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
        {goal.done === 2 ? t.weeklyGoalDone : t.weeklyGoalTitle(goal.done)}
      </p>
      <div className="mt-1 space-y-0.5">
        <GoalRow
          done={goal.wove}
          label={t.weeklyGoalWeave}
          count={goal.wove ? 1 : 0}
          target={1}
        />
        <GoalRow
          done={goal.addDone}
          label={t.dailyGoalAddWords(WEEKLY_ADD_TARGET)}
          count={goal.add}
          target={WEEKLY_ADD_TARGET}
        />
      </div>
    </div>
  );
}
