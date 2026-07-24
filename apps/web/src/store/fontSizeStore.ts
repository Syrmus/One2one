import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FontScale = "normal" | "large" | "xlarge";

type FontSizeState = {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
};

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set) => ({
      fontScale: "normal",
      setFontScale: (scale) => set({ fontScale: scale }),
    }),
    { name: "weave-font-size-store" },
  ),
);
