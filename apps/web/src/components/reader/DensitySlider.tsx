import {
  LEVEL_PRESETS,
  MIN_THRESHOLD,
  MAX_THRESHOLD,
  type LevelPreset,
} from "@weave/shared";

type Props = {
  threshold: number;
  onChange: (t: number) => void;
};

const PRESETS = Object.keys(LEVEL_PRESETS) as LevelPreset[];

export function DensitySlider({ threshold, onChange }: Props) {
  const activePreset = PRESETS.find((p) => LEVEL_PRESETS[p] === threshold);

  return (
    <div className="rounded-3xl border border-cream-100 bg-cream-50/95 p-4 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-600 dark:text-slate-300">
          Density
        </span>
        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-slate-700 dark:text-slate-300">
          {activePreset ?? "Custom"}
        </span>
      </div>
      <input
        type="range"
        min={MIN_THRESHOLD}
        max={MAX_THRESHOLD}
        value={threshold}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-paw mt-3 w-full"
      />
      <div className="mt-3 flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(LEVEL_PRESETS[preset])}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${
              activePreset === preset
                ? "bg-sage-500 text-white"
                : "bg-cream-100 text-stone-600 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
