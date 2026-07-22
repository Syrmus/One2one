import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "../lib/i18n";

type LocaleState = {
  locale: Locale | null;
  setLocale: (locale: Locale) => void;
};

// Only used pre-auth (sign-in screen, /about before login). Once a session
// exists, session.user.nativeLanguage is the source of truth for locale.
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: null,
      setLocale: (locale) => set({ locale }),
    }),
    { name: "weave-locale-store" },
  ),
);
