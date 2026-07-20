import { create } from "zustand";
import { persist } from "zustand/middleware";
import { postSeen } from "../lib/api";

export type VocabEntry = {
  lemma: string;
  lang: string;
  gloss: string;
  firstSeenAt: number;
  seenCount: number;
};

type ReaderState = {
  densityByStory: Record<string, number>;
  scrollByStory: Record<string, number>;
  vocabulary: Record<string, VocabEntry>;
  targetLanguage: string | null;
  setDensity: (storyId: string, threshold: number) => void;
  setScroll: (storyId: string, position: number) => void;
  recordEncounter: (lang: string, lemma: string, gloss: string) => void;
  setTargetLanguage: (lang: string | null) => void;
};

function vocabKey(lang: string, lemma: string) {
  return `${lang}:${lemma}`;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      densityByStory: {},
      scrollByStory: {},
      vocabulary: {},
      targetLanguage: null,
      setDensity: (storyId, threshold) =>
        set((s) => ({
          densityByStory: { ...s.densityByStory, [storyId]: threshold },
        })),
      setScroll: (storyId, position) =>
        set((s) => ({
          scrollByStory: { ...s.scrollByStory, [storyId]: position },
        })),
      recordEncounter: (lang, lemma, gloss) => {
        set((s) => {
          const key = vocabKey(lang, lemma);
          const existing = s.vocabulary[key];
          const entry: VocabEntry = existing
            ? { ...existing, seenCount: existing.seenCount + 1 }
            : { lemma, lang, gloss, firstSeenAt: Date.now(), seenCount: 1 };
          return { vocabulary: { ...s.vocabulary, [key]: entry } };
        });
        // Fire-and-forget: localStorage above already keeps the UI instant,
        // this just persists the same encounter to the backend (FR-6).
        void postSeen(lang, lemma, gloss);
      },
      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
    }),
    { name: "weave-reader-store" },
  ),
);
