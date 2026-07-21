import { useEffect, useState } from "react";
import { getLanguages, type Language } from "../../lib/api";
import { langInfo } from "../../lib/languages";
import { useReaderStore } from "../../store/readerStore";

export function LanguageSelector() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const targetLanguage = useReaderStore((s) => s.targetLanguage);
  const setTargetLanguage = useReaderStore((s) => s.setTargetLanguage);

  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setTargetLanguage(null)}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          targetLanguage === null
            ? "bg-sage-500 text-white"
            : "bg-cream-100 text-stone-600 dark:bg-slate-700 dark:text-slate-300"
        }`}
      >
        All languages
      </button>
      {languages.map((l) => {
        const info = langInfo(l.code);
        const active = targetLanguage === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setTargetLanguage(l.code)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              active ? "bg-sage-500 text-white" : info.className
            }`}
          >
            {info.flag} {l.label}
          </button>
        );
      })}
    </div>
  );
}
