# Verblistor

Swedish verb lists and conjugation practice for SFI and SAS learners. 678 verbs with all forms, grouped by conjugation (1, 2a, 2b, 3, 4).

## What it does

The interface is in Swedish.

- **Verb** (start page) – the list is also the exercise. Every column has an eye: shown, to write, or hidden, like covering a column of the book with paper. *Läs* shows everything, *Öva* gives the infinitive and asks for the rest, *Slumpa* gives each row one random cue (sometimes only the English). Enter checks what has been written; *Facit* fills in the rest. Filter by group, frequency and type (strong verbs by vowel pattern, umlaut verbs, irregular verbs, helper verbs, s-verbs, particle and reflexive verbs); sort by frequency, group (the book's order) or A–Ö. Print the list, optionally with a notes column.
- **Following Olle Kjellin's *Svenska verblistor*** – the stem is the imperative, endings are marked from the stem, strong verbs are not irregular but follow eight vowel patterns (i – a – u, som finner – fann – funnit …), umlaut verbs (välja – valde) are group 2. Forms that exist but are hardly used (har bort) are shown faded in brackets and never asked.
- **Shareable selections** – the selection lives in the URL (`#/?grupp=4&typ=starka:i–e–i`), so a teacher can send a pattern as a link.
- **Feedback that explains** – wrong answers are classified (wrong group, 2a/2b, strong verb made regular, umlaut, participle instead of supinum, missing å/ä/ö, double consonant …).
- **Grupper** – the groups side by side; each row opens in place with the rule and its pitfalls worked out as stem + ending → form (glömm + de → glömde). Group 4 by vowel pattern, then irregular and helper verbs.
- **Mina fel** – every form answered wrong, until it is answered right.

Pronunciation uses recorded audio from the voice bank at uttala.pages.dev when available, otherwise the browser's Swedish voice. Works offline (PWA), keyboard-first (Enter, aa/ae/oe → å/ä/ö). Progress stays in the browser.

## Development

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests + validation of every verb in the dataset
npm run build      # static site in dist/ (relative paths, deployable anywhere)
```

Pushing to `main` publishes to GitHub Pages. Cloudflare Pages: `npx wrangler pages deploy dist --project-name verblistor`.

The verb data is generated from SALDO and the Kelly-list; see [data/README.md](data/README.md).

## Licence

Verb data: CC BY-SA (derived from Språkbanken's Kelly-list and SALDO). See the About page for attributions.
