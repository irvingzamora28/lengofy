# Conjugations Import Command

This document describes how to import pronouns, tenses, verbs, and conjugations using the Artisan command.

## Usage

```bash
php artisan conjugations:import {language}
```

- `language`: the language code, e.g., `de`, `es`, `en` (must exist in `languages` table)
- Directory is inferred as: `database/seeds/verbs/{language}/conjugations/` and must contain:
  - `pronouns.json`
  - `tenses.json`
  - `verbs.json`
  - `conjugations.json`

Example:

```bash
php artisan conjugations:import de
php artisan conjugations:import es
php artisan conjugations:import en
```

The importer will:
- Require each JSON entry to include `language` (or `language_code`) matching the CLI `language` argument.
- Upsert `pronouns`, `tenses`, `verbs` for the given language.
- Insert/update `conjugations` based on `(verb_id, tense_id, pronoun_id)`.
- Accept `normalized_form` as optional (nullable); if omitted, it will be computed from `form` by the model mutator.
- Run inside a transaction and abort on validation errors.

## JSON Schemas (informal)

These documents must contain a top-level array of entries.

### pronouns.json
```json
[
  {
    "language": "de",
    "code": "ich",
    "display": "ich",
    "person": 1,
    "number": "sg",
    "is_polite": false,
    "order_index": 0
  }
]
```

- Required: `language`, `code`
- Optional: `display`, `person` (default 3), `number` (default `sg`), `is_polite` (default false), `order_index` (default 0)

### tenses.json
```json
[
  {
    "language": "de",
    "code": "de.pres.ind",
    "name": "Präsens",
    "is_compound": false,
    "order_index": 0
  }
]
```

- Required: `language`, `code`
- Optional: `name` (defaults to code), `is_compound` (bool), `order_index` (number)

### verbs.json
```json
[
  {
    "language": "de",
    "infinitive": "sprechen",
    "is_irregular": true,
    "frequency_rank": 500,
    "translation": "to speak",
    "metadata": {
      "notes": "example metadata"
    }
  }
]
```

- Required: `language`, `infinitive`
- Optional: `is_irregular`, `frequency_rank`, `translation`, `metadata`

### conjugations.json
```json
[
  {
    "language": "de",
    "infinitive": "sprechen",
    "tense_code": "de.pres.ind",
    "pronoun_code": "ich",
    "form": "spreche",
    "normalized_form": "spreche",
    "notes": null
  }
]
```

- Required: `language`, `infinitive`, `tense_code`, `pronoun_code`, `form`
- Optional: `normalized_form` (nullable), `notes`

## Exit Codes
- 0 (SUCCESS): Import completed.
- 1 (FAILURE): Import failed; see console error.

## Tips
- Make sure the language row exists in `languages` with the correct `code`.
- You can run the command multiple times; upserts will avoid duplicates.
- Keep tense codes consistent with your app (e.g., `de.pres.ind`, `es.pret.ind`, `en.past.simp`).
