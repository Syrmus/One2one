import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { storySchema, type Story } from "@weave/shared";

const seedDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "seed",
);

function walkJsonFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkJsonFiles(full);
    return entry.name.endsWith(".json") ? [full] : [];
  });
}

function loadAll(): Story[] {
  const stories: Story[] = [];
  for (const file of walkJsonFiles(seedDir)) {
    const raw = JSON.parse(readFileSync(file, "utf-8"));
    const result = storySchema.safeParse(raw);
    if (!result.success) {
      console.error(`Invalid seed story at ${file}:`, result.error.format());
      continue;
    }
    stories.push(result.data);
  }
  return stories.sort((a, b) => a.title.localeCompare(b.title));
}

// The old B1 stories predate the v2 full-coverage weaving model (they only
// weave ~16 words out of ~130 and never reach true 100% density) and haven't
// been reworked yet — STORY_GENERATION_SPEC.md §3 flags this explicitly as
// still-needed follow-up work. Hidden from the app for now without deleting
// the files, so they're easy to bring back once a reworked B1 set replaces
// them — just remove this filter.
const HIDDEN_LEVELS = new Set(["B1"]);
const stories = loadAll().filter((s) => !HIDDEN_LEVELS.has(s.level));

export function getStories(lang?: string, nativeLang?: string): Story[] {
  return stories.filter(
    (s) => (!lang || s.l2 === lang) && (!nativeLang || s.l1 === nativeLang),
  );
}

export function getStoryById(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}
