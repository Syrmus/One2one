import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Pos } from "@weave/shared";
import {
  postSeen,
  postAdded,
  postReadingProgress,
  getProgress,
  getReadingProgress,
} from "../lib/api";
import { VOCAB_MILESTONES } from "../lib/milestones";

export type VocabEntry = {
  lemma: string;
  lang: string;
  gloss: string;
  // Absent for entries recorded before this field was introduced.
  pos?: Pos;
  firstSeenAt: number;
  seenCount: number;
  // Set only when the user explicitly taps "Add to my vocabulary" in the
  // popover — distinct from just having encountered the word by tapping it
  // in the reader (which alone only affects seenCount/firstSeenAt).
  added: boolean;
  // When `added` was last set to true. Local-only (not synced to the
  // server) — just used for the "this week" summary.
  addedAt?: number;
};

type ReaderState = {
  densityByStory: Record<string, number>;
  scrollByStory: Record<string, number>;
  vocabulary: Record<string, VocabEntry>;
  hydrated: boolean;
  // Highest vocabulary-size milestone already celebrated, per language —
  // prevents re-showing the toast for a milestone already crossed.
  milestonesShown: Record<string, number>;
  // Set when a new milestone was just crossed; cleared by dismissMilestoneToast.
  milestoneToast: { lang: string; count: number } | null;
  setDensity: (storyId: string, step: number) => void;
  setScroll: (storyId: string, position: number) => void;
  recordEncounter: (
    lang: string,
    lemma: string,
    gloss: string,
    pos?: Pos,
  ) => void;
  markAdded: (lang: string, lemma: string) => void;
  unmarkAdded: (lang: string, lemma: string) => void;
  hydrateFromServer: () => Promise<void>;
  dismissMilestoneToast: () => void;
};

function vocabKey(lang: string, lemma: string) {
  return `${lang}:${lemma}`;
}

// Scroll position changes on every scroll tick locally, but only needs to
// reach the server occasionally — debounced per story so switching stories
// doesn't lose a pending write for the previous one.
const scrollSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleScrollSync(storyId: string, step: number, position: number) {
  const existing = scrollSyncTimers.get(storyId);
  if (existing) clearTimeout(existing);
  scrollSyncTimers.set(
    storyId,
    setTimeout(() => {
      scrollSyncTimers.delete(storyId);
      void postReadingProgress(storyId, step, position);
    }, 1500),
  );
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      densityByStory: {},
      scrollByStory: {},
      vocabulary: {},
      hydrated: false,
      milestonesShown: {},
      milestoneToast: null,
      setDensity: (storyId, step) => {
        set((s) => ({
          densityByStory: { ...s.densityByStory, [storyId]: step },
        }));
        const position = get().scrollByStory[storyId] ?? 0;
        void postReadingProgress(storyId, step, position);
      },
      setScroll: (storyId, position) => {
        set((s) => ({
          scrollByStory: { ...s.scrollByStory, [storyId]: position },
        }));
        const step = get().densityByStory[storyId] ?? 0;
        scheduleScrollSync(storyId, step, position);
      },
      recordEncounter: (lang, lemma, gloss, pos) => {
        set((s) => {
          const key = vocabKey(lang, lemma);
          const existing = s.vocabulary[key];
          const entry: VocabEntry = existing
            ? { ...existing, seenCount: existing.seenCount + 1, pos: pos ?? existing.pos }
            : {
                lemma,
                lang,
                gloss,
                pos,
                firstSeenAt: Date.now(),
                seenCount: 1,
                added: false,
              };
          const vocabulary = { ...s.vocabulary, [key]: entry };

          if (existing) return { vocabulary };

          // A brand-new distinct word for this language — check whether it
          // just pushed the count for that language up to a milestone.
          const count = Object.values(vocabulary).filter(
            (e) => e.lang === lang,
          ).length;
          const alreadyShown = s.milestonesShown[lang] ?? 0;
          const justCrossed = VOCAB_MILESTONES.find(
            (m) => m === count && m > alreadyShown,
          );
          if (justCrossed) {
            return {
              vocabulary,
              milestonesShown: { ...s.milestonesShown, [lang]: justCrossed },
              milestoneToast: { lang, count: justCrossed },
            };
          }
          return { vocabulary };
        });
        // Fire-and-forget: localStorage above already keeps the UI instant,
        // this just persists the same encounter to the backend (FR-6).
        void postSeen(lang, lemma, gloss, pos);
      },
      markAdded: (lang, lemma) => {
        let entryForSync: VocabEntry | undefined;
        set((s) => {
          const key = vocabKey(lang, lemma);
          const existing = s.vocabulary[key];
          if (!existing) return s;
          entryForSync = { ...existing, added: true, addedAt: Date.now() };
          return { vocabulary: { ...s.vocabulary, [key]: entryForSync } };
        });
        if (entryForSync) {
          void postAdded(lang, lemma, entryForSync.gloss, true, entryForSync.pos);
        }
      },
      dismissMilestoneToast: () => set({ milestoneToast: null }),
      unmarkAdded: (lang, lemma) => {
        let entryForSync: VocabEntry | undefined;
        set((s) => {
          const key = vocabKey(lang, lemma);
          const existing = s.vocabulary[key];
          if (!existing) return s;
          entryForSync = { ...existing, added: false };
          return { vocabulary: { ...s.vocabulary, [key]: entryForSync } };
        });
        if (entryForSync) {
          void postAdded(lang, lemma, entryForSync.gloss, false, entryForSync.pos);
        }
      },
      hydrateFromServer: async () => {
        if (get().hydrated) return;
        try {
          const [progressRows, readingRows] = await Promise.all([
            getProgress(),
            getReadingProgress(),
          ]);

          set((s) => {
            const vocabulary = { ...s.vocabulary };
            for (const row of progressRows) {
              const key = vocabKey(row.lang, row.lemma);
              const existing = vocabulary[key];
              vocabulary[key] = {
                lemma: row.lemma,
                lang: row.lang,
                gloss: existing?.gloss ?? row.gloss,
                pos: (existing?.pos ?? row.pos ?? undefined) as Pos | undefined,
                firstSeenAt: Math.min(
                  existing?.firstSeenAt ?? Date.parse(row.firstSeenAt),
                  Date.parse(row.firstSeenAt),
                ),
                seenCount: Math.max(existing?.seenCount ?? 0, row.seenCount),
                added: (existing?.added ?? false) || row.added,
              };
            }

            const densityByStory = { ...s.densityByStory };
            const scrollByStory = { ...s.scrollByStory };
            for (const row of readingRows) {
              if (!(row.storyId in densityByStory)) {
                densityByStory[row.storyId] = row.densityStep;
              }
              if (!(row.storyId in scrollByStory)) {
                scrollByStory[row.storyId] = row.scrollPosition;
              }
            }

            return { vocabulary, densityByStory, scrollByStory, hydrated: true };
          });
        } catch (err) {
          console.error("Failed to hydrate progress from server:", err);
        }
      },
    }),
    {
      name: "weave-reader-store",
      // `hydrated` is a per-page-load guard (avoid double-fetching on
      // server); `milestoneToast` is transient UI state. Neither should
      // survive a reload.
      partialize: (s) => {
        const { hydrated: _hydrated, milestoneToast: _toast, ...rest } = s;
        return rest;
      },
    },
  ),
);
