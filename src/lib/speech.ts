import { audioKey } from './audioKey'

const AUDIO_BASE = import.meta.env.VITE_AUDIO_BASE ?? 'https://uttala.pages.dev'

let voice: SpeechSynthesisVoice | null | undefined
let bank: Set<string> | null = null
let audio: HTMLAudioElement | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  fetch(`${AUDIO_BASE}/sv/manifest.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((keys: string[]) => {
      bank = new Set(keys)
      listeners.forEach((cb) => cb())
    })
    .catch(() => {})
}

function swedishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  if (voice) return voice
  const voices = window.speechSynthesis.getVoices()
  voice = voices.find((v) => v.lang === 'sv-SE') ?? voices.find((v) => v.lang.startsWith('sv')) ?? null
  return voice
}

export function canSpeak(): boolean {
  return bank !== null || swedishVoice() !== null
}

/** Voices and the audio bank load asynchronously; call back once they are available. */
export function onVoicesReady(cb: () => void): () => void {
  listeners.add(cb)
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => listeners.delete(cb)
  const handler = () => { voice = undefined; cb() }
  window.speechSynthesis.addEventListener('voiceschanged', handler)
  return () => {
    listeners.delete(cb)
    window.speechSynthesis.removeEventListener('voiceschanged', handler)
  }
}

function synth(text: string): void {
  const v = swedishVoice()
  if (!v) return
  const u = new SpeechSynthesisUtterance(text)
  u.voice = v
  u.lang = v.lang
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

export function speak(text: string): void {
  audio?.pause()
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  const key = audioKey(text)
  if (bank?.has(key)) {
    const a = new Audio(`${AUDIO_BASE}/sv/${encodeURIComponent(key)}.mp3`)
    audio = a
    // pausing a clip that has not started yet rejects play(); only fall back if this clip is still current
    a.play().catch(() => { if (audio === a) synth(text) })
    return
  }
  synth(text)
}
