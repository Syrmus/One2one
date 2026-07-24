import { Link } from "react-router-dom";
import type { Story } from "@weave/shared";
import { useReaderStore } from "../../store/readerStore";
import { storyProgress } from "../../lib/progress";
import { wordCount } from "../../lib/text";
import { useT } from "../../lib/i18n";

export function StoryCard({ story }: { story: Story }) {
  const t = useT();
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const { seen, total, ratio } = storyProgress(story, vocabulary);

  return (
    <Link
      to={`/reader/${story.id}`}
      className="block rounded-3xl border border-cream-100 bg-white p-4 shadow-sm active:scale-[0.99] transition dark:border-slate-700 dark:bg-slate-800"
    >
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {story.title}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {story.level} · {t.wordsCount(wordCount(story))}
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cream-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-sage-500"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {t.lemmasSeen(seen, total)}
      </p>
    </Link>
  );
}
