import { useEffect, useState } from "react";
import type { Story } from "@weave/shared";
import { getStories } from "../lib/api";
import { StoryCard } from "../components/library/StoryCard";
import { LanguageSelector } from "../components/common/LanguageSelector";
import { useReaderStore } from "../store/readerStore";

export function LibraryPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const targetLanguage = useReaderStore((s) => s.targetLanguage);

  useEffect(() => {
    setStories(null);
    getStories(targetLanguage ?? undefined)
      .then(setStories)
      .catch((err) => setError(String(err)));
  }, [targetLanguage]);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        Library
      </h1>

      <div className="mb-4">
        <LanguageSelector />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {!error && !stories && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading…
        </p>
      )}
      {!error && stories?.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No stories yet for this language.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {stories?.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}
