import { useEffect } from "react";
import { useReaderStore } from "../store/readerStore";
import { useT } from "../lib/i18n";

export function MilestoneToast() {
  const t = useT();
  const milestoneToast = useReaderStore((s) => s.milestoneToast);
  const dismiss = useReaderStore((s) => s.dismissMilestoneToast);

  useEffect(() => {
    if (!milestoneToast) return;
    const id = setTimeout(dismiss, 4000);
    return () => clearTimeout(id);
  }, [milestoneToast, dismiss]);

  if (!milestoneToast) return null;

  return (
    <div
      className="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-md justify-center px-4"
      onClick={dismiss}
    >
      <div className="flex items-center gap-2 rounded-2xl bg-sage-500 px-4 py-3 text-sm font-medium text-white shadow-lg">
        <span className="text-lg">🎉</span>
        {t.vocabMilestone(milestoneToast.count)}
      </div>
    </div>
  );
}
