import { useReaderStore } from "../store/readerStore";
import { langInfo } from "../lib/languages";
import { LanguageSelector } from "../components/common/LanguageSelector";

export function ProgressPage() {
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const targetLanguage = useReaderStore((s) => s.targetLanguage);
  const entries = Object.values(vocabulary)
    .filter((e) => targetLanguage === null || e.lang === targetLanguage)
    .sort((a, b) => b.firstSeenAt - a.firstSeenAt);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        My Vocabulary
      </h1>

      <div className="mb-4">
        <LanguageSelector />
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Words you tap in the reader will show up here.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {entries.map((entry) => {
          const info = langInfo(entry.lang);
          return (
            <div
              key={`${entry.lang}:${entry.lemma}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {entry.lemma}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {entry.gloss}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${info.className}`}
                >
                  {info.flag} {info.label}
                </span>
                <span className="text-xs text-slate-400">
                  {entry.seenCount}×
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
