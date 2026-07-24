import { useEffect, useState } from "react";
import type { Story } from "@weave/shared";
import { getStories } from "../lib/api";
import { StoryCard } from "../components/library/StoryCard";
import { WeeklySummary } from "../components/library/WeeklySummary";
import { LibraryIcon } from "../components/nav/icons";
import { useSession } from "../lib/authClient";
import { useT } from "../lib/i18n";

const LEVEL_ORDER = ["A1", "A2", "B1"] as const;

export function LibraryPage() {
  const t = useT();
  const { data: session } = useSession();
  const targetLanguage = session?.user.targetLanguage ?? undefined;
  const nativeLanguage = session?.user.nativeLanguage ?? undefined;
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStories(null);
    getStories(targetLanguage, nativeLanguage)
      .then(setStories)
      .catch((err) => setError(String(err)));
  }, [targetLanguage, nativeLanguage]);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.library}
        </h1>
        <div className="flex items-center gap-2">
          {nativeLanguage && targetLanguage && (
            <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-semibold text-stone-600 dark:bg-slate-700 dark:text-slate-300">
              {nativeLanguage.toUpperCase()}-{targetLanguage.toUpperCase()}
            </span>
          )}
          <LibraryIcon className="h-6 w-6 text-stone-400 dark:text-slate-500" />
        </div>
      </div>

      <WeeklySummary targetLanguage={targetLanguage} />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {!error && !stories && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.loading}
        </p>
      )}
      {!error && stories?.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.noStoriesForLanguage}
        </p>
      )}
      {LEVEL_ORDER.map((level) => {
        const levelStories = stories?.filter((s) => s.level === level) ?? [];
        if (levelStories.length === 0) return null;
        return (
          <div key={level} className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
              {t.levelSection(level)}
            </h2>
            <div className="flex flex-col gap-3">
              {levelStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
