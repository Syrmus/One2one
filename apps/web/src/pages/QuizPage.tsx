import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Story } from "@weave/shared";
import { getStory } from "../lib/api";
import { useReaderStore } from "../store/readerStore";
import { useSession } from "../lib/authClient";
import {
  buildStoryQuizPairs,
  buildVocabQuizPairs,
  buildQuizScreens,
  type QuizPair,
} from "../lib/quiz";
import { MatchScreen } from "../components/quiz/MatchScreen";
import { useT } from "../lib/i18n";

type Mode = "story" | "vocab";

export function QuizPage({ mode }: { mode: Mode }) {
  const t = useT();
  const { storyId } = useParams<{ storyId: string }>();
  const { data: session } = useSession();
  const targetLanguage = session?.user.targetLanguage;

  const vocabulary = useReaderStore((s) => s.vocabulary);
  const recordEncounter = useReaderStore((s) => s.recordEncounter);

  const [story, setStory] = useState<Story | undefined | null>(
    mode === "story" ? null : undefined,
  );
  const lang = mode === "story" ? story?.l2 : targetLanguage;

  useEffect(() => {
    if (mode !== "story" || !storyId) return;
    setStory(null);
    getStory(storyId).then((s) => setStory(s ?? undefined));
  }, [mode, storyId]);

  const screens = useMemo(() => {
    if (mode === "story") {
      if (!story) return [];
      return buildQuizScreens(buildStoryQuizPairs(story));
    }
    if (!targetLanguage) return [];
    return buildQuizScreens(
      buildVocabQuizPairs(Object.values(vocabulary), targetLanguage),
    );
    // Vocab screens are rolled once per page load, not recomputed as
    // recordEncounter updates seenCount/vocabulary mid-quiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, story, targetLanguage]);

  const [direction] = useState<"l2ToL1" | "l1ToL2">(() =>
    Math.random() < 0.5 ? "l2ToL1" : "l1ToL2",
  );
  const [screenIndex, setScreenIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);

  function handleScreenComplete(matchedPairIds: string[], screenMistakes: number) {
    if (lang) {
      const currentScreen = screens[screenIndex];
      for (const pairId of matchedPairIds) {
        const pair = currentScreen?.find((p) => p.id === pairId);
        if (pair) recordEncounter(lang, pair.id, pair.l1);
      }
    }
    setMistakes((m) => m + screenMistakes);
    if (screenIndex + 1 >= screens.length) {
      setFinished(true);
    } else {
      setScreenIndex((i) => i + 1);
    }
  }

  const backTo = mode === "story" && storyId ? `/reader/${storyId}` : "/progress";

  if (mode === "story" && story === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-slate-500 dark:text-slate-400">{t.loading}</p>
      </div>
    );
  }

  if (screens.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-slate-600 dark:text-slate-300">{t.quizNotEnoughWords}</p>
        <Link to={backTo} className="text-dusk-600 dark:text-dusk-500">
          {t.back}
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 text-center">
        <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.quizFinished}
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {mistakes === 0 ? t.quizNoMistakes : t.quizMistakes(mistakes)}
        </p>
        <Link
          to={backTo}
          className="inline-block rounded-2xl bg-dusk-500 px-6 py-3 font-medium text-white active:bg-dusk-600"
        >
          {t.back}
        </Link>
      </div>
    );
  }

  const currentPairs: QuizPair[] = screens[screenIndex] ?? [];

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link to={backTo} className="text-sm text-dusk-600 dark:text-dusk-500">
          {t.back}
        </Link>
        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-slate-700 dark:text-slate-300">
          {t.densityStepOf(screenIndex + 1, screens.length)}
        </span>
      </div>

      <MatchScreen
        pairs={currentPairs}
        direction={direction}
        onComplete={handleScreenComplete}
      />
    </div>
  );
}
