import { create } from "zustand";
import { persist } from "zustand/middleware";
import { postSeen } from "../lib/api";

export type VocabEntry = {
  lemma: string;
  lang: string;
  gloss: string;
  firstSeenAt: number;
  seenCount: number;
  // Set only when the user explicitly taps "Add to my vocabulary" in the
  // popover — distinct from just having encountered the word by tapping it
  // in the reader (which alone only affects seenCount/firstSeenAt).
  added: boolean;
};

type ReaderState = {
  densityByStory: Record<string, number>;
  scrollByStory: Record<string, number>;
  vocabulary: Record<string, VocabEntry>;
  setDensity: (storyId: string, step: number) => void;
  setScroll: (storyId: string, position: number) => void;
  recordEncounter: (lang: string, lemma: string, gloss: string) => void;
  markAdded: (lang: string, lemma: string) => void;
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
      setDensity: (storyId, step) =>
        set((s) => ({
          densityByStory: { ...s.densityByStory, [storyId]: step },
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
            : {
                lemma,
                lang,
                gloss,
                firstSeenAt: Date.now(),
                seenCount: 1,
                added: false,
              };
          return { vocabulary: { ...s.vocabulary, [key]: entry } };
        });
        // Fire-and-forget: localStorage above already keeps the UI instant,
        // this just persists the same encounter to the backend (FR-6).
        void postSeen(lang, lemma, gloss);
      },
      markAdded: (lang, lemma) => {
        set((s) => {
          const key = vocabKey(lang, lemma);
          const existing = s.vocabulary[key];
          if (!existing) return s;
          return {
            vocabulary: { ...s.vocabulary, [key]: { ...existing, added: true } },
          };
        });
      },
    }),
    { name: "weave-reader-store" },
  ),
);
