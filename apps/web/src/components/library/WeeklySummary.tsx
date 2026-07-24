import { useReaderStore } from "../../store/readerStore";
import { useT } from "../../lib/i18n";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function WeeklySummary({ targetLanguage }: { targetLanguage?: string }) {
  const t = useT();
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const since = Date.now() - WEEK_MS;

  const entries = Object.values(vocabulary).filter(
    (e) => !targetLanguage || e.lang === targetLanguage,
  );
  const newWords = entries.filter((e) => e.firstSeenAt >= since).length;
  const addedWords = entries.filter(
    (e) => e.added && (e.addedAt ?? 0) >= since,
  ).length;

  if (newWords === 0 && addedWords === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-cream-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
        {t.thisWeek}
      </p>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
        {t.weeklyNewWords(newWords)}
        {addedWords > 0 && ` · ${t.weeklyAddedWords(addedWords)}`}
      </p>
    </div>
  );
}
