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
    vocabularyTab: "Vocabulary",
    settings: "Settings",
    loading: "Loading…",
    noStoriesForLanguage: "No stories yet for this language.",
    lemmasSeen: (seen: number, total: number) => `${seen}/${total} lemmas seen`,
    wordsCount: (n: number) => `${n} words`,
    myVocabulary: "My Vocabulary",
    vocabularyEmpty: "Words you tap in the reader will show up here.",
    addedWords: "Added words",
    allEncounteredWords: "All encountered words",
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
    removeFromVocabulary: "Remove from my vocabulary",
    aboutMethodLink: "About the app and method",
    back: "← Back",
    densityOriginal: "Original",
    densityFull: "Fully translated",
    densityPercent: (n: number) => `${n}% of words`,
    densityStepOf: (step: number, total: number) => `${step}/${total}`,
    quizShort: "Test",
    startQuiz: "Test yourself",
    quizNotEnoughWords: "Not enough words yet for a quiz.",
    quizFinished: "Done!",
    quizNoMistakes: "No mistakes — well done!",
    quizMistakes: (n: number) => `${n} mistake${n === 1 ? "" : "s"}`,
    vocabMilestone: (n: number) => `${n} words in your vocabulary!`,
    vocabMilestoneProgress: (n: number, next: number) =>
      `${n}/${next} words to next milestone`,
    thisWeek: "This week",
    weeklyNewWords: (n: number) => `New words: ${n}`,
    weeklyAddedWords: (n: number) => `Added: ${n}`,
    fontSize: "Font size",
    fontSizeNormal: "Normal",
    fontSizeLarge: "Larger",
    fontSizeXLarge: "Largest",
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
    vocabularyTab: "Словарь",
    settings: "Настройки",
    loading: "Загрузка…",
    noStoriesForLanguage: "Пока нет историй на этом языке.",
    lemmasSeen: (seen: number, total: number) => `${seen}/${total} слов изучено`,
    wordsCount: (n: number) => `${n} слов`,
    myVocabulary: "Мой словарь",
    vocabularyEmpty: "Слова, на которые вы нажимаете в тексте, появятся здесь.",
    addedWords: "Добавленные слова",
    allEncounteredWords: "Все встреченные слова",
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
    removeFromVocabulary: "Убрать из словаря",
    aboutMethodLink: "О приложении и методе",
    back: "← Назад",
    densityOriginal: "Оригинал",
    densityFull: "Полностью переведено",
    densityPercent: (n: number) => `${n}% слов`,
    densityStepOf: (step: number, total: number) => `${step}/${total}`,
    quizShort: "Тест",
    startQuiz: "Пройти тест",
    quizNotEnoughWords: "Пока недостаточно слов для теста.",
    quizFinished: "Готово!",
    quizNoMistakes: "Без ошибок — отлично!",
    quizMistakes: (n: number) => `Ошибок: ${n}`,
    vocabMilestone: (n: number) => `${n} слов в словаре!`,
    vocabMilestoneProgress: (n: number, next: number) =>
      `${n}/${next} слов до следующей вехи`,
    thisWeek: "На этой неделе",
    weeklyNewWords: (n: number) => `Новые слова: ${n}`,
    weeklyAddedWords: (n: number) => `Добавлено: ${n}`,
    fontSize: "Размер шрифта",
    fontSizeNormal: "Обычный",
    fontSizeLarge: "Крупнее",
    fontSizeXLarge: "Ещё крупнее",
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
