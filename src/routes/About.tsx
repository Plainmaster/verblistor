import { VERBS } from '../lib/groups'

export default function About() {
  return (
    <article className="max-w-[62ch] grid gap-4 text-[1.05rem]">
      <h1 className="m-0 text-3xl font-extrabold tracking-tight">About Verblistor</h1>
      <p className="m-0">
        Verblistor helps you learn how Swedish verbs are conjugated. It has {VERBS.length} verbs, from the first verbs in
        SFI to advanced written Swedish, including s-verbs, reflexive verbs and particle verbs.
      </p>
      <h2 className="m-0 mt-4 text-xl font-extrabold">How it teaches</h2>
      <ul className="m-0 pl-5 grid gap-2">
        <li><strong>Rules first.</strong> Each group has a short lesson with its endings, the exceptions that trip people up, and a drill on just that group.</li>
        <li><strong>Mixed practice after.</strong> On the Öva page the groups are mixed, which is harder but makes the knowledge stick.</li>
        <li><strong>Spaced repetition.</strong> Each form you answer is scheduled again: soon if you got it wrong, later and later as you keep getting it right.</li>
        <li><strong>Feedback that explains.</strong> A wrong answer is matched against common error types (wrong group, -de instead of -te, a regular ending on a strong verb…) so you know which rule to revisit.</li>
        <li><strong>Verbs in context.</strong> In sentence mode the time word (igår, varje dag, har…) tells you which tense to use, and particles and reflexive pronouns land in the right place.</li>
      </ul>
      <h2 className="m-0 mt-4 text-xl font-extrabold">Levels</h2>
      <p className="m-0">
        Levels follow the Common European Framework (A1–C1). The SFI and SAS course names next to them are an approximate guide:
        SFI course B is about A1, C about A2, D about B1, and Svenska som andraspråk B2 and above.
      </p>
      <h2 className="m-0 mt-4 text-xl font-extrabold">Sources</h2>
      <ul className="m-0 pl-5 grid gap-2">
        <li>Inflected forms: <a href="https://spraakbanken.gu.se/en/resources/saldom" className="underline">SALDO morphology</a>, Språkbanken Text, University of Gothenburg (CC BY 4.0).</li>
        <li>Word frequency: <a href="https://spraakbanken.gu.se/en/resources/kelly" className="underline">the Swedish Kelly-list</a>, Språkbanken Text (CC BY-SA 3.0).</li>
        <li>Verb selection, English glosses, levels, sentence contexts and corrections: this project. The verb data is shared under CC BY-SA.</li>
      </ul>
      <p className="m-0 mt-4 text-muted">Inspired by the long-running verb trainer at taipoint.org.</p>
    </article>
  )
}
