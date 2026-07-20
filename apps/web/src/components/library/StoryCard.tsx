import { Link } from "react-router-dom";
import type { Story } from "@weave/shared";
import { useReaderStore } from "../../store/readerStore";
import { storyProgress } from "../../lib/progress";
import { wordCount } from "../../lib/text";
import { langInfo } from "../../lib/languages";

export function StoryCard({ story }: { story: Story }) {
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const { seen, total, ratio } = storyProgress(story, vocabulary);
  const lang = langInfo(story.l2);

  return (
    <Link
      to={`/reader/${story.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99] transition dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {story.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${lang.className}`}
        >
          {lang.flag} {lang.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {story.level} · {wordCount(story)} words
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-blue-400"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {seen}/{total} lemmas seen
      </p>
    </Link>
  );
}
