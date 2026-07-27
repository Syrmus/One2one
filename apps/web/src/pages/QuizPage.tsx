import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DEFAULT_STEPS, MAX_STEP, MIN_STEP, type Story } from "@weave/shared";
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
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const { data: session } = useSession();
  const targetLanguage = session?.user.targetLanguage;

  const vocabulary = useReaderStore((s) => s.vocabulary);
  const recordEncounter = useReaderStore((s) => s.recordEncounter);
  const densityByStory = useReaderStore((s) => s.densityByStory);
  const setDensity = useReaderStore((s) => s.setDensity);

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
        // Reinforce (bump seenCount) only words already encountered while
        // reading. A story quiz covers every content word of the story, so
        // recording each match as a fresh encounter would inject words the
        // reader never actually met into the vocabulary — and could pop a
        // milestone toast mid-quiz.
        if (pair && vocabulary[`${lang}:${pair.id}`]) {
          recordEncounter(lang, pair.id, pair.l1);
        }
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
    const accuracy = mistakes === 0 ? t.quizNoMistakes : t.quizMistakes(mistakes);

    // Story mode drives the next step off the current reading density; vocab
    // mode has no density, so it keeps the plain "done → back" screen.
    if (mode === "story" && storyId) {
      const step = densityByStory[storyId] ?? MIN_STEP;
      const primaryClass =
        "block rounded-full bg-sage-500 px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]";
      const secondaryClass =
        "block rounded-full border border-cream-100 px-4 py-3 text-sm font-semibold text-slate-700 active:scale-[0.99] dark:border-slate-700 dark:text-slate-200";

      return (
        <div className="mx-auto max-w-md px-4 py-6 text-center">
          <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.quizSuccessTitle}
          </h1>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            {accuracy}
          </p>
          <div className="mx-auto flex max-w-xs flex-col gap-2">
            {step < MAX_STEP ? (
              <button
                type="button"
                onClick={() => {
                  setDensity(storyId, step + 1);
                  navigate(`/reader/${storyId}`);
                }}
                className={primaryClass}
              >
                {t.endRaiseDensity(DEFAULT_STEPS[step + 1]!.target)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/")}
                className={primaryClass}
              >
                {t.quizFinishStory}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/reader/${storyId}`)}
              className={secondaryClass}
            >
              {t.quizBackToStory}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md px-4 py-6 text-center">
        <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.quizFinished}
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {accuracy}
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
        key={screenIndex}
        pairs={currentPairs}
        direction={direction}
        onComplete={handleScreenComplete}
      />
    </div>
  );
}
