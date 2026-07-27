import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Pos } from "@weave/shared";
import {
  postSeen,
  postAdded,
  postReadingProgress,
  postStoryCompleted,
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
  // When `added` was last set to true (synced to the server's added_at, so
  // "this week / today" added metrics survive across devices).
  addedAt?: number;
};

type ReaderState = {
  // storyId -> true once the reader has been opened for it. Drives the
  // "started" status for stories opened but not yet read at any density
  // (local-only: the server has no "opened" concept, just real progress rows).
  openedByStory: Record<string, true>;
  densityByStory: Record<string, number>;
  scrollByStory: Record<string, number>;
  // storyId -> timestamp of the most recent "reached the end at density >= 1" event.
  reachedEndByStory: Record<string, number>;
  // storyId -> highest densityStep at which the story has ever been read to the end.
  maxCompletedStepByStory: Record<string, number>;
  vocabulary: Record<string, VocabEntry>;
  hydrated: boolean;
  // Which logged-in user the persisted per-user data (vocabulary, reading
  // progress, milestones) belongs to. Used to wipe another user's local data
  // when a different account logs in on the same browser.
  ownerUserId: string | null;
  // Highest vocabulary-size milestone already celebrated, per language —
  // prevents re-showing the toast for a milestone already crossed.
  milestonesShown: Record<string, number>;
  // Set when a new milestone was just crossed; cleared by dismissMilestoneToast.
  milestoneToast: { lang: string; count: number } | null;
  markOpened: (storyId: string) => void;
  setDensity: (storyId: string, step: number) => void;
  setScroll: (storyId: string, position: number) => void;
  // Records reaching the end of a story. No-op (returns false) below step 1 —
  // finishing at 0% density is just reading plain L1, not a language milestone.
  // Returns true when this pushes maxCompletedStep to a new high for this
  // story. Called explicitly when the reader takes a forward action from the
  // end-of-story panel (raise density / test / next), never from scrolling.
  markReachedEnd: (storyId: string, step: number) => boolean;
  recordEncounter: (
    lang: string,
    lemma: string,
    gloss: string,
    pos?: Pos,
  ) => void;
  markAdded: (lang: string, lemma: string) => void;
  unmarkAdded: (lang: string, lemma: string) => void;
  hydrateFromServer: (userId: string) => Promise<void>;
  // Clears all per-user data (used on sign-out so it isn't left at rest for
  // the next person on a shared browser).
  resetUserData: () => void;
  dismissMilestoneToast: () => void;
};

const EMPTY_USER_DATA = {
  openedByStory: {},
  densityByStory: {},
  scrollByStory: {},
  reachedEndByStory: {},
  maxCompletedStepByStory: {},
  vocabulary: {},
  milestonesShown: {},
} as const;

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
      openedByStory: {},
      densityByStory: {},
      scrollByStory: {},
      reachedEndByStory: {},
      maxCompletedStepByStory: {},
      vocabulary: {},
      hydrated: false,
      ownerUserId: null,
      milestonesShown: {},
      milestoneToast: null,
      markOpened: (storyId) => {
        if (get().openedByStory[storyId]) return;
        set((s) => ({
          openedByStory: { ...s.openedByStory, [storyId]: true },
        }));
      },
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
      markReachedEnd: (storyId, step) => {
        if (step < 1) return false;
        const prevMax = get().maxCompletedStepByStory[storyId] ?? 0;
        const isNewMax = step > prevMax;
        set((s) => ({
          reachedEndByStory: { ...s.reachedEndByStory, [storyId]: Date.now() },
          maxCompletedStepByStory: {
            ...s.maxCompletedStepByStory,
            [storyId]: Math.max(prevMax, step),
          },
        }));
        void postStoryCompleted(storyId, step);
        return isNewMax;
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
      resetUserData: () =>
        set({ ...EMPTY_USER_DATA, ownerUserId: null, hydrated: false }),
      hydrateFromServer: async (userId) => {
        // A different account on this browser: drop the previous user's local
        // data before pulling this user's, so nothing bleeds across accounts.
        if (get().ownerUserId && get().ownerUserId !== userId) {
          set({ ...EMPTY_USER_DATA, hydrated: false });
        }
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
                addedAt:
                  existing?.addedAt ??
                  (row.addedAt ? Date.parse(row.addedAt) : undefined),
              };
            }

            const densityByStory = { ...s.densityByStory };
            const scrollByStory = { ...s.scrollByStory };
            const reachedEndByStory = { ...s.reachedEndByStory };
            const maxCompletedStepByStory = { ...s.maxCompletedStepByStory };
            for (const row of readingRows) {
              if (!(row.storyId in densityByStory)) {
                densityByStory[row.storyId] = row.densityStep;
              }
              if (!(row.storyId in scrollByStory)) {
                scrollByStory[row.storyId] = row.scrollPosition;
              }
              if (!(row.storyId in reachedEndByStory) && row.reachedEndAt) {
                reachedEndByStory[row.storyId] = Date.parse(row.reachedEndAt);
              }
              if (!(row.storyId in maxCompletedStepByStory)) {
                maxCompletedStepByStory[row.storyId] = row.maxCompletedStep;
              }
            }

            return {
              vocabulary,
              densityByStory,
              scrollByStory,
              reachedEndByStory,
              maxCompletedStepByStory,
              ownerUserId: userId,
              hydrated: true,
            };
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
