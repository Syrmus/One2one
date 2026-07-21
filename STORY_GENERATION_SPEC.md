# Story Generation Specification — Diglot-Weave Content

**Companion document to `SPEC.md`.** This file is the contract for *generating* diglot-weave stories — usable directly as (or turned into) a system prompt for Claude, MiniMax, Grok, or a local model via Ollama. It's deliberately self-contained: a model given this file plus a single request (`{language, level, topic}`) should be able to produce a valid story with no other context.

---

## 1. Purpose

Given a target language (L2), a CEFR level, and a topic, produce a short story in the base language (L1: Russian) with certain lexical units woven in from L2, following the diglot-weave pedagogy, and output it in the exact JSON format consumed by the reader app (see `SPEC.md` §5.2).

Two entry points use this same contract:
1. **Generate from scratch:** input is `{l2, level, topic, length}` (where `length` defaults to 120–150 words) → output is a new story.
2. **Weave existing text:** input is `{l2, level, l1_text}` → output is the same story split into units, with weaving applied — no new content invented, no plot changes, no added/removed sentences.

Note on `id`: the model may propose a slug, but the app assigns the final, collision-free `id` on save (the model can't know which IDs are already taken). The `{NN}` suffix in the schema example is illustrative — treat it as app-controlled.

---

## 2. Output Contract

The model must return **one JSON object, and nothing else** — no markdown fences, no preamble ("Here is your story:"), no trailing commentary. If the model cannot comply, it is a failure (see §7 validation).

### 2.1. Schema

```jsonc
{
  "id": "string",              // slug: "{l2}-{topic-slug}-{NN}", e.g. "de-broken-window-01"
  "l1": "ru",
  "l2": "de | nl | es",         // ISO 639-1 code of the target language
  "level": "A1 | A2",
  "topic": "string",            // short human-readable topic, in l1
  "title": "string",            // story title, in l1
  "units": [ /* see 2.2 */ ]
}
```

### 2.2. Unit types

Every unit is either `text` (fixed L1 content — never shown in L2) or `weave` (a lexical unit that can appear in L1 or L2 depending on the reader's density threshold).

**`text` unit:**
```jsonc
{ "t": "text", "l1": "Однажды старый " }
```
- Contains punctuation, spacing, and any words the method has not yet introduced.
- Preserve exact whitespace: units concatenate directly, so a unit must include the space that separates it from its neighbors (see §2.3).

**`weave` unit:**
```jsonc
{
  "t": "weave",
  "l1": "пёс",              // the L1 word/phrase as it appears in natural flow
  "l2": "Hund",              // the L2 equivalent, correctly inflected for THIS occurrence
  "lemma": "Hund",           // L2 dictionary/base form — same for every occurrence of this word across the story
  "pos": "noun | verb | adjective | adverb | phrase | function_word",
  "gender": "m | f | n | c | null",   // use values appropriate to the language: m/f/n for de, m/f for es, c (common)/n (neuter) for nl; null/omit for non-nouns
  "article": "string | null",     // the article as it appears in THIS occurrence (e.g. "der", "den", "dem", "de", "het", "el", "la"); null if the noun takes no article here
  "case": "nom | acc | dat | gen | null",  // German only; null for nl/es
  "gloss": "string",         // L1 translation of the lemma (dictionary form), NOT of the inflected occurrence
  "ipa": "string",           // IPA for the L2 lemma (not per-occurrence)
  "weave_priority": integer  // see §4
}
```

### 2.3. Concatenation and interchangeability rule (critical)

The reader renders a story by concatenating the `l1` (or, for shown weave units, `l2`) values of consecutive units in order, with no automatic spacing inserted. Two consequences:

- **Whitespace lives inside the unit strings.** `"Она идёт в "` (trailing space) followed by a weave unit `"l1": "кухню"` followed by `" и готовит "` is correct; dropping the trailing space glues words together.
- **A weave unit's `l1` and `l2` must be drop-in interchangeable in place.** Whatever renders in that slot must be grammatical whether the L1 or the L2 variant is shown. This has one non-obvious implication that is the most common source of bugs:

  **Any determiner/article tied to a woven noun must live INSIDE the weave unit — on both the `l1` and `l2` sides — never in an adjacent `text` unit.** Otherwise the article doubles or drops when the variant switches.

  - Wrong: `text` = `"...into the "`, then weave `l1:"kitchen" / l2:"die Küche"`. L2 render → `"into the die Küche"` (double article).
  - Right (L1 has articles, e.g. English): weave `l1:"the kitchen" / l2:"die Küche"`; preceding `text` = `"...into "`. Both variants render cleanly.
  - Right (L1 has no articles, e.g. Russian — the production case): weave `l1:"кухню" / l2:"die Küche"`; no determiner exists on the L1 side and none is placed in surrounding text, so `"...в кухню..."` ↔ `"...в die Küche..."` both read correctly.

  In short: the determiner is part of the lexical unit, present on both sides or absent on both sides — but never split across a unit boundary.
- Do not put punctuation inside `l2` that isn't in `l1`: if `l1:"пёс"` has no comma, don't write `l2:"Hund,"` — put the comma in the following `text` unit so both variants stay swap-safe.

---

## 3. Method Rules (must be followed by the generator)

1. **Whole lexical units, not bare words — determiner included.** Weave `nach Hause` as one unit, not `Hause` glued to a separately-woven `nach`. When a noun needs an article, fold the article into the `l2` string (`"l2": "der Hund"`) AND record it in the `article` field (for the popover). Per §2.3, the matching determiner must be present on the `l1` side too (if L1 has one) or absent on both — never parked in an adjacent `text` unit. Do not split one lexical unit across several weave units.
2. **Correct morphology, every time.** Case, gender, and number agreement in the L2 string must be grammatically correct for that exact sentence position — a wrong article or case ending is worse than not weaving the word at all, since it teaches an error.
3. **Introduction order** (via `weave_priority`, ascending = introduced earlier). **This is a GLOBAL, absolute scale shared across the entire library, not relative within one story** — otherwise the reader's threshold `T` would mean different things in different stories and cross-story progress would break. Anchor it to frequency where possible (more frequent word ⇒ lower number). A single short story just samples a few points on this scale; it does not need to span all bands.
   - Priority 1–5: concrete, high-imageability nouns (dog, house, table, water, door)
   - Priority 6–10: high-frequency verbs (go, eat, see, want, have)
   - Priority 11–15: adjectives (big, small, good, old)
   - Priority 16–20: adverbs and common phrases (nach Hause, immer, schnell)
   - Priority 21+: function words (prepositions, conjunctions, pronouns) — introduce last, and sparingly, since these carry the least standalone meaning and are hardest to guess from context
4. **Density is a consequence of tagging, not a separate knob.** Tag as `weave` every unit you legitimately could weave (subject to the rules here); the reader controls how many actually show via the threshold `T` on `weave_priority`. Practical target: at the lowest reader setting (`T` covering roughly the 1–3 band), about 10–15% of the story's content words should surface in L2. For a 120–150-word story that means roughly 7–12 woven units across the priority bands at the entry level — do not front-load them into one sentence; spread them out.
5. **No orphan grammar.** Never weave a word in a form that requires grammatical knowledge the reader hasn't been given (e.g. don't weave a verb conjugated in a compound tense before the story has established simpler forms) — for A1/A2, stick to present tense and simple past.
6. **Consistency of lemma.** If a word appears multiple times in the story, every occurrence must share the same `lemma` and `gloss`, even though `l2` (the inflected surface form) and `case`/`article` may differ per occurrence.
7. **Don't weave what can't be guessed.** Function words, abstract words, and idioms with non-transparent meaning should either not be woven, or be woven only after level A2 and only with a very clear surrounding context.

---

## 4. Level Guidelines

| Level | Sentence length | Vocabulary | Tense | Topics |
|-------|-----------------|-----------|-------|--------|
| A1 | short, mostly simple (subject-verb-object) | very high-frequency, concrete | present tense, simple past for narration | daily routine, family, food, weather, simple errands |
| A2 | can include one subordinate clause | still frequent but broader; some abstract nouns allowed | present + simple past; occasional modal verbs | travel, work, shopping, simple past events, plans |

**Length.** Target length is a request parameter (`length`), defaulting to **120–150 words** of `l1` text — the story as the reader sees it at zero weave density, counting every `l1` field (text and weave units alike). This default is the same across levels; level is distinguished by the columns above (sentence complexity, tense, vocabulary), not by length. At 120–150 words expect a short, self-contained paragraph — a small scene, anecdote, or fact with a beginning and end. Note that a Russian rendering of the same content is typically ~15–20% shorter in word count than English, so translated pairs are counted per language, not forced to match.

Topic should be concrete and visualizable — avoid topics that require abstract vocabulary too early (philosophy, emotions-as-topic, politics).

---

## 5. Language-Specific Morphology Notes

### German (de)
- Three genders (`der`/`die`/`das`), four cases. The `article` and `case` fields are mandatory for every woven noun.
- Separable-prefix verbs (`aufstehen`, `mitkommen`) — weave as a single `phrase`-type lemma when the prefix separates in the sentence (e.g. "steht ... auf"), or note in `gloss` that it's separable. Prefer simple, non-separable-verb sentences at A1 to avoid this complexity in the reader.
- Compound nouns (`Haustür`) are single lemmas — don't split them into weave units.

### Dutch (nl)
- Two articles (`de`/`het`) with no reliable synchronic rule — the model must know or look up the correct article per noun; `gender` field can be `c` (common) or `n` (neuter) with `article` holding `de`/`het` accordingly.
- Word order: verb-second in main clauses — don't let weaving disrupt this.

### Spanish (es)
- Two genders (`el`/`la`), adjectives agree in gender and number with the noun — if an adjective is woven alongside a noun, both must agree; if only the noun is woven, the surrounding L1 adjective is untouched (that's fine — mixed L1/L2 within a phrase is expected at low density).
- Ser vs. estar distinction — at A1, prefer simple, unambiguous uses of each to avoid teaching the wrong one via bad context.

---

## 6. Weaving Existing User Text (mode 2)

When given `l1_text` instead of a generation prompt:
- **Do not alter the story.** No new sentences, no removed content, no changed plot or facts. The only transformation is: split into units, and mark some units as `weave` with L2 equivalents.
- If the source text contains vocabulary far above the target level, weave conservatively (lower density) rather than forcing unsuitable words — flag this in a `"notes"` field outside `units` if the format is extended to support it (optional, not in the current app schema — omit unless requested).
- Preserve the original tone, punctuation, and paragraph breaks as `text` units.

---

## 7. Validation Contract

The calling application will validate output before accepting it:
1. **JSON parses.** No markdown fences, no leading/trailing text.
2. **Schema conformance.** All required fields present per §2.2; `weave_priority` is an integer; `pos`/`gender`/`case` use only the allowed enum values for the requested language.
3. **Length.** Total word count of all `l1` fields (in order) is within the requested `length` range (default 120–150 words). Enforced here rather than trusted to the model.
4. **Concatenation & interchangeability.** Joining all `l1` fields in order reproduces coherent, grammatical L1 text; rendering every weave unit's `l2` at max threshold produces grammatical L2 text with no doubled or dropped articles (the determiner check from §2.3).
5. **Lemma consistency.** Same surface word ⇒ same `lemma` and `gloss` throughout the story.
6. **(If reference layer connected, Stage 2)** Gender/article cross-checked against Wiktionary data; mismatches flagged.

**On validation failure:** one automatic retry, appending the specific validation error(s) to the prompt and asking the model to correct only the failing part while preserving everything else. A second failure surfaces to the developer rather than silently degrading.

---

## 8. Ready-to-Use System Prompt Template

This is the literal template to send as the system prompt (fill in `{...}` placeholders from the request parameters):

```
You are a content generator for a language-learning app that uses the "diglot weave" method.

Return ONLY a single valid JSON object matching this schema — no markdown fences, no preamble, no explanation:

{schema from §2.1–2.2, inserted verbatim}

Task: {"Write an original short story" | "Weave the following user-provided text"} in the base language Russian (l1) {"on the topic: " + topic | "— text follows below, do not alter its content"}, for CEFR level {level}, targeting the language {l2} as the woven language (l2).

Rules you must follow:
1. Weave whole lexical units (e.g. article + noun, a verb + separable prefix, a fixed phrase), never bare words stripped of the grammar that makes them correct in context. Any article tied to a noun goes INSIDE the weave unit on both the l1 and l2 sides (or is absent on both) — never in an adjacent text unit, or it will double.
2. Every woven l2 string must be grammatically correct for its exact position in the sentence: correct article, case (German), gender/number agreement (Spanish, Dutch).
3. Assign weave_priority ascending in this order: concrete nouns (1-5) → high-frequency verbs (6-10) → adjectives (11-15) → adverbs/phrases (16-20) → function words (21+, use sparingly).
4. Target starting density: 10-15% of content words woven at the lowest threshold.
5. Keep the same lemma and gloss for every occurrence of a repeated word.
6. Sentence and story length per level: {insert level guideline table row from §4}.
7. {Language-specific note from §5 for the requested l2}
8. Whitespace must be embedded inside unit strings so that concatenating units in order reproduces correct spacing — see the concatenation rule.

{If mode 2 (weave existing text): "Do not invent, remove, or alter any content from the source text below. Only split it into units and mark weavable units. Source text: {l1_text}"}
```

---

## 9. Worked Example (German, A1, "morning routine")

**Note:** in production, `l1` is Russian (per `SPEC.md` §2). This example uses English for `l1` to keep the document readable without mixing scripts — but article handling is exactly the place where the L1 language matters, so read the note under the JSON. The `l1` text in this short illustration is well under the 120–150-word production range from §4 — it is trimmed only to keep the example readable; real seed/generated stories are full 120–150-word paragraphs.

```json
{
  "id": "de-morning-routine-01",
  "l1": "en",
  "l2": "de",
  "level": "A1",
  "topic": "morning routine",
  "title": "An Ordinary Morning",
  "units": [
    { "t": "text", "l1": "Anna gets up early every day. She goes into " },
    {
      "t": "weave", "l1": "the kitchen", "l2": "die Küche",
      "lemma": "Küche", "pos": "noun", "gender": "f", "article": "die", "case": "acc",
      "gloss": "kitchen", "ipa": "ˈkʏçə", "weave_priority": 2
    },
    { "t": "text", "l1": " and makes hot " },
    {
      "t": "weave", "l1": "coffee", "l2": "Kaffee",
      "lemma": "Kaffee", "pos": "noun", "gender": "m", "article": null, "case": "acc",
      "gloss": "coffee", "ipa": "ˈkafeː", "weave_priority": 1
    },
    { "t": "text", "l1": ". Then she " },
    {
      "t": "weave", "l1": "eats", "l2": "isst",
      "lemma": "essen", "pos": "verb", "gender": null, "article": null, "case": null,
      "gloss": "to eat", "ipa": "ɪst", "weave_priority": 7
    },
    { "t": "text", "l1": " bread with butter and drinks some tea." }
  ]
}
```

Key points this example demonstrates:
- **Determiner inside the weave unit (§2.3).** The first weave unit carries `l1:"the kitchen"` / `l2:"die Küche"` — the article "the" is NOT left in the preceding `text` unit (which ends at "goes into "). L1 renders "…into the kitchen…", L2 renders "…into die Küche…" — no doubled article either way.
- **How Russian differs.** In the production Russian version, that unit would be `l1:"кухню"` / `l2:"die Küche"` with no article on the L1 side (Russian has none), and the surrounding text would carry no determiner either — so "…в кухню…" ↔ "…в die Küche…" both stay grammatical. The article-placement rule is what makes both languages work; the mechanics are NOT identical across L1 languages precisely at the article.
- **Correct case marking** — `die Küche` is feminine, so accusative keeps `die`.
- **A noun with no article in context** (`Kaffee`, mass noun in the accusative here) — `article: null`.
- **Verb with the infinitive as `lemma`** (`isst` → `essen`), priorities reflecting noun-first (1–2), verb-later (7) ordering on the global scale.

---

## 10. Common Mistakes to Avoid (negative examples)

- **Article left in the text unit** → doubling. `text:"…into the "` + `weave l1:"kitchen"/l2:"die Küche"` renders "into the die Küche". Fix: `weave l1:"the kitchen"/l2:"die Küche"`, `text:"…into "`.
- **Markdown fences or preamble** around the JSON ("```json", "Here is the story:"). Return the raw object only.
- **Per-story relative priorities.** Numbering weave units 1,2,3… within one story breaks cross-library thresholds. Use the global frequency-anchored scale (§3.3).
- **Inconsistent lemma/gloss** for the same word across occurrences (e.g. `essen` in one unit, `isst` as lemma in another). The lemma is always the dictionary form.
- **Punctuation smuggled into `l2`** (`"l2":"Hund,"`) while `l1` has none — breaks interchangeability. Keep punctuation in `text` units.
- **Wrong morphology to force a weave.** If you can't produce the correct case/gender/agreement for a word in its position, leave it as L1 `text` rather than weaving an incorrect form — a wrong article teaches an error.
- **Ignoring the length check.** Padding to look longer or truncating mid-sentence to hit the count. Write a naturally complete paragraph within the word range.

---

*This document, together with `SPEC.md`, is sufficient context for Claude Code (or another model) to implement and call the generation endpoint described in `SPEC.md` §6 and §7.3.*
