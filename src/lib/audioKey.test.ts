import { describe, expect, it } from 'vitest'
import { audioKey } from './audioKey'

// Expected values produced by key() in elevenlabs-tts/voicebank/common.py
const CASES: Record<string, string> = {
  springa: 'springa',
  'Ge upp': 'ge_upp',
  'springa, springer, sprang, sprungit': 'springa__springer__sprang__sprungit',
  '  Gå! ': 'gå',
  'förvänta dig': 'förvänta_dig',
  'Är du där?': 'är_du_där',
  'e-posta': 'e-posta',
  'bjöd in, ,x': 'bjöd_in____x',
}

describe('audioKey', () => {
  for (const [text, key] of Object.entries(CASES)) {
    it(`${JSON.stringify(text)} -> ${key}`, () => expect(audioKey(text)).toBe(key))
  }
})
