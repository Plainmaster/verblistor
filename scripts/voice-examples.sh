#!/usr/bin/env bash
# Reads every example sentence that has no audio yet in the cloned voice and checks it.
# Then lists sentences where KB-Whisper heard other words, with Pianissimo's second opinion,
# so a wrong verb form that still scored >= 0.85 does not slip through.
#
#   scripts/voice-examples.sh            # generate + check + list
#   scripts/voice-examples.sh publish    # publish uttala and push the voice bank
set -euo pipefail
TTS="${TTS:-$(cd "$(dirname "$0")/../.." && pwd)/elevenlabs-tts}"
cd "$TTS"
[[ -f .venv/bin/activate ]] && source .venv/bin/activate

if [[ "${1:-}" == publish ]]; then
  python -m voicebank.publish | tail -1
  git add -A
  git commit -qm "Verblistor: example sentences" || true
  git push -q
  exit
fi

git pull -q
python adapters/verblistor.py | tail -1
python -m voicebank.generate --request requests/verblistor.json | tail -1
before=$(mktemp)
cp bank/manifest.json "$before"
python -m voicebank.check --project verblistor 2>/dev/null | tail -1

python - "$before" <<'EOF' 2>/dev/null
import json, re, sys
from voicebank.check import load_audio, SR, AUDIO
old = json.load(open(sys.argv[1]))
new = json.load(open("bank/manifest.json"))
words = lambda t: re.sub(r"[^\wåäö ]", "", t.lower().replace("i dag", "idag").replace("i går", "igår")
                         .replace("i kväll", "ikväll").replace("i morgon", "imorgon")).split()
checked = [k for k, m in new.items() if m.get("kind") == "t" and old.get(k, {}).get("status") == "new"]
odd = [k for k in checked if words(new[k].get("heard", "")) != words(new[k]["text"]) or new[k]["status"] != "ok"]
print(f"{len(checked)} checked, {len(odd)} heard differently")
if odd:
    import onnx_asr
    asr = onnx_asr.load_model("KlangAI/pianissimo-sv-onnx", quantization="int8")
    for k in odd:
        m = new[k]
        p = asr.recognize(load_audio(AUDIO / f"{k}.mp3"), sample_rate=SR)
        same = "SAME" if words(p) == words(m["text"]) else "DIFF"
        print(f"{m['status']} {same} | {m['text']} | W: {m.get('heard')} | P: {p}")
EOF
rm "$before"
