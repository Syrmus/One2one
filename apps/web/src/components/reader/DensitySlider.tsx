import { DEFAULT_STEPS, MIN_STEP, MAX_STEP } from "@weave/shared";
import { useT } from "../../lib/i18n";

type Props = {
  step: number;
  onChange: (step: number) => void;
};

// Quick-select shortcuts mapped to representative steps — replaces the old
// CEFR-named presets (A1-lite/A1/A2), which no longer make sense now that a
// story's level and the reader's density are independent axes (see
// STORY_GENERATION_SPEC.md §2).
const SHORTCUTS = [0, 3, MAX_STEP] as const;

export function DensitySlider({ step, onChange }: Props) {
  const t = useT();
  // Defends against stale localStorage values from before the v2 density
  // rewrite, when densityByStory held a weave_priority threshold (e.g. 15)
  // instead of a step index (0-6) — DEFAULT_STEPS[15] would otherwise be
  // undefined and crash on `.target`.
  const clampedStep = Math.max(MIN_STEP, Math.min(MAX_STEP, step));
  const config = DEFAULT_STEPS[clampedStep]!;
  const shortcutLabels = [t.densityLight, t.densityMedium, t.densityFull];

  return (
    <div className="rounded-3xl border border-cream-100 bg-cream-50/95 p-4 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-600 dark:text-slate-300">
          {t.density}
        </span>
        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-slate-700 dark:text-slate-300">
          {t.densityPercent(config.target)}
        </span>
      </div>
      <input
        type="range"
        min={MIN_STEP}
        max={MAX_STEP}
        step={1}
        value={clampedStep}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-paw mt-3 w-full"
      />
      <div className="mt-3 flex gap-2">
        {SHORTCUTS.map((shortcutStep, i) => (
          <button
            key={shortcutStep}
            type="button"
            onClick={() => onChange(shortcutStep)}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${
              clampedStep === shortcutStep
                ? "bg-sage-500 text-white"
                : "bg-cream-100 text-stone-600 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {shortcutLabels[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
