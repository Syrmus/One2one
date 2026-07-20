import type { StoryUnit } from "./story";

export type LevelPreset = "A1-lite" | "A1" | "A2";

export const LEVEL_PRESETS: Record<LevelPreset, number> = {
  "A1-lite": 3,
  A1: 8,
  A2: 15,
};

export const MIN_THRESHOLD = 0;
export const MAX_THRESHOLD = 20;

export function isWoven(unit: StoryUnit, threshold: number): boolean {
  return unit.t === "weave" && unit.weave_priority <= threshold;
}

export function displayText(unit: StoryUnit, threshold: number): string {
  if (unit.t === "text") return unit.l1;
  return isWoven(unit, threshold) ? unit.l2 : unit.l1;
}
