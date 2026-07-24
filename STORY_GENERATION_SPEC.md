# Story Generation Specification v2.0 — Diglot-Weave Content

**Supersedes `STORY_GENERATION_SPEC.md` (v1).** Companion to `SPEC.md` (app spec). This is the contract for *creating* diglot-weave stories — usable as a system prompt for Claude / MiniMax / Grok / a local model, and as the spec the app's reader logic must implement.

**What changed from v1:**
1. Three difficulty levels defined: **A1, A2, B1** (v1 had one, effectively B1).
2. The old density mechanism (A1-lite / A1 / A2 tiers via a `weave_priority` threshold) is **removed**.
3. Density is now a **single, uniform percentage-of-total-words scale** (§4) — content-before-function ordering comes from `weave_priority` banding alone, not from a separate phase/denominator (an initial two-phase design was tried and dropped: it produced uneven, occasionally zero-progress steps).
4. Text difficulty level and weave density are **two independent axes** (see §2).
5. Deliverable: **5 texts per level × 3 levels = 15 base texts**, each authored in **Russian + English**, each woven into **German, Dutch, Spanish**.

---

## 1. Purpose

Given a difficulty level, a base language, a target language, and a topic, produce a short story in the base language (L1) with a **fully aligned target-language (L2) version**, so the reader app can progressively reveal L2 from a light dusting up to 100% of the text. Output is the JSON described in §5, consumed by the reader.

Two entry points share this contract:
1. **Generate from scratch:** input `{level, l1, l2, topic}` → a new story.
2. **Weave existing text:** input `{level, l1, l2, l1_text}` → the same text split into units with the aligned L2, no content changes.

Note on `id`: the model may propose a slug; the app assigns the final collision-free `id` on save.

---

## 2. Two independent axes (read this first)

The single most important concept in v2: **text difficulty and weave density are orthogonal.**

- **Axis 1 — Text level (A1 / A2 / B1).** Chosen per story. Because the L1 scaffold is always fully understood by the reader, "level" here does **not** govern comprehensibility of the base text. It governs (a) the **frequency/difficulty band of the L2 words** that get woven and (b) the **conceptual sophistication and length** of the content. An A1 story weaves only the most frequent, concrete L2 words; a B1 story weaves a broader, less frequent set into richer content.

- **Axis 2 — Weave density (the percentage scale, §4).** Applied *within* a chosen story by the reader's difficulty slider. It controls how much of that story is currently shown in L2, from a light start up to 100%. The **same density mechanism applies to every level** — an A1 story and a B1 story both run the full 0%→100% progression; they differ only in *which* words are woven, not in *how far* the slider can go.

Consequence: level is a property of the **stored story**; density is a **runtime view** of it. Do not encode density into the level, or cap density by level.

---

## 3. Level definitions (Axis 1)

Length is measured in words of L1 text. Russian renders ~15–20% shorter in word count than English for the same content, so counts are per language, not forced to match.

| Level | L1 length | Sentences | L2 vocabulary woven | L2 grammar reached at high density | Topics |
|-------|-----------|-----------|---------------------|-------------------------------------|--------|
| **A1** | 60–90 words | very short, simple SVO | ~top 500 frequency; concrete everyday nouns, a few high-frequency verbs | present tense; singular/plural; basic articles | self, family, home, food, daily routine, numbers, colours |
| **A2** | 100–130 words | short; at most one subordinate clause | ~top 1500; broader concrete nouns, common verbs, basic adjectives | present + simple past; common prepositions; comparatives | travel, work, shopping, hobbies, simple past events, plans |
| **B1** | 130–160 words | longer; subordinate clauses, varied tenses | ~top 3000; some abstract nouns, richer verbs/adjectives/adverbs | past/present/future; subordinate clauses; modal verbs | psychology, science facts, relationships, opinions, explanations |

The current seed stories (`seed_stories.md`) are B1 and **must be reworked** to (a) fit the new density model of §4 — i.e. every content word is a weave unit and function words are marked — and (b) sit cleanly alongside new A1 and A2 sets.

**Deliverable matrix**

| | Base RU | Base EN |
|---|---|---|
| A1 (5 texts) | ×3 target langs = 15 | ×3 = 15 |
| A2 (5 texts) | ×3 = 15 | ×3 = 15 |
| B1 (5 texts, reworked) | ×3 = 15 | ×3 = 15 |

15 base texts × 2 base languages × 3 target languages = **90 story objects**. The base text of a given story is shared across its three target-language versions; only the woven L2 layer differs.

---

## 4. Weave density scale (Axis 2) — the core of v2

### 4.1 Principle

Every word in a story is a weave unit (content or function — see §4.4 for the split). The reader's slider picks a **density step**: a single target percentage of the **story's total word count**. The app reveals whole weave units **in ascending `weave_priority` order** until the revealed share of the total word count reaches the step's target.

This is a single uniform scale — one denominator (total words), not two. Content-before-function ordering (meaning-bearing words first, grammatical glue last) is achieved purely through `weave_priority` banding (§4.4): since every content unit's priority is lower than every function unit's, walking the list in priority order reveals all content long before any function word is reached, with no need for a separate phase or a second percentage base.

An earlier revision of this spec used two phases with different denominators (percent of content words, then percent of all words). That produced uneven, sometimes-zero steps in practice — when a story's content words already exceeded a later step's all-words target, that step revealed nothing at all. The single-scale model in §4.2 doesn't have this failure mode: every step's target is expressed against the same denominator, so steps are monotonic by construction and their size only varies with each story's actual weave-unit word-length distribution (typically ±5 points around the nominal step size, never zero).

### 4.2 Recommended step list (default)

Evenly spaced against total word count — deliberately uniform, so consecutive steps always add a comparable, predictable amount of visible L2.

| Step | Target (% of all words) | What's happening |
|------|--------------------------|-------------------|
| 1 | 0% | original L1 text, nothing woven |
| 2 | 15% | most frequent concrete nouns |
| 3 | 30% | + more nouns, top verbs |
| 4 | 45% | + remaining nouns/verbs, adjectives |
| 5 | 60% | + adverbs; content words mostly done |
| 6 | 75% | function words begin (articles, prepositions, pronouns, auxiliaries) |
| 7 | 90% | + most remaining function words |
| 8 | 100% | fully L2 |

**The step list must be an app-configurable array** (`packages/shared/src/density.ts`'s `DEFAULT_STEPS`) — swap in a coarser or finer list without touching the reveal algorithm in §4.5, which only ever reads `{ target }` percentages against the one total-word denominator.

### 4.3 (removed)

The two-phase alternative step list formerly documented here is obsolete — it depended on the two-denominator model replaced in §4.1. Any step list works under the single-scale model as long as targets are ascending percentages of total words.

### 4.4 Priority ordering

`weave_priority` is a positive integer, ascending = revealed earlier, on a scale **global across the whole library** so the slider means the same thing everywhere. One hard rule:

- **Every content-word unit must have a lower priority than every function-word unit.** This is what guarantees content is fully revealed before any function word appears, even though both now share one percentage scale (§4.1) — the ordering comes from priority, not from a phase boundary.
- Within content, order by part of speech then frequency: concrete nouns (lowest) → high-frequency verbs → adjectives → adverbs. Within function words, order by frequency.

Suggested bands: content words `1–49`, function words `50+`. Exact numbers are free as long as the content/function split holds.

### 4.5 Reveal algorithm (the app must implement this)

```
render(story, step):
    units = [u for weave units u]                    # ordered by weave_priority (content-before-function
                                                       # falls out of the priority bands in §4.4, not from
                                                       # any special-casing here)
    target = ceil(step.percent * count_words(units))
    reveal units in priority order until woven words >= target
    unrevealed units render their l1; revealed units render their l2
```

`is_content(u)` = `u.pos in {noun, verb, adjective, adverb}` and `u.pos` is not an auxiliary/modal marked as function — used only for §4.4's priority banding, not for the reveal math itself. Counting is **by words**: a multi-word lexical unit (e.g. `der Hund`) counts its words toward the denominator and is revealed atomically (all-or-nothing), so partial reveals never split an article from its noun.

### 4.6 Reorder groups — how fluent 100% is actually achieved

Toggling single L2 words into an L1 sentence in place works only as long as L1 and L2 share the same local word order. They often don't: German pushes the finite verb to position two in main clauses and to the very end in subordinate clauses; adverbs, separable prefixes, and adjective/noun order shift between languages; some slots need an article in L2 that L1 has no word for at all. A naive one-word-at-a-time toggle at high density produces L2 vocabulary in L1 order — readable as a gloss, not fluent L2. Rather than adding a second rendering mode for "high density," the fix is to **make the atomic weave unit bigger exactly where reordering is needed**, using the multi-word-unit mechanism already defined in §4.5/§5.1 — this keeps one single mechanism across the entire 0%→100% range.

**Rule.** A weave unit's `l1` must still be an exact contiguous span of the L1 text (so concatenation stays valid — see §5.1), but its `l2` is free to reorder words *within that span* however L2 grammar requires. This is the same principle already used for `nach Hause` or `der Hund`; §4.6 just applies it deliberately to fix word order, not only to fix fixed phrases or determiners.

- **Local reordering** (adverb position, separable-verb prefixes, Romance adjective-noun order): group only the words whose relative order actually changes into one unit. Example: English "also eats" (adverb-verb) → group as one unit `l1:"also eats"` / `l2:"isst auch"` (verb-adverb) instead of two separate word-for-word units. This keeps granularity fine everywhere else in the sentence.
- **Missing-word insertion**: if L2 needs an article/word L1 doesn't have (e.g. English "At night" has no article, German needs "In der Nacht"), fold the extra word into the unit's `l2` rather than trying to source it from L1: `l1:"At night"` / `l2:"In der Nacht"`. The `l1` side still matches the source text exactly; only `l2` gains the word.
- **Clause-level reordering** (German subordinate clauses sending the verb to the end): when the reorder spans more than a couple of words, granularity should coarsen to match — the whole subordinate clause becomes one atomic unit at a single `weave_priority`, rather than forcing per-word units that can't reproduce verb-final order. This trades fine-grained partial reveal *within that specific clause* for correctness; it does not affect other clauses in the same sentence, which keep normal word-level granularity.
- **Priority of a group** = the priority appropriate to its head word for content/function classification (e.g. a verb+adverb group counts as content, priority in the verb band); its word count (for §4.5's percentage math) is the total word count of `l1`.

This is a modeling choice the generator makes per-sentence, not a fixed rule of thumb — the model should default to the finest granularity that stays grammatical, and only widen a unit when a narrower one would be ungrammatical.

**Second validated case — subject-verb inversion.** German requires the finite verb in position two; if a sentence opens with a fronted adverbial (as one does here: "At night..." → "In der Nacht..."), the subject and verb invert: "In der Nacht **ist die Katze** wach," not "In der Nacht die Katze ist wach." Testing found exactly this bug. The fix groups the copula with the subject it inverts with — `l1:"the cat is"` / `l2:"ist die Katze"` — tagged `pos:"auxiliary"` (matching the copula's classification elsewhere in the same story) so it still sorts into the function band for §4.4's priority split, even though the group's `l1` span contains a noun. **This is the accepted trade-off:** the individual word "cat" inside this specific occurrence isn't separately gated by the density slider — it arrives bundled with the grammar fix — but the lemma `Katze` is still introduced earlier in the story through its other (ungrouped) occurrences, so vocabulary exposure isn't lost, only slightly reshuffled at this one spot.

---

## 5. Output contract & schema

Return **one JSON object, nothing else** — no markdown fences, no preamble. The object now aligns the *entire* text (every non-punctuation word is a weave unit at some priority), because density can reach 100%.

```jsonc
{
  "id": "string",                 // app finalizes; model may propose "{l2}-{l1}-{slug}"
  "l1": "ru | en",                // base language
  "l2": "de | nl | es",            // target language
  "level": "A1 | A2 | B1",
  "topic": "string",               // in l1
  "title": "string",               // in l1
  "units": [ /* text or weave */ ]
}
```

**`text` unit** — fixed L1 content never shown in L2: punctuation, spacing, and (optionally) words you choose not to weave at all.
```jsonc
{ "t": "text", "l1": ". " }
```

**`weave` unit** — a lexical unit revealed in L1 or L2 depending on the density step:
```jsonc
{
  "t": "weave",
  "l1": "пса",                 // L1 surface form as it appears in flow
  "l2": "den Hund",             // L2 surface, correctly inflected for THIS position
  "lemma": "Hund",              // L2 dictionary form; identical for every occurrence
  "pos": "noun | verb | adjective | adverb | article | preposition | pronoun | conjunction | auxiliary | numeral | particle",
  "gender": "m | f | n | c | null",
  "article": "string | null",   // article as it appears here, if folded into l2
  "case": "nom | acc | dat | gen | null",
  "gloss": "string",            // translation of the lemma into l1
  "ipa": "string | null",       // IPA of the l2 lemma; null is acceptable (fill from reference layer later)
  "weave_priority": 3,
  "proper_noun": false          // true for person/place/brand names (optional, default false)
}
```

`pos` now spans content **and** function categories, because at 100% density function words are woven too. `is_content` is derived from `pos` (§4.5).

**`proper_noun`.** Set `true` on names (characters, cities, brands — e.g. `Anna`, `Berlin`) tagged `pos: "noun"`. They're still woven and revealed on the normal content-word schedule, but the reader can't add them to its vocabulary and quizzes skip them — translating a name isn't a vocabulary item. Everything else (`weave_priority` banding, `gloss`, `lemma`) still applies normally; this is purely a downstream-filtering hint, not a new `pos` value.

### 5.1 Concatenation & interchangeability (unchanged, still critical)

Joining every unit's `l1` in order must reproduce the exact L1 text (whitespace lives inside unit strings). Each weave unit's `l1` and `l2` must be swap-safe in place: any determiner tied to a noun lives **inside** the weave unit on both sides (or is absent on both) — never in an adjacent `text` unit, or it doubles/drops at partial density. Because partial reveals mix L1 and L2 words in one sentence, keeping each lexical unit self-contained is what keeps those mixed sentences readable. Where L2 word order or an extra required word differs from L1 within a span, that span becomes one multi-word unit per the **reorder-group** mechanism in §4.6 — `l1` still matches the source text exactly; only `l2` is reordered/extended.

### 5.2 Full-coverage requirement (new in v2)

To support density up to 100%, **every word of the sentence must belong to a weave unit** (only punctuation/spacing may remain permanent `text`). In effect the model produces a complete, grammatically correct L2 translation of the story, aligned to the L1 lexical-unit by lexical-unit, then assigns each unit a priority. **Fluency at 100% density is achieved through reorder groups (§4.6), not through a separate rendering mode** — the same unit-by-unit reveal mechanism runs across the whole 0%→100% range; units simply widen to a phrase or a whole subordinate clause exactly where L2 word order demands it. At 100% density the concatenated `l2` values must read as fluent, correct L2 prose — this is a full translation, not isolated word swaps.

---

## 6. Method & morphology rules

1. **Whole lexical units, and whole reorder groups.** Weave `nach Hause`, `der Hund`, a separable verb + its prefix, as single units — never bare fragments that are ungrammatical alone. Where L2 word order differs locally from L1, group the affected words into one unit so `l2` can be reordered internally (§4.6) — e.g. `l1:"also eats"` / `l2:"isst auch"` — rather than toggling each word independently and producing L2 vocabulary in L1 order.
2. **Correct morphology at every position.** Case, gender, number, and agreement in each `l2` string must be correct for that exact slot. A wrong article/ending teaches an error and is worse than leaving the word in L1.
3. **Introduction order** via `weave_priority` (§4.4): concrete nouns → frequent verbs → adjectives → adverbs → (function words last).
4. **Consistent lemma/gloss** across all occurrences of a word.
5. **Level-appropriate L2 vocabulary** per §3 — an A1 story must not require B1-level L2 words.
6. **Partial-reveal coherence.** Design units so that at any density step the mixed L1/L2 sentence stays readable (follows from §5.1).

### 6.1 Language-specific notes
- **German (de):** three genders, four cases — `article` + `case` mandatory on nouns; fold article into `l2`. Separable-prefix verbs woven as one unit; compound nouns are single lemmas.
- **Dutch (nl):** `de`/`het` gender has no reliable rule — set `gender` `c`/`n` and `article` accordingly. Verb-second word order must survive weaving.
- **Spanish (es):** gender/number agreement between noun and any woven adjective; `el`/`la`. Mind `ser`/`estar` and `por`/`para` at B1.

---

## 7. Validation contract

The app validates before accepting output:
1. **JSON parses** — no fences, no extra text.
2. **Schema** — required fields present; `pos`/`gender`/`case` within allowed enums for the language; `weave_priority` integer.
3. **Concatenation** — joined `l1` reproduces the L1 text exactly; joined `l2` (all revealed) is fluent, correct L2.
4. **Full coverage (§5.2)** — every non-punctuation word is inside a weave unit (so 100% density = fully L2).
5. **Priority split (§4.4)** — every content unit's priority < every function unit's priority.
6. **Density reachability (§4.5)** — for each configured step, the reveal algorithm produces a woven share within one lexical unit of the target.
7. **Word order at high density (§4.6)** — with all units revealed, verb position, adverb placement, and article insertion must be correct for {l2} grammar; this is what reorder groups exist to guarantee. Spot-check verb-second/verb-final placement in German specifically, since it's the most common failure mode found in testing.
8. **Length** — L1 word count within the level's range (§3), enforced here, not trusted to the model.
9. **Interchangeability** — no article doubles or drops at any partial step (determiner rule).
10. **(Reference layer, later)** — gender/article/IPA cross-checked against Wiktionary; mismatches flagged.

On failure: one automatic retry appending the specific errors, asking the model to fix only the failing part.

---

## 8. Ready-to-use system prompt template

Fill `{...}` from the request; insert the §5 schema verbatim.

```
You are a content generator for a language-learning app using the diglot-weave method.

Return ONLY one valid JSON object matching this schema — no markdown, no preamble:
{schema from §5}

Task: {"Write an original short story" | "Weave the text below, changing no content"} in the base language {l1} for CEFR level {level}, target language {l2}, topic "{topic}".

Level {level} constraints: {row from §3 — length, sentence complexity, L2 vocabulary band}.

Hard rules:
1. Produce a COMPLETE, grammatically correct {l2} translation aligned to the {l1} text: every word of every sentence must be a weave unit (only punctuation stays as plain text), so the reader can reach 100% {l2}.
2. Weave whole lexical units with correct {l2} morphology (article, case, gender/number agreement). Any article tied to a noun goes INSIDE the weave unit on both l1 and l2 sides, never in an adjacent text unit. Where {l2} word order differs from {l1} within a span (e.g. verb position, adverb placement, adjective-noun order) or {l2} needs a word {l1} doesn't have (e.g. a missing article), group the affected words into ONE weave unit and reorder/extend only inside l2 — l1 must still match the source text exactly. For subordinate clauses where {l2} moves the verb to the end, it is acceptable to make the whole clause one larger unit rather than forcing per-word units that would be ungrammatical.
3. weave_priority (global ascending scale): ALL content words (noun/verb/adjective/adverb) must have LOWER priority than ANY function word (article/preposition/pronoun/conjunction/auxiliary/numeral/particle). Within content: concrete nouns lowest, then frequent verbs, then adjectives, then adverbs. Within function: by frequency. Suggested bands: content 1-49, function 50+.
4. Keep the same lemma and gloss for every occurrence of a word. gloss is the {l1} translation of the lemma.
5. Whitespace lives inside unit strings so concatenating all l1 reproduces the source exactly.
6. {language-specific note from §6.1 for {l2}}

{If weaving existing text: "Do not invent, remove, or reorder content. Only split into units and add the aligned l2. Source: {l1_text}"}
```

---

## 9. Worked example (schematic)

A1, base EN, target DE, two fragments chosen to show **why reorder groups matter** — both are real cases found while validating a full-coverage German weave of an A1 story.

**Fragment 1 — local reordering (adverb + verb).** English "The cat also eats fish" is SVO with the adverb before the verb; German puts the adverb after the verb: "Die Katze isst auch Fisch." A naive word-for-word toggle of "also"→"auch" and "eats"→"isst" independently would render "...auch isst Fisch" or "...isst auch..." depending on toggle order — fragile and, in the actual test, produced "auch frisst" (wrong order). The fix is one reorder-group unit spanning both words:

```jsonc
{ "t": "weave", "l1": "also eats", "l2": "isst auch", "lemma": "essen",
  "pos": "verb", "gender": null, "article": null, "case": null,
  "gloss": "to eat / also", "ipa": null, "weave_priority": 21 }
```

`l1` is still the exact contiguous source span ("also eats"); `l2` is freely reordered inside it. The unit reveals atomically — you never see "also isst" or "auch eats."

**Fragment 2 — missing word.** English "At night" has no article; German requires one: "In der Nacht." Word-for-word toggling has nowhere to source "der" from, so in testing it was either dropped ("In Nacht") or wrongly duplicated from a neighboring unit. The fix folds the extra word into `l2`:

```jsonc
{ "t": "weave", "l1": "At night", "l2": "In der Nacht", "lemma": "Nacht",
  "pos": "noun", "gender": "f", "article": "die", "case": "dat", "ipa": "naxt", "gloss": "night", "weave_priority": 5 }
```

**Fragment 3 — clause-level reordering (subject-verb inversion).** German puts the finite verb in position two; a sentence opening with a fronted adverbial forces subject and verb to swap. English "At night the cat is awake" (no inversion) → German "In der Nacht **ist die Katze** wach" (verb before subject). Testing initially produced "In der Nacht die Katze ist wach" (no inversion) — wrong. The fix groups the copula with the subject it inverts with:

```jsonc
{ "t": "weave", "l1": "the cat is", "l2": "ist die Katze", "lemma": "sein",
  "pos": "auxiliary", "gender": null, "article": null, "case": null,
  "gloss": "is / cat", "ipa": null, "weave_priority": 52 }
```

Tagging it `auxiliary` (matching how the copula is classified everywhere else in this story) keeps it in the function priority band per §4.4, even though its `l1` span contains a noun. The trade-off: this particular occurrence of "cat" isn't separately gated by the slider, but the lemma is already introduced through its other occurrences elsewhere in the story, so nothing is lost — only reshuffled.

**A simple case for contrast — no reordering needed.** "The dog runs home":

```jsonc
{ "t": "weave", "l1": "The dog", "l2": "Der Hund", "lemma": "Hund", "pos": "noun",
  "gender": "m", "article": "der", "case": "nom", "gloss": "dog", "ipa": "hʊnt", "weave_priority": 2 }
{ "t": "weave", "l1": "runs", "l2": "läuft", "lemma": "laufen", "pos": "verb",
  "gender": null, "article": null, "case": null, "gloss": "to run", "ipa": "ˈlaʊfn̩", "weave_priority": 8 }
{ "t": "weave", "l1": "home", "l2": "nach Hause", "lemma": "nach Hause", "pos": "adverb",
  "gender": null, "article": null, "case": null, "gloss": "home", "ipa": "naːx ˈhaʊzə", "weave_priority": 16 }
{ "t": "text", "l1": "." }
```

Here word order already matches between EN and DE, so each word stays its own unit — fine-grained partial reveal is preserved. The lesson: **default to word-level units; widen to a reorder group only where a narrower unit would be ungrammatical.**

---

*This document, with `SPEC.md`, is sufficient context for Claude Code to implement the reader's density logic (§4.5) and the generation endpoint (§8), and to produce the 90-story deliverable of §3.*
