// cues.mjs — the subtitle cues for srt.py: node cues.mjs > cues.json
import { SUBS } from './story.js';
console.log(JSON.stringify(SUBS.map(({ t0, t1, text }) => ({ t0, t1, text })), null, 1));
