import { getStories } from "../lib/loadStories";
import { StoryCard } from "../components/library/StoryCard";

export function LibraryPage() {
  const stories = getStories();

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        Library
      </h1>
      <div className="flex flex-col gap-3">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}
