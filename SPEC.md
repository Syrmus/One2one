# Technical Specification: Diglot-Weave Language Learning App

**Working title:** *Weave* (rename as desired)
**Spec version:** 1.0
**Format:** working document for Claude Code — place at the repo root as `SPEC.md`

---

## 1. Goal and Core Idea

The app helps users learn a foreign language using the **diglot weave** method: the user reads a story in their native language (L1), into which equivalents from the target language (L2) are gradually woven in, word by word. Context lets the brain infer the meaning of the new words. As the reader progresses, the share of L2 in the text increases.

**Key mechanics of the method:**
- Initial weave density is low (10–15% of words), so nearly every sentence remains instantly understandable.
- Order of introduction by part of speech: concrete nouns first → high-frequency verbs → adjectives → function words last.
- Whole **lexical units** are woven in, not single words: `der Hund`, `nach Hause`, `a casa` — with correct article, case, and agreement.

---

## 2. Target Users and Languages

- **Level:** beginners (A1–A2).
- **Story language (L1):** Russian.
- **Target languages (L2) at launch:** German, Dutch, Spanish. The architecture must not hardcode the language list — adding a language means adding configuration and reference data, not touching core code.
- **Scale:** starting scope is personal / small multi-user use (self + close contacts). Authentication is Google OAuth only (see §7.4) — no email/password. This is intentionally simple to start; the architecture keeps room to add another auth method later if needed.

---

## 3. Scope of Work

### MVP (Stage 1)
1. Reader with weaving: renders a story with adjustable L2 density.
2. Tap/click on a woven word → popover: translation, gender/article, pronunciation (IPA), base form.
3. Density/level control for weaving.
4. A library of a **few seed stories** built in, per language.
5. Progress tracking: which lemmas have been "seen," a simple user vocabulary.
6. Mobile-first UI, working as a PWA.

### Stage 2
7. Story generation via a **pluggable LLM provider** (Claude API, local Ollama, MiniMax, Grok — via an OpenAI-compatible interface).
8. User-pasted text → woven via LLM.
9. Lightweight spaced repetition for encountered lemmas.

### Stage 3 (beyond first release)
10. Audio (TTS) for L2 fragments.
11. Mobile app wrapper (Capacitor).
12. Expanded multi-user features, if the user base grows.

---

## 4. Functional Requirements

### 4.1. Reader
- FR-1. Render a story as a sequence of units; each weavable unit is shown in either L1 or L2 depending on the current weave threshold.
- FR-2. Woven (L2) units are visually distinct (e.g., light highlight/underline) without disrupting reading flow.
- FR-3. Tapping/clicking an L2 unit opens a popover: L1 translation, part of speech, gender/article (for nouns), IPA, lemma. Closes on tap outside.
- FR-4. Smooth scrolling; reading position is saved per story.
- FR-5. Density/level control (slider or presets: A1-lite / A1 / A2). Changing it recomputes the threshold and instantly re-renders the text without a reload.

### 4.2. Progress and Vocabulary
- FR-6. Progress is tracked **by lemma** (base form), not by the specific occurrence/inflected form: the progress key is the pair `(lemma, lang)`. First encounter and encounter count are logged.
- FR-7. A "My Vocabulary" section: list of encountered lemmas with translations, filterable by language.
- FR-8. (Stage 2) Spaced repetition: lemmas resurface on a schedule (SM-2 algorithm — start with this, it's simpler than FSRS).

### 4.3. Library
- FR-9. List of stories with metadata: language, topic, level, length, reading progress.
- FR-10. Seed stories ship with the app (see §5.1).
- FR-11. (Stage 2) "Generate story" button: choose language, level, topic → call the provider → save result to the library.
- FR-12. (Stage 2) "Paste your own text" → woven via the provider → saved.

### 4.4. Settings
- FR-13. Choice of target language.
- FR-14. (Stage 2) LLM provider selection/configuration: provider type, endpoint, model, API key — stored on the backend, never in the browser.
- FR-15. Part-of-speech introduction order and starting density are configurable parameters (with sensible defaults from §1).

---

## 5. Content and Data

### 5.1. Seed Stories
- MVP ships **2–3 stories per language** (6–9 total), level A1–A2, ~300–600 words each.
- Stored as static files in the format from §5.2 (e.g., `content/seed/de/*.json`).
- These can be generated once via an LLM during development and manually reviewed — a one-time task, not a runtime operation.
- **Authoring rules:** every story — seed content or generated — must follow `STORY_GENERATION_SPEC.md` (repo root). It's the binding contract for weaving mechanics, `weave_priority` scale, and per-language morphology; this file only defines the storage shape.

### 5.2. Story Data Model (unified storage format)

A story is stored in a structured form where the text is split into **units**. Each unit is either fixed L1 text (punctuation, function words not yet woven), or a weavable unit with L1/L2 variants and metadata.

```jsonc
{
  "id": "de-broken-window-01",
  "l1": "ru",              // base language
  "l2": "de",               // target language
  "level": "A1",
  "topic": "everyday life",
  "title": "The Broken Window",
  "units": [
    { "t": "text", "l1": "Однажды старый " },
    {
      "t": "weave",
      "l1": "пёс",
      "l2": "Hund",
      "lemma": "Hund",
      "pos": "noun",
      "gender": "m",           // grammatical gender (for nouns)
      "article": "der",        // article in this occurrence
      "case": "nom",           // grammatical case in this occurrence
      "gloss": "пёс, собака",
      "ipa": "hʊnt",
      "weave_priority": 3      // lower = introduced earlier
    },
    { "t": "text", "l1": " бежал " },
    {
      "t": "weave",
      "l1": "домой",
      "l2": "nach Hause",      // whole lexical unit, not a single word
      "lemma": "nach Hause",
      "pos": "phrase",
      "gloss": "домой",
      "ipa": "naːx ˈhaʊzə",
      "weave_priority": 12
    },
    { "t": "text", "l1": "." }
  ]
}
```

**Rendering by level:** a threshold `T` is set. A unit is shown in L2 if `weave_priority <= T`. Raising the level means raising `T`. `weave_priority` is assigned by the generator based on frequency and part of speech (nouns get low priorities, function words get high ones).

### 5.3. Reference Data Layer (optional, for hint quality and validation)
Not required for MVP (metadata can come straight from the LLM output), but improves reliability. **Deferred to Stage 2** (decided — see §11):
- **Wiktextract / kaikki.org** — machine-readable Wiktionary dumps: translations, gender, plurals, IPA. CC BY-SA license (requires attribution).
- **Tatoeba** — sentence pairs with translations (CC-BY) for usage examples.
- **Frequency lists** (e.g., `hermitdave/FrequencyWords`) — for computing `weave_priority`.

Once added, store as a local DB/index; use it for (a) filling in hints and (b) validating what the LLM generated (see §6.3).

---

## 6. LLM-Based Content Generation (Stage 2)

**See `STORY_GENERATION_SPEC.md`** for the full generation contract — output schema, weaving rules, `weave_priority` scale, per-language morphology notes, validation rules, and a ready-to-use system prompt template. This section stays high-level; that file is what actually gets sent to the model.

### 6.1. Two Modes
1. **Generate an original story:** input — {L2, level, topic, length}; output — a story object (§5.2).
2. **Weave user-supplied text:** input — {L2, level, L1 text}; output — same format.

### 6.2. Model Contract
- The model must return **strictly valid JSON** matching the schema in §5.2, with no preamble or markdown wrapping.
- The system prompt specifies: the method's rules (part-of-speech order, starting density), the requirement to weave whole lexical units with correct morphology (article/case/agreement), and the requirement to assign `weave_priority` based on frequency.
- Parameters (part-of-speech order, starting density, target level) are passed into the prompt from settings (§4.4).

### 6.3. Output Validation
- JSON-schema validation of the response; on failure, one automatic retry with the model error message.
- (If the reference layer is connected) cross-check gender/article of woven nouns against Wiktionary; discrepancies are flagged for manual review or soft auto-correction.

---

## 7. Architecture

Main architectural principle: **API-first separation of frontend and backend**, so the web app and any future mobile app are simply different clients of the same API.

```
┌─────────────────────┐        ┌──────────────────────┐
│  Client (SPA/PWA)    │  HTTP  │   Backend API         │
│  React + Vite        │◄──────►│  (REST/JSON)          │
│  mobile-first UI      │  JSON  │                      │
└─────────────────────┘        │  - stories/library    │
        ▲                      │  - progress/vocab      │
        │ (later) Capacitor    │  - generation (LLM)    │
        ▼                      │  - provider abstraction│
┌─────────────────────┐        └──────────┬───────────┘
│  Mobile (iOS/Android)│                  │
│  same web code        │                  ▼
└─────────────────────┘        ┌──────────────────────┐
                               │  LLM Provider(s)      │
                               │  Claude / Ollama /     │
                               │  MiniMax / Grok        │
                               └──────────────────────┘
```

### 7.1. Stack (recommendation)
- **Frontend:** React + Vite + TypeScript. PWA (manifest + service worker) from day one. Mobile-first layout: large tap targets, one-handed reading, narrow viewport as the baseline.
- **Backend:** **TypeScript (Node + Hono or Fastify)** — decided. One language across the whole project (shared types between client and server, including the `units` schema from §5.2).
- **Database:** **Postgres, self-hosted on your Hetzner server** (separate container in Docker Compose, persistent volume) — decided over an external managed provider like Supabase, to avoid an external dependency. ORM/query builder — **Drizzle**.
- **Client state:** lightweight (Zustand / React Query). Cache stories and progress locally for offline reading (PWA).

### 7.2. LLM Provider Abstraction
- A single `LLMProvider` interface with a generation method that takes a prompt and returns text/JSON.
- Implementations: providers with an **OpenAI-compatible** HTTP interface are covered by one adapter (MiniMax, Grok, local Ollama, OpenAI, etc. — they differ only in base URL, key, and model name). Claude API is a separate adapter (its own message format).
- Provider configuration lives in environment variables / backend settings: `PROVIDER_TYPE`, `PROVIDER_BASE_URL`, `PROVIDER_MODEL`, `PROVIDER_API_KEY`. Specific model IDs are set at deploy time — not hardcoded in code.
- API keys **never** reach the browser: generation always goes through the backend.

### 7.3. Core API Endpoints (draft)
```
GET  /api/auth/google                   — redirect to Google OAuth
GET  /api/auth/google/callback          — Google OAuth callback, creates session
POST /api/auth/logout                   — ends session
GET  /api/languages                     — list of supported L2 languages
GET  /api/stories?lang=de               — story library
GET  /api/stories/:id                   — full story (units)
POST /api/stories/generate              — {lang, level, topic, length} → story
POST /api/stories/weave                 — {lang, level, text} → story from text
GET  /api/progress                      — user progress/vocabulary (by lemma, see §4.2)
POST /api/progress/seen                 — mark encountered lemmas
GET  /api/progress/review               — items due for review (Stage 2)
```
All endpoints except `/api/auth/*` and `GET /api/languages` require a valid session (see §7.4).

### 7.4. Authentication

- **Login method: Google OAuth only.** Email+password is deliberately excluded from the MVP — this removes an entire chunk of work (password hashing, password reset, email verification, SMTP delivery) and leaves one clear, well-tested flow. All current/expected users (self + close contacts) have Google accounts.
- **Implementation:** self-hosted, on your own database (Postgres on Hetzner) — no external managed auth provider.
- **Library:** **Better Auth** (or Auth.js/NextAuth as an alternative) — the Google OAuth provider is configured declaratively: you register an OAuth app in Google Cloud Console (`CLIENT_ID`/`CLIENT_SECRET` in backend environment variables), and the library handles the authorization code flow, token exchange, and session creation. Works on top of Drizzle (same ORM as the rest of the project).
- **Data model:** a `users` table (id, email, google_id, name, avatar_url, created_at) in your Postgres; `progress`, `stories_generated`, etc. reference `user_id` as a foreign key.
- **Sessions:** JWT or server-side session (depending on the library choice), checked on the backend (middleware) for all protected endpoints from §7.3.
- **Extensibility:** if login without a Google account is needed later, add email+password as a second provider; the `google_id` field in the `users` schema doesn't block this (it just becomes nullable).

---

## 8. Non-Functional Requirements

- **NFR-1. Mobile-first & PWA.** Installable to the home screen; the reader works offline for already-loaded stories.
- **NFR-2. Mobile-build readiness.** No server-rendered HTML pages (API+SPA only), so a future Capacitor wrapper doesn't require a rewrite.
- **NFR-3. i18n.** UI and content are decoupled; UI language and L1/L2 language are independent.
- **NFR-4. Performance.** Rendering a 600-word story takes < 100ms; changing density has no noticeable delay.
- **NFR-5. Generation cost.** Log tokens/cost per generation; cache generated stories (generation happens once, reading happens many times).
- **NFR-6. Privacy.** API keys and progress data live only on the backend. Suitable for self-hosted deployment with no external dependencies beyond the chosen LLM provider (with local Ollama, no external calls at all).
- **NFR-7. Language extensibility.** A new L2 = config + (optionally) reference data, no changes to core code.

---

## 9. Deployment

Target environment — your existing self-hosted stack (Hetzner, Docker Compose, Nginx + Let's Encrypt):

- **Docker Compose:** services `frontend` (static assets via Nginx or served by the backend), `backend`, **`postgres`** (persistent volume for user data, progress, stories). Optionally, your existing **Ollama** as a local generation provider.
- **Reverse proxy:** Nginx + Let's Encrypt (matching what's already set up on the server).
- **Default provider:** **Claude API** (decided — see §11), for reliable morphology (German cases and gender). Local Ollama remains available as an alternative provider (for cheap experimentation), MiniMax and Grok as "bring your own key" options in settings, with no default binding.
- **Resources:** the app itself is lightweight; the heavy part is only runtime generation, which barely loads the server when using an external API.

---

## 10. Roadmap

| Stage | Content | Outcome |
|-------|---------|---------|
| 1 (MVP) | Reader + hints + density + seed stories + progress + PWA | Working web app for reading built-in stories |
| 2 | Provider-based generation + paste-your-own-text + spaced repetition | Unlimited content, MiniMax/Grok/Claude/Ollama support |
| 3 | TTS audio + Capacitor wrapper + (if needed) expanded accounts | Mobile app in the stores |

---

## 11. Decisions (closed)

All previously open questions are resolved:

1. **User scope:** personal + close contacts, login **via Google OAuth only** (no email+password), self-hosted on your own Postgres on Hetzner — no external auth providers (see §7.4).
2. **Backend language:** TypeScript (Node), Postgres self-hosted on Hetzner as the database.
3. **Reference layer (Wiktionary/Tatoeba/frequency lists):** deferred, added in Stage 2 (not in MVP).
4. **Progress granularity:** by lemma.
5. **Default provider:** Claude API.

---

## Appendix A. Generation Prompt Contract (superseded)

This section's draft prompt has been superseded by the full contract in **`STORY_GENERATION_SPEC.md`** (repo root, §8 has the ready-to-use system prompt template) — that document is now authoritative for §6.2; do not use the paraphrase that used to live here.

---

*End of spec. This document is meant for iterative work with Claude Code: start with §3 "MVP", building on the data model in §5.2 and the architecture in §7.*

---

## Appendix B. Design Mockups

- `design/weave-diglot-reader.png` — mobile UI mockup: Library, Reader (with weave popover and density slider), covering FR-2, FR-3, FR-5, FR-9.
