import type { Story } from "@weave/shared";

export function wordCount(story: Story): number {
  return story.units
    .map((u) => u.l1)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}
