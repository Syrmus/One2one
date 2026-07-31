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

// The pre-v2 B1 stories only weave ~16 of ~130 words (12% coverage), so the
// density slider can never reach 100% on them — they don't fit the v2
// full-coverage model and haven't been reworked yet. Hidden by base slug
// (the id minus its `{l2}-{l1}-` prefix) across every language pair, without
// deleting the files. Remove a slug here once its story is reworked to full
// coverage. The new B1 `stone-desert-film-01` is full-coverage, so it stays.
const HIDDEN_STORY_SLUGS = new Set([
  "eternal-honey-02",
  "mere-exposure-01",
  "octopus-mind-05",
  "thirty-six-questions-03",
  "waiter-memory-04",
]);

function baseSlug(id: string): string {
  return id.replace(/^[a-z]{2}-[a-z]{2}-/, "");
}

const stories = loadAll().filter((s) => !HIDDEN_STORY_SLUGS.has(baseSlug(s.id)));

export function getStories(lang?: string, nativeLang?: string): Story[] {
  return stories.filter(
    (s) => (!lang || s.l2 === lang) && (!nativeLang || s.l1 === nativeLang),
  );
}

export function getStoryById(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}
