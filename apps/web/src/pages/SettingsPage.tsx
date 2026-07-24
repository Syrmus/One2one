import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { signOut, useSession, updateUser } from "../lib/authClient";
import { SettingsIcon } from "../components/nav/icons";
import { getLanguages, type Language } from "../lib/api";
import { langInfo, NATIVE_LANGUAGES } from "../lib/languages";
import { useFontSizeStore, type FontScale } from "../store/fontSizeStore";
import { useT, type Locale } from "../lib/i18n";

const FONT_SCALES: FontScale[] = ["normal", "large", "xlarge"];

type Picker = "native" | "target" | null;

export function SettingsPage() {
  const t = useT();
  const { data: session, refetch } = useSession();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [picker, setPicker] = useState<Picker>(null);
  const [saving, setSaving] = useState(false);
  const fontScale = useFontSizeStore((s) => s.fontScale);
  const setFontScale = useFontSizeStore((s) => s.setFontScale);

  const fontScaleLabel: Record<FontScale, string> = {
    normal: t.fontSizeNormal,
    large: t.fontSizeLarge,
    xlarge: t.fontSizeXLarge,
  };

  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch(() => {});
  }, []);

  const nativeCode = session?.user.nativeLanguage as Locale | undefined;
  const targetCode = session?.user.targetLanguage;
  const nativeInfo = NATIVE_LANGUAGES.find((l) => l.code === nativeCode);
  const targetInfo = targetCode ? langInfo(targetCode) : undefined;

  async function pickNative(code: Locale) {
    setSaving(true);
    await updateUser({ nativeLanguage: code });
    await refetch();
    setSaving(false);
    setPicker(null);
  }

  async function pickTarget(code: string) {
    setSaving(true);
    await updateUser({ targetLanguage: code });
    await refetch();
    setSaving(false);
    setPicker(null);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.settings}
        </h1>
        <SettingsIcon className="h-6 w-6 text-stone-400 dark:text-slate-500" />
      </div>

      {session && (
        <div className="mb-4 rounded-2xl border border-cream-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {session.user.name ?? session.user.email}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {session.user.email}
          </p>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-cream-100 bg-cream-100/60 dark:border-slate-700 dark:bg-slate-800">
        <p className="px-4 pt-4 text-sm font-semibold text-stone-600 dark:text-slate-300">
          {t.languages}
        </p>

        <button
          type="button"
          onClick={() => setPicker("native")}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              {t.nativeLanguage}
            </p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {nativeInfo ? `${nativeInfo.flag} ${nativeInfo.label}` : "—"}
            </p>
          </div>
          <span className="text-stone-400">›</span>
        </button>

        <div className="mx-4 h-px bg-cream-100 dark:bg-slate-700" />

        <button
          type="button"
          onClick={() => setPicker("target")}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              {t.learning}
            </p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {targetInfo ? `${targetInfo.flag} ${targetInfo.nativeName}` : "—"}
            </p>
          </div>
          <span className="text-stone-400">›</span>
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-cream-100 bg-cream-100/60 p-4 dark:border-slate-700 dark:bg-slate-800">
        <p className="mb-3 text-sm font-semibold text-stone-600 dark:text-slate-300">
          {t.fontSize}
        </p>
        <div className="flex gap-2">
          {FONT_SCALES.map((scale) => (
            <button
              key={scale}
              type="button"
              onClick={() => setFontScale(scale)}
              className={`flex-1 rounded-2xl border-2 py-2 text-sm font-medium ${
                fontScale === scale
                  ? "border-sage-500 text-slate-900 dark:text-slate-100"
                  : "border-cream-100 text-stone-500 dark:border-slate-700 dark:text-slate-400"
              }`}
              style={{
                fontSize:
                  scale === "large" ? "1.0625rem" : scale === "xlarge" ? "1.125rem" : undefined,
              }}
            >
              {fontScaleLabel[scale]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => signOut()}
        className="w-full rounded-2xl border border-red-200 py-3 text-center font-medium text-red-600 dark:border-red-900 dark:text-red-400"
      >
        {t.signOut}
      </button>

      <Link
        to="/about"
        className="mt-4 block text-center text-sm text-dusk-600 dark:text-dusk-500"
      >
        {t.aboutMethodLink}
      </Link>

      <img
        src="/cat-mascot.png"
        alt=""
        className="mx-auto mt-8 w-32 opacity-90"
      />

      {picker && (
        <div className="fixed inset-0 z-50" onClick={() => setPicker(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            <p className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {picker === "native" ? t.nativeLanguage : t.learning}
            </p>
            <div className="flex flex-col gap-2 pb-2">
              {picker === "native"
                ? NATIVE_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      disabled={saving}
                      onClick={() => pickNative(l.code)}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${
                        nativeCode === l.code
                          ? "border-sage-500"
                          : "border-cream-100 dark:border-slate-700"
                      }`}
                    >
                      <span className="text-xl">{l.flag}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {l.label}
                      </span>
                    </button>
                  ))
                : languages.map((lang) => {
                    const info = langInfo(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        disabled={saving}
                        onClick={() => pickTarget(lang.code)}
                        className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${
                          targetCode === lang.code
                            ? "border-sage-500"
                            : "border-cream-100 dark:border-slate-700"
                        }`}
                      >
                        <span className="text-xl">{info.flag}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {info.nativeName}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
