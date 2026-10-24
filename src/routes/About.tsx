import { VERBS } from '../lib/groups'

export default function About() {
  return (
    <article className="max-w-[62ch] grid gap-4 text-[1.05rem]">
      <h1 className="m-0 text-4xl font-extrabold">Om Verblistor</h1>
      <p className="m-0">
        Verblistor är en lista över {VERBS.length} svenska verb med alla former, och ett ställe att öva på dem. Här finns de vanligaste
        verben i vardagen, starka och oregelbundna verb, s-verb, reflexiva verb och partikelverb.
      </p>
      <h2 className="m-0 mt-4 text-2xl font-extrabold">Så fungerar det</h2>
      <ul className="m-0 pl-5 grid gap-2">
        <li><strong>Listan.</strong> Välj grupp, hur vanliga verben ska vara och vilken typ. Sortera efter frekvens, grupp eller alfabetet.</li>
        <li><strong>Egna listor.</strong> Kryssa i verb och gör en lista. Adressen innehåller urvalet, så en lärare kan dela veckans verb med en länk.</li>
        <li><strong>Öva.</strong> I tabellen fyller du i en hel sida med verb, som i den klassiska Svenska Verb. Du kan också öva en form i taget eller i meningar.</li>
        <li><strong>Förklaringar.</strong> Ett fel svar jämförs med vanliga feltyper (fel grupp, -de i stället för -te, regelbunden ändelse på ett starkt verb) så att du vet vilken regel du ska titta på.</li>
        <li><strong>Mina fel.</strong> Allt du svarat fel på samlas, tills du svarar rätt.</li>
        <li><strong>Utskrift.</strong> Skriv ut listan eller ett övningsblad med tomma rutor.</li>
      </ul>
      <h2 className="m-0 mt-4 text-2xl font-extrabold">Varför inga nivåer?</h2>
      <p className="m-0">
        CEFR-nivåerna (A1–C1) beskriver vad man kan göra med språket, inte enskilda ord. Därför delar Verblistor in verben efter
        hur vanliga de är: de 100 vanligaste, de 300 vanligaste eller alla. Frekvensen kommer från Kelly-listan.
      </p>
      <h2 className="m-0 mt-4 text-2xl font-extrabold">Källor</h2>
      <ul className="m-0 pl-5 grid gap-2">
        <li>Böjningsformer: <a href="https://spraakbanken.gu.se/en/resources/saldom" className="underline">SALDO-morfologin</a>, Språkbanken Text, Göteborgs universitet (CC BY 4.0).</li>
        <li>Frekvens: <a href="https://spraakbanken.gu.se/en/resources/kelly" className="underline">Kelly-listan</a>, Språkbanken Text (CC BY-SA 3.0).</li>
        <li>Urval, engelska översättningar, meningar och rättelser: det här projektet. Verbdatan delas under CC BY-SA.</li>
      </ul>
      <p className="m-0 mt-4 text-muted">Inspirerad av den klassiska verbtränaren Svenska Verb på taipoint.org.</p>
    </article>
  )
}
