import { useReaderStore, type VocabEntry } from "../store/readerStore";
import { langInfo } from "../lib/languages";
import { VocabularyIcon } from "../components/nav/icons";
import { useSession } from "../lib/authClient";
import { useT } from "../lib/i18n";

function VocabEntryRow({ entry }: { entry: VocabEntry }) {
  const info = langInfo(entry.lang);
  return (
    <div className="flex items-center justify-between rounded-2xl border border-cream-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
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
        <span className="text-xs text-slate-400">{entry.seenCount}×</span>
      </div>
    </div>
  );
}

export function ProgressPage() {
  const t = useT();
  const { data: session } = useSession();
  const targetLanguage = session?.user.targetLanguage;
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const entries = Object.values(vocabulary)
    .filter((e) => !targetLanguage || e.lang === targetLanguage)
    .sort((a, b) => b.firstSeenAt - a.firstSeenAt);
  const addedEntries = entries.filter((e) => e.added);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.myVocabulary}
        </h1>
        <VocabularyIcon className="h-6 w-6 text-stone-400 dark:text-slate-500" />
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.vocabularyEmpty}
        </p>
      )}

      {addedEntries.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
            {t.addedWords}
          </h2>
          <div className="flex flex-col gap-2">
            {addedEntries.map((entry) => (
              <VocabEntryRow key={`${entry.lang}:${entry.lemma}`} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div>
          {addedEntries.length > 0 && (
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
              {t.allEncounteredWords}
            </h2>
          )}
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <VocabEntryRow key={`${entry.lang}:${entry.lemma}`} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
