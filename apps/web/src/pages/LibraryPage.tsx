import { useEffect, useState } from "react";
import type { Story } from "@weave/shared";
import { getStories } from "../lib/api";
import { StoryCard } from "../components/library/StoryCard";
import { LibraryIcon } from "../components/nav/icons";
import { useSession } from "../lib/authClient";
import { useT } from "../lib/i18n";

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
        <LibraryIcon className="h-6 w-6 text-stone-400 dark:text-slate-500" />
      </div>

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
      <div className="flex flex-col gap-3">
        {stories?.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}
