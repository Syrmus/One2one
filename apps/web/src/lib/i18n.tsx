import { createContext, useContext, type ReactNode } from "react";

export type Locale = "en" | "ru";

const dict = {
  en: {
    appName: "Weave",
    signInSubtitle: "Sign in to start reading.",
    signInWithGoogle: "Sign in with Google",
    onboardingNativeTitle: "Which language is easier for you to read the app in?",
    onboardingTargetTitle: "Which language do you want to learn?",
    onboardingHint: "You can change this later in Settings",
    next: "Next",
    start: "Start",
    library: "Library",
    progress: "Progress",
    settings: "Settings",
    loading: "Loading…",
    noStoriesForLanguage: "No stories yet for this language.",
    lemmasSeen: (seen: number, total: number) => `${seen}/${total} lemmas seen`,
    wordsCount: (n: number) => `${n} words`,
    myVocabulary: "My Vocabulary",
    vocabularyEmpty: "Words you tap in the reader will show up here.",
    languages: "Languages",
    nativeLanguage: "Native Language",
    learning: "Learning",
    signOut: "Sign out",
    backToLibrary: "← Library",
    storyNotFound: "Story not found.",
    density: "Density",
    custom: "Custom",
    originalL1: "Original L1",
    lemma: "Lemma",
    gender: "Gender",
    ipa: "IPA",
    gloss: "Gloss",
    seen: "Seen",
    seenTimes: (n: number) => `${n} time${n === 1 ? "" : "s"}`,
    added: "Added ✓",
    addToVocabulary: "Add to my vocabulary",
    aboutMethodLink: "About the app and method",
    back: "← Back",
    densityLight: "Light",
    densityMedium: "Medium",
    densityFull: "Full",
    densityPercent: (n: number) => `${n}% of words`,
  },
  ru: {
    appName: "Weave",
    signInSubtitle: "Войдите, чтобы начать читать.",
    signInWithGoogle: "Войти через Google",
    onboardingNativeTitle: "На каком языке вам удобнее читать интерфейс?",
    onboardingTargetTitle: "Какой язык хотите учить?",
    onboardingHint: "Это можно изменить позже в настройках",
    next: "Далее",
    start: "Начать",
    library: "Библиотека",
    progress: "Прогресс",
    settings: "Настройки",
    loading: "Загрузка…",
    noStoriesForLanguage: "Пока нет историй на этом языке.",
    lemmasSeen: (seen: number, total: number) => `${seen}/${total} слов изучено`,
    wordsCount: (n: number) => `${n} слов`,
    myVocabulary: "Мой словарь",
    vocabularyEmpty: "Слова, на которые вы нажимаете в тексте, появятся здесь.",
    languages: "Языки",
    nativeLanguage: "Родной язык",
    learning: "Изучаю",
    signOut: "Выйти",
    backToLibrary: "← Библиотека",
    storyNotFound: "История не найдена.",
    density: "Плотность",
    custom: "Свой",
    originalL1: "Оригинал",
    lemma: "Слово",
    gender: "Род",
    ipa: "МФА",
    gloss: "Перевод",
    seen: "Встречалось",
    seenTimes: (n: number) => `${n} раз`,
    added: "Добавлено ✓",
    addToVocabulary: "Добавить в словарь",
    aboutMethodLink: "О приложении и методе",
    back: "← Назад",
    densityLight: "Лёгкая",
    densityMedium: "Средняя",
    densityFull: "Полная",
    densityPercent: (n: number) => `${n}% слов`,
  },
} satisfies Record<Locale, Record<string, unknown>>;

type Dict = (typeof dict)["en"];

const I18nContext = createContext<Dict>(dict.en);

export function detectLocale(): Locale {
  return typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("ru")
    ? "ru"
    : "en";
}

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={dict[locale]}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT(): Dict {
  return useContext(I18nContext);
}
