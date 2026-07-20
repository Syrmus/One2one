import { storySchema, type Story } from "@weave/shared";

const modules = import.meta.glob("../content/seed/**/*.json", {
  eager: true,
}) as Record<string, { default: unknown }>;

function loadAll(): Story[] {
  const stories: Story[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const result = storySchema.safeParse(mod.default);
    if (!result.success) {
      console.error(`Invalid seed story at ${path}:`, result.error.format());
      continue;
    }
    stories.push(result.data);
  }
  return stories.sort((a, b) => a.title.localeCompare(b.title));
}

const stories = loadAll();

export function getStories(): Story[] {
  return stories;
}

export function getStoryById(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}

export function wordCount(story: Story): number {
  return story.units
    .map((u) => u.l1)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}
