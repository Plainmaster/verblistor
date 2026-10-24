# Verblistor

Swedish verb lists and conjugation practice for SFI and SAS learners. 678 verbs with all forms, grouped by conjugation (1, 2a, 2b, 3, 4).

## What it does

The interface is in Swedish.

- **Verb** (start page) – the full list with all forms, endings marked in the group colour. Filter by group, frequency (100 / 300 / all) and type (strong verbs by vowel pattern, s-verbs, particle and reflexive verbs); sort by frequency, group or A–Ö. Tick verbs to make a custom list. Print the list or a blank worksheet.
- **Shareable selections** – the selection lives in the URL (`#/?grupp=4&typ=starka:i–e–i`, `#/ova?ord=skriva,läsa`), so a teacher can send this week's verbs as a link.
- **Öva** – *Tabell*: a page of ten verbs with one form given, fill in the rest (as in the classic Svenska Verb at taipoint.org). *En i taget*: one form at a time with spaced repetition. *I meningar*: the time word tells you the tense.
- **Feedback that explains** – wrong answers are classified (wrong group, 2a/2b, strong verb made regular, participle instead of supinum, missing å/ä/ö, double consonant …).
- **Grupper** – find any verb's group step by step, the endings side by side, group 4 by vowel pattern, a short lesson per group and pattern.
- **Mina fel** – every form answered wrong, until it is answered right; backup/restore and theme.

Pronunciation uses recorded audio from the voice bank at uttala.pages.dev when available, otherwise the browser's Swedish voice. Works offline (PWA), keyboard-first (Enter, aa/ae/oe → å/ä/ö). Progress stays in the browser.

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
