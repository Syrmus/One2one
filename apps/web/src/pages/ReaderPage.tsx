import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DEFAULT_STEPS, MAX_STEP, MIN_STEP, type Story } from "@weave/shared";
import { getStory } from "../lib/api";
import { useReaderStore } from "../store/readerStore";
import { WeaveText } from "../components/reader/WeaveText";
import { WeavePopover } from "../components/reader/WeavePopover";
import { DensitySlider } from "../components/reader/DensitySlider";
import { EndOfStoryPanel } from "../components/reader/EndOfStoryPanel";
import { StoryStatusBadge } from "../components/library/StoryStatusBadge";
import { buildStoryQuizPairs } from "../lib/quiz";
import { storyLemmas, storyProgress, storyStatus } from "../lib/progress";
import { useT } from "../lib/i18n";

export function ReaderPage() {
  const t = useT();
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();

  const [story, setStory] = useState<Story | undefined | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!storyId) return;
    setStory(null);
    getStory(storyId).then((s) => setStory(s ?? undefined));
  }, [storyId]);

  const densityByStory = useReaderStore((s) => s.densityByStory);
  const setDensity = useReaderStore((s) => s.setDensity);
  const scrollByStory = useReaderStore((s) => s.scrollByStory);
  const setScroll = useReaderStore((s) => s.setScroll);
  const markReachedEnd = useReaderStore((s) => s.markReachedEnd);
  const maxCompletedStepByStory = useReaderStore(
    (s) => s.maxCompletedStepByStory,
  );
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const recordEncounter = useReaderStore((s) => s.recordEncounter);
  const markAdded = useReaderStore((s) => s.markAdded);
  const unmarkAdded = useReaderStore((s) => s.unmarkAdded);

  const step = story ? (densityByStory[story.id] ?? MIN_STEP) : MIN_STEP;

  const canQuiz = useMemo(
    () => (story ? buildStoryQuizPairs(story).length >= 5 : false),
    [story],
  );

  useEffect(() => {
    if (!story || restoredRef.current) return;
    restoredRef.current = true;
    const saved = scrollByStory[story.id];
    if (saved) window.scrollTo(0, saved);
  }, [story, scrollByStory]);

  useEffect(() => {
    if (!story) return;
    const onScroll = () => setScroll(story.id, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [story, setScroll]);

  if (story === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-slate-500 dark:text-slate-400">{t.loading}</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-slate-600 dark:text-slate-300">
          {t.storyNotFound}
        </p>
        <Link to="/" className="text-dusk-600 dark:text-dusk-500">
          {t.backToLibrary}
        </Link>
      </div>
    );
  }

  const selectedUnit =
    selectedIndex !== null ? story.units[selectedIndex] : undefined;
  const weaveUnit = selectedUnit?.t === "weave" ? selectedUnit : undefined;

  const { seen } = storyProgress(story, vocabulary);
  const addedInStory = storyLemmas(story).filter(
    (lemma) => vocabulary[`${story.l2}:${lemma}`]?.added,
  ).length;

  const hasProgress =
    story.id in densityByStory || story.id in scrollByStory;
  const status = storyStatus({
    hasProgress,
    maxCompletedStep: maxCompletedStepByStory[story.id] ?? 0,
  });
  const densityLabel =
    step === MIN_STEP
      ? t.densityOriginal
      : step === MAX_STEP
        ? t.densityFull
        : t.densityPercent(DEFAULT_STEPS[step]!.target);

  // Any forward action from the end panel is what records the story as read at
  // the current density (no-op below step 1). Leaving via the back link does
  // not — that's "didn't finish".
  const finishAtCurrent = () => markReachedEnd(story.id, step);

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-44">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link to="/" className="text-sm text-dusk-600 dark:text-dusk-500">
          {t.backToLibrary}
        </Link>
        <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
          {story.title}
        </h1>
        {canQuiz ? (
          <Link
            to={`/quiz/story/${story.id}`}
            className="w-12 shrink-0 text-right text-sm text-dusk-600 dark:text-dusk-500"
          >
            {t.quizShort}
          </Link>
        ) : (
          <span className="w-12 shrink-0" />
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <StoryStatusBadge status={status} />
        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-slate-700 dark:text-slate-300">
          {densityLabel}
        </span>
      </div>

      <WeaveText
        story={story}
        step={step}
        onSelectWeave={(index) => {
          setSelectedIndex(index);
          const unit = story.units[index];
          if (unit?.t === "weave") {
            recordEncounter(story.l2, unit.lemma, unit.gloss, unit.pos);
          }
        }}
      />

      <EndOfStoryPanel
        step={step}
        seen={seen}
        addedInStory={addedInStory}
        canQuiz={canQuiz}
        onRaiseDensity={() => {
          finishAtCurrent();
          setDensity(story.id, step + 1);
          window.scrollTo(0, 0);
        }}
        onQuiz={() => {
          finishAtCurrent();
          navigate(`/quiz/story/${story.id}`);
        }}
        onNext={() => {
          finishAtCurrent();
          navigate("/");
        }}
      />

      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] mx-auto max-w-md px-4">
        <DensitySlider
          step={step}
          onChange={(newStep) => setDensity(story.id, newStep)}
        />
      </div>

      {weaveUnit && (
        <WeavePopover
          unit={weaveUnit}
          seenCount={
            vocabulary[`${story.l2}:${weaveUnit.lemma}`]?.seenCount ?? 0
          }
          added={vocabulary[`${story.l2}:${weaveUnit.lemma}`]?.added ?? false}
          onAdd={() => markAdded(story.l2, weaveUnit.lemma)}
          onRemove={() => unmarkAdded(story.l2, weaveUnit.lemma)}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
