import type { WeaveUnit } from "@weave/shared";
import { useT } from "../../lib/i18n";

type Props = {
  unit: WeaveUnit;
  seenCount: number;
  added: boolean;
  onAdd: () => void;
  onClose: () => void;
};

export function WeavePopover({ unit, seenCount, added, onAdd, onClose }: Props) {
  const t = useT();

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.originalL1}
        </p>
        <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {unit.l1}
        </p>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-slate-500 dark:text-slate-400">{t.lemma}</dt>
          <dd className="text-slate-800 dark:text-slate-200">
            {unit.article ? `${unit.article} ` : ""}
            {unit.lemma}
          </dd>

          {unit.gender && (
            <>
              <dt className="text-slate-500 dark:text-slate-400">
                {t.gender}
              </dt>
              <dd className="text-slate-800 dark:text-slate-200">
                {unit.gender}
              </dd>
            </>
          )}

          {unit.ipa && (
            <>
              <dt className="text-slate-500 dark:text-slate-400">{t.ipa}</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                /{unit.ipa}/
              </dd>
            </>
          )}

          <dt className="text-slate-500 dark:text-slate-400">{t.gloss}</dt>
          <dd className="text-slate-800 dark:text-slate-200">
            {unit.gloss}
          </dd>

          <dt className="text-slate-500 dark:text-slate-400">{t.seen}</dt>
          <dd className="text-slate-800 dark:text-slate-200">
            {t.seenTimes(seenCount)}
          </dd>
        </dl>

        <button
          type="button"
          disabled={added}
          onClick={onAdd}
          className="mt-5 w-full rounded-2xl bg-dusk-500 py-3 text-center font-medium text-white active:bg-dusk-600 disabled:bg-sage-500"
        >
          {added ? t.added : t.addToVocabulary}
        </button>
      </div>
    </div>
  );
}
