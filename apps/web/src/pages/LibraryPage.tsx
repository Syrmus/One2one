import { useEffect, useState } from "react";
import type { Story } from "@weave/shared";
import { getStories } from "../lib/api";
import { StoryCard } from "../components/library/StoryCard";
import { signOut, useSession } from "../lib/authClient";

export function LibraryPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    getStories()
      .then(setStories)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Library
        </h1>
        {session && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{session.user.name ?? session.user.email}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-blue-500"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
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
