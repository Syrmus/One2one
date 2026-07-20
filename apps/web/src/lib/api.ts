import { storySchema, type Story } from "@weave/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function getStories(lang?: string): Promise<Story[]> {
  const url = new URL(`${API_URL}/api/stories`);
  if (lang) url.searchParams.set("lang", lang);
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

export async function postSeen(
  lang: string,
  lemma: string,
  gloss: string,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/progress/seen`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, lemma, gloss }),
    });
  } catch (err) {
    console.error("Failed to record progress:", err);
  }
}
