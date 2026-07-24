import { Link } from "react-router-dom";
import { isContent } from "@weave/shared";
import { useReaderStore, type VocabEntry } from "../store/readerStore";
import { VocabularyIcon } from "../components/nav/icons";
import { WeeklySummary } from "../components/library/WeeklySummary";
import { useSession } from "../lib/authClient";
import { useT } from "../lib/i18n";
import { nextMilestone, previousMilestone } from "../lib/milestones";

function MilestoneProgress({ count }: { count: number }) {
  const t = useT();
  const next = nextMilestone(count);
  if (!next) return null;
  const floor = previousMilestone(count);
  const ratio = (count - floor) / (next - floor);

  return (
    <div className="mb-6 rounded-2xl border border-cream-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t.vocabMilestoneProgress(count, next)}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-sage-500"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function VocabEntryRow({
  entry,
  onRemove,
}: {
  entry: VocabEntry;
  onRemove?: () => void;
}) {
  const t = useT();
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
        <span className="text-xs text-slate-400">{entry.seenCount}×</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={t.removeFromVocabulary}
            className="text-lg leading-none text-slate-400 active:text-slate-600 dark:active:text-slate-200"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export function ProgressPage() {
  const t = useT();
  const { data: session } = useSession();
  const nativeLanguage = session?.user.nativeLanguage;
  const targetLanguage = session?.user.targetLanguage;
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const unmarkAdded = useReaderStore((s) => s.unmarkAdded);
  const entries = Object.values(vocabulary)
    .filter((e) => !targetLanguage || e.lang === targetLanguage)
    .sort((a, b) => b.firstSeenAt - a.firstSeenAt);
  const addedEntries = entries.filter((e) => e.added);
  const quizEligibleCount = addedEntries.filter(
    (e) => !e.pos || isContent(e.pos),
  ).length;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.myVocabulary}
        </h1>
        <div className="flex items-center gap-2">
          {nativeLanguage && targetLanguage && (
            <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-semibold text-stone-600 dark:bg-slate-700 dark:text-slate-300">
              {nativeLanguage.toUpperCase()}-{targetLanguage.toUpperCase()}
            </span>
          )}
          <VocabularyIcon className="h-6 w-6 text-stone-400 dark:text-slate-500" />
        </div>
      </div>

      <WeeklySummary targetLanguage={targetLanguage ?? undefined} />
      <MilestoneProgress count={entries.length} />

      {entries.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.vocabularyEmpty}
        </p>
      )}

      {addedEntries.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
              {t.addedWords}
            </h2>
            {quizEligibleCount >= 5 && (
              <Link
                to="/quiz/vocab"
                className="text-xs font-medium text-dusk-600 dark:text-dusk-500"
              >
                {t.startQuiz}
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {addedEntries.map((entry) => (
              <VocabEntryRow
                key={`${entry.lang}:${entry.lemma}`}
                entry={entry}
                onRemove={() => unmarkAdded(entry.lang, entry.lemma)}
              />
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
