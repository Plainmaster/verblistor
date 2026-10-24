/** Text -> file key in the audio bank. Must match key() in elevenlabs-tts/voicebank/common.py. */
export function audioKey(text: string): string {
  const t = text.normalize('NFC').toLowerCase().trim()
  return t
    .split(',')
    .map((p) => p.replace(/[^\p{L}\p{N}_\s-]/gu, '').trim().replace(/\s+/g, '_'))
    .join('__')
}
