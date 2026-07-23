import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MIN_STEP, type Story } from "@weave/shared";
import { getStory } from "../lib/api";
import { useReaderStore } from "../store/readerStore";
import { WeaveText } from "../components/reader/WeaveText";
import { WeavePopover } from "../components/reader/WeavePopover";
import { DensitySlider } from "../components/reader/DensitySlider";
import { useT } from "../lib/i18n";

export function ReaderPage() {
  const t = useT();
  const { storyId } = useParams<{ storyId: string }>();

  const [story, setStory] = useState<Story | undefined | null>(null);

  useEffect(() => {
    if (!storyId) return;
    setStory(null);
    getStory(storyId).then((s) => setStory(s ?? undefined));
  }, [storyId]);

  const densityByStory = useReaderStore((s) => s.densityByStory);
  const setDensity = useReaderStore((s) => s.setDensity);
  const scrollByStory = useReaderStore((s) => s.scrollByStory);
  const setScroll = useReaderStore((s) => s.setScroll);
  const vocabulary = useReaderStore((s) => s.vocabulary);
  const recordEncounter = useReaderStore((s) => s.recordEncounter);
  const markAdded = useReaderStore((s) => s.markAdded);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const restoredRef = useRef(false);

  const step = story ? (densityByStory[story.id] ?? MIN_STEP) : MIN_STEP;

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

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-44">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link to="/" className="text-sm text-dusk-600 dark:text-dusk-500">
          {t.backToLibrary}
        </Link>
        <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
          {story.title}
        </h1>
        <span className="w-12 shrink-0" />
      </div>

      <WeaveText
        story={story}
        step={step}
        onSelectWeave={(index) => {
          setSelectedIndex(index);
          const unit = story.units[index];
          if (unit?.t === "weave") {
            recordEncounter(story.l2, unit.lemma, unit.gloss);
          }
        }}
      />

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md px-4 pb-4">
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
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
