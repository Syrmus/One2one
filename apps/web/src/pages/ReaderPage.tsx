import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { MAX_STEP, MIN_STEP, type Story } from "@weave/shared";
import { getStory } from "../lib/api";
import { useReaderStore } from "../store/readerStore";
import { WeaveText } from "../components/reader/WeaveText";
import { WeavePopover } from "../components/reader/WeavePopover";
import { DensitySlider } from "../components/reader/DensitySlider";
import { StoryCompletionScreen } from "../components/reader/StoryCompletionScreen";
import { buildStoryQuizPairs } from "../lib/quiz";
import { storyLemmas, storyProgress } from "../lib/progress";
import { useT } from "../lib/i18n";

export function ReaderPage() {
  const t = useT();
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();

  const [story, setStory] = useState<Story | undefined | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const restoredRef = useRef(false);
  // Guards against re-showing the completion screen for the same
  // (story, step) pair when the sentence anchor re-fires (e.g. scroll jitter
  // around the last sentence) within one mount.
  const reachedGuardRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!storyId) return;
    setStory(null);
    setCompletionOpen(false);
    getStory(storyId).then((s) => setStory(s ?? undefined));
  }, [storyId]);

  const densityByStory = useReaderStore((s) => s.densityByStory);
  const setDensity = useReaderStore((s) => s.setDensity);
  const scrollByStory = useReaderStore((s) => s.scrollByStory);
  const setScroll = useReaderStore((s) => s.setScroll);
  const setReadPercent = useReaderStore((s) => s.setReadPercent);
  const markReachedEnd = useReaderStore((s) => s.markReachedEnd);
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

  const handleTextProgress = useCallback(
    (furthest: number, total: number) => {
      if (!story) return;
      const percent = Math.round(((furthest + 1) / total) * 100);
      setReadPercent(story.id, percent);

      if (furthest !== total - 1) return; // not the last sentence yet
      const guardKey = `${story.id}:${step}`;
      if (reachedGuardRef.current.has(guardKey)) return;
      reachedGuardRef.current.add(guardKey);

      const isNewMax = markReachedEnd(story.id, step);
      if (isNewMax) setCompletionOpen(true);
    },
    [story, step, setReadPercent, markReachedEnd],
  );

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

  const { seen, total } = storyProgress(story, vocabulary);
  const addedInStory = storyLemmas(story).filter(
    (lemma) => vocabulary[`${story.l2}:${lemma}`]?.added,
  ).length;

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-32">
      <div className="mb-4 flex items-center justify-between gap-2">
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
        onProgress={handleTextProgress}
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

      {completionOpen && (
        <StoryCompletionScreen
          step={step}
          seen={seen}
          total={total}
          addedInStory={addedInStory}
          canRaiseDensity={step < MAX_STEP}
          canQuiz={canQuiz}
          onRaiseDensity={() => {
            setDensity(story.id, step + 1);
            window.scrollTo(0, 0);
            setCompletionOpen(false);
          }}
          onQuiz={() => {
            setCompletionOpen(false);
            navigate(`/quiz/story/${story.id}`);
          }}
          onNext={() => {
            setCompletionOpen(false);
            navigate("/");
          }}
          onClose={() => setCompletionOpen(false)}
        />
      )}
    </div>
  );
}
