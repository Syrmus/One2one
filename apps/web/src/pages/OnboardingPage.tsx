import { useEffect, useState } from "react";
import { getLanguages, type Language } from "../lib/api";
import { langInfo, NATIVE_LANGUAGES } from "../lib/languages";
import { detectLocale, I18nProvider, useT, type Locale } from "../lib/i18n";
import { updateUser } from "../lib/authClient";

type Props = {
  onComplete: () => void;
};

export function OnboardingPage({ onComplete }: Props) {
  const [locale, setLocale] = useState<Locale>(detectLocale());

  return (
    <I18nProvider locale={locale}>
      <OnboardingSteps onComplete={onComplete} onNativePicked={setLocale} />
    </I18nProvider>
  );
}

function OnboardingSteps({
  onComplete,
  onNativePicked,
}: Props & { onNativePicked: (l: Locale) => void }) {
  const t = useT();
  const [step, setStep] = useState<1 | 2>(1);
  const [native, setNative] = useState<Locale | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch(() => {});
  }, []);

  function pickNative(code: Locale) {
    setNative(code);
    onNativePicked(code);
  }

  async function finish() {
    if (!native || !target || saving) return;
    setSaving(true);
    await updateUser({ nativeLanguage: native, targetLanguage: target });
    onComplete();
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <img src="/cat-mascot.png" alt="" className="w-40" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t.appName}
        </h1>
        <p className="mt-2 max-w-xs text-base text-slate-700 dark:text-slate-200">
          {step === 1 ? t.onboardingNativeTitle : t.onboardingTargetTitle}
        </p>
      </div>

      {step === 1 ? (
        <div className="grid w-full max-w-xs grid-cols-2 gap-3">
          {NATIVE_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => pickNative(l.code)}
              className={`rounded-2xl border-2 bg-white px-4 py-5 text-center transition dark:bg-slate-800 ${
                native === l.code
                  ? "border-sage-500"
                  : "border-cream-100 dark:border-slate-700"
              }`}
            >
              <div className="text-3xl">{l.flag}</div>
              <div className="mt-2 font-medium text-slate-900 dark:text-slate-100">
                {l.label}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid w-full max-w-xs grid-cols-2 gap-3">
          {languages.map((lang) => {
            const info = langInfo(lang.code);
            const active = target === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setTarget(lang.code)}
                className={`rounded-2xl border-2 px-4 py-5 text-center transition ${
                  active ? "border-sage-500" : "border-transparent"
                } ${info.className}`}
              >
                <div className="text-3xl">{info.flag}</div>
                <div className="mt-2 font-medium">{info.nativeName}</div>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 ? (
        <button
          type="button"
          disabled={!native}
          onClick={() => setStep(2)}
          className="w-full max-w-xs rounded-2xl bg-sage-500 py-3 font-medium text-white transition disabled:bg-cream-100 disabled:text-stone-400"
        >
          {t.next}
        </button>
      ) : (
        <button
          type="button"
          disabled={!target || saving}
          onClick={finish}
          className="w-full max-w-xs rounded-2xl bg-sage-500 py-3 font-medium text-white transition disabled:bg-cream-100 disabled:text-stone-400"
        >
          {t.start}
        </button>
      )}

      <p className="text-xs text-slate-400">{t.onboardingHint}</p>
    </div>
  );
}
