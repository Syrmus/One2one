export type LangInfo = {
  flag: string;
  label: string;
  nativeName: string;
  className: string;
};

export const LANG_INFO: Record<string, LangInfo> = {
  de: {
    flag: "🇩🇪",
    label: "DE",
    nativeName: "Deutsch",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  nl: {
    flag: "🇳🇱",
    label: "NL",
    nativeName: "Nederlands",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  es: {
    flag: "🇪🇸",
    label: "ES",
    nativeName: "Español",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

export function langInfo(code: string): LangInfo {
  return (
    LANG_INFO[code] ?? {
      flag: "",
      label: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    }
  );
}

export const NATIVE_LANGUAGES: { code: "en" | "ru"; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
];
