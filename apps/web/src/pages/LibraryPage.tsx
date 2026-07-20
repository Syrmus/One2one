import { useEffect, useState } from "react";
import type { Story } from "@weave/shared";
import { getLanguages, getStories, type Language } from "../lib/api";
import { StoryCard } from "../components/library/StoryCard";
import { signOut, useSession } from "../lib/authClient";
import { useReaderStore } from "../store/readerStore";
import { langInfo } from "../lib/languages";

export function LibraryPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const targetLanguage = useReaderStore((s) => s.targetLanguage);
  const setTargetLanguage = useReaderStore((s) => s.setTargetLanguage);

  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    setStories(null);
    getStories(targetLanguage ?? undefined)
      .then(setStories)
      .catch((err) => setError(String(err)));
  }, [targetLanguage]);

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

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTargetLanguage(null)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            targetLanguage === null
              ? "bg-blue-500 text-white"
              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          }`}
        >
          All languages
        </button>
        {languages.map((l) => {
          const info = langInfo(l.code);
          const active = targetLanguage === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setTargetLanguage(l.code)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "bg-blue-500 text-white"
                  : info.className
              }`}
            >
              {info.flag} {l.label}
            </button>
          );
        })}
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
