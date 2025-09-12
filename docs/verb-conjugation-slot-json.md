# Verb Conjugation Slot — JSON Schemas and Examples

This document defines the JSON data formats used by the Verb Conjugation Slot Machine game and provides examples for DE/ES/EN. These files feed the prompt generator and seeding/import commands.

Note: Keys shown below indicate canonical identifiers used to de-duplicate and reference items across datasets.

## Files Overview
- `pronouns.json` — Personal pronouns.
- `tenses.json` — Supported tenses with language-specific codes.
- `verbs.json` — Base verbs with infinitives and (optional) translations.
- `conjugations.json` — Conjugated forms that bind `pronoun × verb × tense → expected`.

All datasets should be UTF-8. For comparisons, the app normalizes on the server with Unicode NFKC + trim + lowercase.

---

## pronouns.json
Represents selectable pronouns for prompts.

Schema (per item):
- `id` (number) — Unique numeric ID (per language).
- `code` (string) — Stable key (e.g., `yo`, `du`, `er`, `sie_pl`). Must be unique per language.
- `display` (string) — Rendered label.

Example (ES):
```json
[
  { "id": 1, "code": "yo", "display": "yo" },
  { "id": 2, "code": "tú", "display": "tú" },
  { "id": 3, "code": "él", "display": "él" },
  { "id": 4, "code": "ella", "display": "ella" },
  { "id": 9, "code": "ellos", "display": "ellos" }
]
```

Example (DE):
```json
[
  { "id": 2, "code": "ich", "display": "ich" },
  { "id": 3, "code": "du", "display": "du" },
  { "id": 4, "code": "er", "display": "er" },
  { "id": 8, "code": "ihr", "display": "ihr" },
  { "id": 9, "code": "sie_pl", "display": "sie" }
]
```

---

## tenses.json
Supported tenses per language.

Schema (per item):
- `id` (number) — Unique ID.
- `code` (string) — Stable code. For German we use namespace-like codes (e.g., `de.pres.ind`, `de.perf.ind`). For Spanish you may use `es.pres.ind`, `es.perf.ind`, etc.
- `name` (string) — Display name localized to the target language (e.g., `Präsens`, `Perfekt`).

Example (DE):
```json
[
  { "id": 2, "code": "de.pres.ind", "name": "Präsens" },
  { "id": 3, "code": "de.perf.ind", "name": "Perfekt" }
]
```

Example (ES):
```json
[
  { "id": 2, "code": "es.pres.ind", "name": "presente" },
  { "id": 3, "code": "es.perf.ind", "name": "pretérito perfecto" }
]
```

---

## verbs.json
Canonical verbs.

Schema (per item):
- `id` (number) — Unique ID.
- `infinitive` (string) — Base form (e.g., `hablar`, `gehen`).
- `translation` (string|null, optional) — Human-friendly translation.

Example (ES):
```json
[
  { "id": 10, "infinitive": "hablar", "translation": "to speak" },
  { "id": 3, "infinitive": "ser", "translation": "to be" }
]
```

Example (DE):
```json
[
  { "id": 14, "infinitive": "gehen", "translation": "to go" },
  { "id": 3, "infinitive": "sein", "translation": "to be" }
]
```

Uniqueness: `infinitive` should be unique within language dataset. Use `id` as join key in `conjugations.json` where applicable.

---

## conjugations.json
Defines expected answers for a given `(pronoun, verb, tense)` triple.

Schema (per item):
- `pronoun` — An object reference or inline reference:
  - `{ id, code, display }`
- `verb` — `{ id, infinitive, translation? }`
- `tense` — `{ id, code, name }`
- `expected` (string) — Canonical answer.
- `normalized_expected` (string) — Pre-normalized answer (lowercase, diacritics-preserved text). The server still applies NFKC/trim/lowercase on both sides.

Example (DE):
```json
[
  {
    "pronoun": { "id": 4, "code": "er", "display": "er" },
    "verb": { "id": 14, "infinitive": "gehen", "translation": "to go" },
    "tense": { "id": 2, "code": "de.pres.ind", "name": "Präsens" },
    "expected": "geht",
    "normalized_expected": "geht"
  },
  {
    "pronoun": { "id": 3, "code": "du", "display": "du" },
    "verb": { "id": 7, "infinitive": "müssen", "translation": "must/to have to" },
    "tense": { "id": 2, "code": "de.pres.ind", "name": "Präsens" },
    "expected": "musst",
    "normalized_expected": "musst"
  }
]
```

Example (ES):
```json
[
  {
    "pronoun": { "id": 1, "code": "yo", "display": "yo" },
    "verb": { "id": 10, "infinitive": "hablar", "translation": "to speak" },
    "tense": { "id": 2, "code": "es.pres.ind", "name": "presente" },
    "expected": "hablo",
    "normalized_expected": "hablo"
  }
]
```

Notes
- Keep `(pronoun.code, verb.infinitive, tense.code)` unique within a language to avoid duplicates.
- `normalized_expected` should be lowercase and trimmed. The backend further applies `NFKC` + trim + lowercase before comparison.

---

## Validation & Normalization
- The server compares answers using Unicode NFKC normalization, `trim`, and `toLowerCase()` on both expected and submitted values.
- Clients may log diagnostic info comparing normalized strings to assist debugging.

---

## File Locations
You can place language-specific datasets under `database/seeds/{lang}/verbs/` or a similar folder used by your import pipeline. See the developer guide for seeding/import.
