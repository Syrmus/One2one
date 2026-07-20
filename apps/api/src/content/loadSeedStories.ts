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

const stories = loadAll();

export function getStories(lang?: string): Story[] {
  return lang ? stories.filter((s) => s.l2 === lang) : stories;
}

export function getStoryById(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}
