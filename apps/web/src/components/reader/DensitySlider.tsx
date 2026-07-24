import { DEFAULT_STEPS, MIN_STEP, MAX_STEP } from "@weave/shared";
import { useT } from "../../lib/i18n";

type Props = {
  step: number;
  onChange: (step: number) => void;
};

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DensitySlider({ step, onChange }: Props) {
  const t = useT();
  // Defends against stale localStorage values from before the v2 density
  // rewrite, when densityByStory held a weave_priority threshold instead of
  // a step index — DEFAULT_STEPS[n] would otherwise be undefined.
  const clampedStep = Math.max(MIN_STEP, Math.min(MAX_STEP, step));
  const config = DEFAULT_STEPS[clampedStep]!;

  const label =
    clampedStep === MIN_STEP
      ? t.densityOriginal
      : clampedStep === MAX_STEP
        ? t.densityFull
        : t.densityPercent(config.target);

  return (
    <div className="rounded-3xl border border-cream-100 bg-cream-50/95 p-4 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-600 dark:text-slate-300">
          {t.density}
        </span>
        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="previous"
          disabled={clampedStep <= MIN_STEP}
          onClick={() => onChange(clampedStep - 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-100 text-stone-600 transition disabled:opacity-30 dark:bg-slate-700 dark:text-slate-300"
        >
          <ChevronLeftIcon />
        </button>

        <input
          type="range"
          className="range-paw w-full"
          min={MIN_STEP}
          max={MAX_STEP}
          step={1}
          value={clampedStep}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        <button
          type="button"
          aria-label="next"
          disabled={clampedStep >= MAX_STEP}
          onClick={() => onChange(clampedStep + 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-100 text-stone-600 transition disabled:opacity-30 dark:bg-slate-700 dark:text-slate-300"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
