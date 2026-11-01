# Plan: exempelmeningar till alla verb

Mål: alla 726 verb har exempelmeningar, inlästa med Ales klonade röst.

Läget 2026-11-01: 251 verb klara (omgång 1–6), 475 kvar. Omgång 1–5 är granskade. Omgång 6 ligger på granskningssidan.

## Omgångar

Varje omgång har ungefär 50 verb. Lärarnas egna verb tas först, eftersom de är valda för SFI. Resten tas i frekvensordning (Kelly-listan).

| Omgång | Verb | Antal |
|---|---|---|
| 5 | Lärarnas verb: bre, checka in, dammsuga … åldras (klar) | 63 |
| 6 | diskutera – konstatera (klar) | 50 |
| 7 | styra – resa | 50 |
| 8 | förbättra – uppfatta | 50 |
| 9 | stänga – träna | 50 |
| 10 | vidta – njuta | 50 |
| 11 | posta – jaga | 50 |
| 12 | stöta – bevilja | 50 |
| 13 | formulera – skaka | 50 |
| 14 | vittna – inspirera | 50 |
| 15 | döpa – stava | 50 |
| 16 | operera – pipa | 25 |

Från omgång 10 är många verb på nivå B2 och C1. Där blir meningarna lite längre, men de ska fortfarande handla om vardag, jobb och samhälle.

## Regler för meningarna

- Meningen ska gå att förstå utan något före. Inget löst "det" eller "något": skriv ut vad det gäller, eller lägg en kort mening före.
- Situationerna ska finnas i Sverige i dag. Inga snören i bussen, inga insekter att äta.
- En form som låter konstig ensam hoppas över, oftast imperativ (anse, öka, gälla). För deponens som hoppas och lyckas finns ingen imperativ.
- Avsked och önskningar ("Ha det så roligt!") läses in efter "Hej då!" och klipps ut, annars blir tonfallet fel.
- Klamrarna markerar exakt verbformen, partikeln också: `Han {gav} aldrig {upp}.` Reflexivt pronomen markeras inte.

## Så görs en omgång

1. Skriv meningarna i en JSON-fil: `{ "<infinitiv>": { "<form>": "Mening med {verb}." } }`.
2. `npx tsx scripts/add-examples.ts <fil> <mapp>` kontrollerar markeringarna, lägger in i `src/data/examples.json` och gör filer för granskningssidan (`writes-1.json` osv.).
3. Lägg in på granskningssidan med ArtifactData batch (högst 50 åt gången).
4. `npm test && npm run build`
5. `scripts/voice-examples.sh` läser in och kontrollerar ljudet. Den listar meningar där Whisper hörde något annat, med Pianissimos svar bredvid. Står det DIFF hos Pianissimo också: lyssna, och gör om eller skriv om meningen.
6. `scripts/voice-examples.sh publish`, sedan commit och push av verblistor, och `npx wrangler pages deploy dist --project-name verblistor --branch main --commit-dirty=true`.

En omgång tar ungefär en halvtimme, varav ljudkontrollen är tio minuter.

## Granskning

Ale granskar på [granskningssidan](https://claude.ai/artifact/LsZKPaW4JN9q1WNuHioMpF) eller i chatten. Ändrade meningar förs över till `examples.json`, och ljudet görs om för just dem. Strukna meningar tas bort ur `examples.json`.
