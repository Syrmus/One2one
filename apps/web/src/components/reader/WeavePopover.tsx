import { useEffect } from "react";
import type { WeaveUnit } from "@weave/shared";
import { useT } from "../../lib/i18n";
import { isSpeechSupported, speak, stopSpeaking } from "../../lib/speech";

type Props = {
  unit: WeaveUnit;
  lang: string;
  seenCount: number;
  added: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
};

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M11 5 6 9H3v6h3l5 4V5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a4 4 0 0 1 0 7M18 6a7 7 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WeavePopover({
  unit,
  lang,
  seenCount,
  added,
  onAdd,
  onRemove,
  onClose,
}: Props) {
  const t = useT();

  // Stop any playback when the popover closes.
  useEffect(() => stopSpeaking, []);

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
          <dd className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <span>
              {unit.article ? `${unit.article} ` : ""}
              {unit.lemma}
            </span>
            {isSpeechSupported() && (
              <button
                type="button"
                aria-label={t.listen}
                onClick={() =>
                  speak(
                    `${unit.article ? `${unit.article} ` : ""}${unit.lemma}`,
                    lang,
                  )
                }
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-100 text-dusk-600 active:bg-cream-200 dark:bg-slate-700 dark:text-dusk-400"
              >
                <SpeakerIcon />
              </button>
            )}
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

        {unit.proper_noun ? (
          <p className="mt-5 text-center text-sm text-slate-400 dark:text-slate-500">
            {t.properNounNote}
          </p>
        ) : (
          <button
            type="button"
            onClick={added ? onRemove : onAdd}
            className={
              added
                ? "mt-5 w-full rounded-2xl border border-slate-300 bg-transparent py-3 text-center font-medium text-slate-600 active:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:active:bg-slate-700"
                : "mt-5 w-full rounded-2xl bg-dusk-500 py-3 text-center font-medium text-white active:bg-dusk-600"
            }
          >
            {added ? t.removeFromVocabulary : t.addToVocabulary}
          </button>
        )}
      </div>
    </div>
  );
}
