import { Link } from "react-router-dom";
import type { Story } from "@weave/shared";
import { DEFAULT_STEPS } from "@weave/shared";
import { useReaderStore } from "../../store/readerStore";
import { storyProgress, storyStatus } from "../../lib/progress";
import { wordCount } from "../../lib/text";
import { useT } from "../../lib/i18n";
import { StoryStatusBadge } from "./StoryStatusBadge";

export function StoryCard({ story }: { story: Story }) {
  const t = useT();
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const { seen, total, ratio } = storyProgress(story, vocabulary);

  const maxStep = useReaderStore(
    (s) => s.maxCompletedStepByStory[story.id] ?? 0,
  );
  const hasProgress = useReaderStore(
    (s) =>
      story.id in s.openedByStory ||
      story.id in s.densityByStory ||
      story.id in s.scrollByStory,
  );
  const status = storyStatus({ hasProgress, maxCompletedStep: maxStep });
  const maxDensityTarget = DEFAULT_STEPS[maxStep]?.target ?? 0;

  return (
    <Link
      to={`/reader/${story.id}`}
      className="block rounded-3xl border border-cream-100 bg-white p-4 shadow-sm active:scale-[0.99] transition dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {story.title}
        </h3>
        <StoryStatusBadge status={status} />
      </div>
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
        {t.storyMaxDensity(maxDensityTarget)} · {t.lemmasSeen(seen, total)}
      </p>
    </Link>
  );
}
