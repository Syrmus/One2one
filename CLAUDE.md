# Weave — project instructions

Diglot-weave language reading app. Architecture/product spec: `SPEC.md`. Monorepo: `apps/web` (React+Vite), `apps/api` (Hono+Drizzle+Postgres), `packages/shared` (zod story schema).

## Story content

**Whenever creating, editing, or reviewing a story — whether hand-authored seed content under `apps/api/src/content/seed/**/*.json` or output from the (future) LLM generation endpoint — follow `STORY_GENERATION_SPEC.md` (repo root) exactly.** It is the binding contract for:

- the weave-unit schema and the concatenation/interchangeability rule (determiners live inside the weave unit, never split into an adjacent `text` unit)
- the global, cross-story `weave_priority` scale (§3.3 of that doc) — priorities are not relative to a single story
- per-language morphology notes for German/Dutch/Spanish (§5)
- the validation checks a story must pass before being accepted (§7)

If a new seed story is added or an existing one is edited, re-check it against `STORY_GENERATION_SPEC.md` §7 (validation contract) and §10 (common mistakes) before considering the task done — in particular the determiner-placement rule, since that's the most common source of bugs.
