export const VOCAB_MILESTONES = [10, 25, 50, 100, 200, 500, 1000] as const;

export function nextMilestone(count: number): number | undefined {
  return VOCAB_MILESTONES.find((m) => m > count);
}

export function previousMilestone(count: number): number {
  let prev = 0;
  for (const m of VOCAB_MILESTONES) {
    if (m > count) break;
    prev = m;
  }
  return prev;
}
