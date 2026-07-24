import type { StoryStatus } from "../../lib/progress";
import { useT } from "../../lib/i18n";

const GLYPH: Record<Exclude<StoryStatus, "unopened">, string> = {
  started: "◌",
  read: "◐",
  woven: "◉",
};

const COLOR: Record<Exclude<StoryStatus, "unopened">, string> = {
  started: "text-stone-400 dark:text-slate-500",
  read: "text-sage-500",
  woven: "text-dusk-600 dark:text-dusk-500",
};

export function StoryStatusBadge({ status }: { status: StoryStatus }) {
  const t = useT();
  if (status === "unopened") return null;

  const label =
    status === "started"
      ? t.storyStatusStarted
      : status === "read"
        ? t.storyStatusRead
        : t.storyStatusWoven;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${COLOR[status]}`}
    >
      <span aria-hidden>{GLYPH[status]}</span>
      {label}
    </span>
  );
}
