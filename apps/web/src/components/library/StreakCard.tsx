import { useEffect, useState } from "react";
import { getActivitySummary, type ActivitySummary } from "../../lib/api";
import { useT } from "../../lib/i18n";

export function StreakCard() {
  const t = useT();
  const [summary, setSummary] = useState<ActivitySummary | null>(null);

  useEffect(() => {
    // Fetch after a short delay so the app-open activity ping (fired in App on
    // load) has a chance to land first and include today.
    const id = setTimeout(() => {
      getActivitySummary()
        .then(setSummary)
        .catch(() => {});
    }, 800);
    return () => clearTimeout(id);
  }, []);

  if (!summary) return null;

  return (
    <div className="mb-4 flex items-center gap-4 rounded-2xl border border-cream-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          🔥 {summary.streak}
        </div>
        <div className="text-xs text-stone-500 dark:text-slate-400">
          {t.streakCaption}
        </div>
      </div>
      <div className="flex-1 text-sm text-slate-600 dark:text-slate-300">
        {summary.streak === 0
          ? t.streakStartToday
          : t.streakActiveMonth(summary.activeDaysLast30)}
      </div>
    </div>
  );
}
