import { storySchema, type Story } from "@weave/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type Language = { code: string; label: string };

export async function getLanguages(): Promise<Language[]> {
  const res = await fetch(`${API_URL}/api/languages`);
  if (!res.ok) throw new Error(`Failed to load languages: ${res.status}`);
  return res.json();
}

export async function getStories(
  lang?: string,
  nativeLang?: string,
): Promise<Story[]> {
  const url = new URL(`${API_URL}/api/stories`);
  if (lang) url.searchParams.set("lang", lang);
  if (nativeLang) url.searchParams.set("nativeLang", nativeLang);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to load stories: ${res.status}`);
  const data: unknown[] = await res.json();
  return data.map((s) => storySchema.parse(s));
}

export async function getStory(id: string): Promise<Story | undefined> {
  const res = await fetch(`${API_URL}/api/stories/${id}`, {
    credentials: "include",
  });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load story: ${res.status}`);
  return storySchema.parse(await res.json());
}

export type ProgressRow = {
  id: string;
  userId: string;
  lang: string;
  lemma: string;
  gloss: string;
  pos: string | null;
  added: boolean;
  firstSeenAt: string;
  seenCount: number;
  updatedAt: string;
};

export type ReadingProgressRow = {
  id: string;
  userId: string;
  storyId: string;
  densityStep: number;
  scrollPosition: number;
  updatedAt: string;
};

export async function postSeen(
  lang: string,
  lemma: string,
  gloss: string,
  pos?: string,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/progress/seen`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, lemma, gloss, pos }),
    });
  } catch (err) {
    console.error("Failed to record progress:", err);
  }
}

export async function postAdded(
  lang: string,
  lemma: string,
  gloss: string,
  added: boolean,
  pos?: string,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/progress/added`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, lemma, gloss, added, pos }),
    });
  } catch (err) {
    console.error("Failed to record added state:", err);
  }
}

export async function getProgress(): Promise<ProgressRow[]> {
  const res = await fetch(`${API_URL}/api/progress`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load progress: ${res.status}`);
  return res.json();
}

export async function postReadingProgress(
  storyId: string,
  densityStep: number,
  scrollPosition: number,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/reading-progress`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId, densityStep, scrollPosition }),
    });
  } catch (err) {
    console.error("Failed to record reading progress:", err);
  }
}

export async function getReadingProgress(): Promise<ReadingProgressRow[]> {
  const res = await fetch(`${API_URL}/api/reading-progress`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to load reading progress: ${res.status}`);
  }
  return res.json();
}
