let voice: SpeechSynthesisVoice | null | undefined

function swedishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  if (voice) return voice
  const voices = window.speechSynthesis.getVoices()
  voice = voices.find((v) => v.lang === 'sv-SE') ?? voices.find((v) => v.lang.startsWith('sv')) ?? null
  return voice
}

export function canSpeak(): boolean {
  return swedishVoice() !== null
}

/** Voices load asynchronously in some browsers; call back once they are available. */
export function onVoicesReady(cb: () => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {}
  const handler = () => { voice = undefined; cb() }
  window.speechSynthesis.addEventListener('voiceschanged', handler)
  return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
}

export function speak(text: string): void {
  const v = swedishVoice()
  if (!v) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = v
  u.lang = v.lang
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}
