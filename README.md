# Verblistor

A Swedish verb conjugation trainer for SFI and SAS learners. 678 verbs with all forms, grouped by conjugation (1, 2a, 2b, 3, 4), with lessons, spaced repetition and sentence practice.

## What it does (UI in Swedish)

- **Öva** – practise with one-tap presets (SFI B/C/D, Top 100, irregular verbs, 2a vs 2b, s-verbs, particle and reflexive verbs) or pick groups, levels and forms yourself. Four modes:
  - *One form*: fast single-form recall (default).
  - *In a sentence*: the time word (igår, varje dag, har …) tells you which tense to use; particles and reflexive pronouns are placed correctly.
  - *All forms*: fill in the whole paradigm, with the infinitive, a random form or only English given.
  - *Which group?*: recognise the conjugation group.
- **Feedback that explains** – wrong answers are classified (wrong group, 2a/2b voicing, strong verb made regular, participle instead of supinum, missing å/ä/ö, double consonant …) with the rule to fix it.
- **Grupper** – an interactive decision route to find any verb's group, a side-by-side endings table, and group 4 organised by vowel pattern (i–e–i, i–a–u, y/u–ö–u …). Each group and pattern has a short lesson with a focused drill.
- **Verb** – searchable list (Swedish or English) with endings highlighted in the group colour, and a detail view with all forms, accepted variants, the reasoning for its group and example sentences.
- **Repetera** – spaced repetition (SM-2 style) per verb form, mistakes sorted by error type, and verbs that keep slipping.
- **Framsteg** – accuracy by group, form and level, common mistakes, activity, backup/restore.

Works offline (PWA), keyboard-first (Enter to check and continue, aa/ae/oe → å/ä/ö), mobile-friendly, light and dark themes, optional pronunciation via the browser's Swedish voice. Progress stays in the browser.

## Development

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests + validation of every verb in the dataset
npm run build      # static site in dist/ (relative paths, deployable anywhere)
```

The verb data is generated from SALDO and the Kelly-list; see [data/README.md](data/README.md).

## Licence

Verb data: CC BY-SA (derived from Språkbanken's Kelly-list and SALDO). See the About page for attributions.
