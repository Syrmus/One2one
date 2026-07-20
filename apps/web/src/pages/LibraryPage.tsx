import { useEffect, useState } from "react";
import type { Story } from "@weave/shared";
import { getStories } from "../lib/api";
import { StoryCard } from "../components/library/StoryCard";

export function LibraryPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStories()
      .then(setStories)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        Library
      </h1>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!error && !stories && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading…
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
