// story.js — the one timeline for "Lajawaab". Picture, music, foley and subtitles all read these numbers.
// (helpers inlined so this file also runs under plain node for cues.mjs)
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const DUR = 62;

// Named times (treatment §5)
export const T = {
  brushDraw: [0, 1.2], brushLift: [1.5, 2.6],
  f1Paint: [2.1, 3.4],
  title: [5, 11], bloom2: [5.2, 7.2], f2Paint: [6.1, 7.4],
  cross: [12, 17], tie: [17.4, 18.6],
  track: [20, 30], breath: [26, 29],
  rain: [28, 37.6], mass: [30, 37], drift: [30, 37],
  lift: [37, 39], silence: [37, 41], snap: 40,
  ecu: [41, 43], apart: [43, 52], leave: [43, 49], swallow: [47, 49],
  hearts: [44, 50], home: [45, 52],
  ret: [49, 52], evap: [52, 57],
  curl: [57, 58.2], stamp: 58.2,
  card: [58, 62],
};

// Figure world paths (soles y = GROUND). x = world x at time t.
export const GROUND = 830;
export const f1X = t => {
  if (t < 12) return 820;
  if (t < 17) return lerp(820, 925, ss((t - 12) / 5));
  if (t < 20) return 925;
  if (t < 30) return lerp(925, 1625, (t - 20) / 10);
  if (t < 37) return lerp(1625, 1310, ss((t - 30) / 7));
  if (t < 45) return 1310;
  if (t < 52) return lerp(1310, 834, eio((t - 45) / 7));
  return 834;
};
export const f2X = t => {
  if (t < 12) return 1250;
  if (t < 17) return lerp(1250, 1125, ss((t - 12) / 5));
  if (t < 20) return 1125;
  if (t < 30) return lerp(1125, 1825, (t - 20) / 10);
  if (t < 37) return lerp(1825, 2140, ss((t - 30) / 7));
  if (t < 43) return 2140;
  if (t < 49) return lerp(2140, 2670, (t - 43) / 6);
  return 2670;
};

// Camera: world point at screen centre + zoom. Keyframes with eased segments (treatment §4).
const CAM = [
  { t: 0, x: 1035, y: 545, z: 1.18 },
  { t: 20, x: 1035, y: 545, z: 1.28 },
  { t: 30, x: 1735, y: 560, z: 1.02 },      // lateral track, far parallax slow
  { t: 37, x: 1720, y: 615, z: 1.1 },       // low angle under the mass, slow push
  { t: 41, x: 1770, y: 660, z: 3.2 },       // ECU on the drifting thread end
  { t: 43, x: 1770, y: 660, z: 3.2 },
  { t: 43.01, x: 1900, y: 560, z: .62 },    // hard cut: high wide
  { t: 49, x: 2050, y: 560, z: .62 },
  { t: 52, x: 1035, y: 545, z: 1.18 },      // return to the opening framing
  { t: 62, x: 1035, y: 545, z: 1.18 },
];
export function camAt(t) {
  let i = 0; while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
  const a = CAM[i], b = CAM[i + 1], u = clamp((t - a.t) / (b.t - a.t));
  const e = (a.t >= 49 && a.t < 52) ? eio(u) : u;      // the return pans with ease
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) };
}

// Inscription subtitles (screen space): [id, text, t0, t1, x, y, size]
export const SUBS = [
  { id: 'ins1', text: 'two banks, one river', t0: 43, t1: 47, x: 165, y: 265, size: 46 },
  { id: 'ins2', text: 'the space where you stood', t0: 53, t1: 57, x: 1180, y: 320, size: 46 },
];

// Every text visible on screen, for readcheck (pass: true = fine print)
export const TEXTS = [
  { id: 'title', text: 'LAJAWAAB', t0: 5, t1: 11, x0: 130, y0: 110, x1: 262, y1: 800 },
  { id: 'ins1', text: 'two banks, one river', t0: 43, t1: 47, x0: 160, y0: 218, x1: 640, y1: 282 },
  { id: 'ins2', text: 'the space where you stood', t0: 53, t1: 57, x0: 1175, y0: 273, x1: 1730, y1: 337 },
  { id: 'cardT', text: 'LAJAWAAB', t0: 58.2, t1: 62, x0: 755, y0: 418, x1: 1170, y1: 508 },
  { id: 'cardS1', text: 'an ink-wash visualizer', t0: 58.4, t1: 62, x0: 812, y0: 522, x1: 1115, y1: 578 },
  { id: 'cardS2', text: 'for Aditya Rikhari', t0: 58.6, t1: 62, x0: 852, y0: 582, x1: 1075, y1: 638 },
  { id: 'cardC', text: 'performed, composed and written by Aditya Rikhari · produced by Aditya Rikhari and Akhilesh Khandelwal · a CollabX Productions / Homegrown Music / Atlantic Records release', t0: 58.8, t1: 62, x0: 620, y0: 700, x1: 1310, y1: 900, pass: true },
];

// ---- Sound & music events (window.EV). 'note'/'xiao' are music; the rest are foley/beds. ----
const steps = (t0, t1, dt, pan, gain) => {
  const out = []; let k = 0;
  for (let t = t0; t <= t1; t += dt) out.push({ t: +t.toFixed(2), type: 'step', pan: (k++ % 2 ? 1 : -1) * pan, gain });
  return out;
};
export const EV = [
  // beds
  { t: 0, type: 'bed', name: 'room', t1: 62 },
  { t: 18, type: 'bed', name: 'wind', t1: 37.6 },
  { t: 28, type: 'bed', name: 'rain', t1: 37.6 },
  { t: 41, type: 'bed', name: 'mist', t1: 54 },
  // foley
  { t: 0.05, type: 'brush', gain: .9 },
  { t: 0.15, type: 'inkdrop' },
  ...steps(12.3, 16.8, 0.9, .18, .8),
  ...steps(20.6, 29.4, 0.95, .15, .55),
  ...steps(30.5, 36.5, 1.2, .2, .4),
  ...steps(45.3, 51.3, 1.0, .12, .35),
  { t: 24.1, type: 'wings' },
  { t: 39, type: 'drip' },
  { t: 40, type: 'snap' },
  { t: 44, type: 'heart' }, { t: 50, type: 'heart' },
  { t: 52.7, type: 'tick' }, { t: 53.6, type: 'tick' }, { t: 54.5, type: 'tick' }, { t: 55.4, type: 'tick' }, { t: 56.3, type: 'tick' },
  { t: 58.2, type: 'seal' },
  // music — guqin in A-yu pentatonic (A C D F G), cue-map (treatment §6)
  { t: 0.25, type: 'strum', pitches: ['A2', 'C3', 'D3', 'F3', 'G3'], dur: 2.2, vel: .5, spread: .07, up: true },
  { t: 5.15, type: 'note', pitch: 'A3', dur: 2.5, vel: .55 },
  { t: 7.25, type: 'note', pitch: 'D3', dur: 3, vel: .5, pan: -.25 },
  { t: 12.1, type: 'note', pitch: 'F3', dur: 2, vel: .45, bend: [[.5, 0], [1.1, 1.2]] },
  { t: 14.6, type: 'note', pitch: 'G3', dur: 2, vel: .4, pan: .2 },
  { t: 17.9, type: 'note', pitch: 'A4', dur: 3.5, vel: .45, har: true },
  { t: 20.5, type: 'note', pitch: 'D3', dur: 1.8, vel: .5 },
  { t: 21.5, type: 'note', pitch: 'F3', dur: 1.6, vel: .48 },
  { t: 22.5, type: 'note', pitch: 'G3', dur: 1.6, vel: .5 },
  { t: 23.5, type: 'note', pitch: 'A3', dur: 1.8, vel: .52 },
  { t: 24.5, type: 'note', pitch: 'C4', dur: 1.6, vel: .5 },
  { t: 25.3, type: 'note', pitch: 'D4', dur: 1.4, vel: .48 },
  { t: 26.4, type: 'note', pitch: 'A4', dur: 3.6, vel: .4, har: true },
  { t: 30.6, type: 'note', pitch: 'A2', dur: 2.5, vel: .8 },
  { t: 32.2, type: 'note', pitch: 'D3', dur: 2, vel: .55 },
  { t: 34.2, type: 'note', pitch: 'C3', dur: 2.2, vel: .4 },
  { t: 41.7, type: 'note', pitch: 'A3', dur: 2.5, vel: .3, pan: .3 },
  { t: 42.6, type: 'xiao', pitch: 'A3', dur: 3.2, vel: .5 },
  { t: 44.3, type: 'note', pitch: 'F3', dur: 2.2, vel: .28 },
  { t: 46.9, type: 'note', pitch: 'D3', dur: 2.5, vel: .26 },
  { t: 47.3, type: 'xiao', pitch: 'F3', dur: 3, vel: .45 },
  { t: 52.5, type: 'note', pitch: 'A3', dur: 1.2, vel: .22 },
  { t: 53.4, type: 'note', pitch: 'G3', dur: 1.2, vel: .2 },
  { t: 54.3, type: 'note', pitch: 'F3', dur: 1.2, vel: .19 },
  { t: 55.2, type: 'note', pitch: 'D3', dur: 1.2, vel: .18 },
  { t: 56.1, type: 'note', pitch: 'C3', dur: 1.2, vel: .17 },
  { t: 58.25, type: 'gong' },
  { t: 58.7, type: 'note', pitch: 'A4', dur: 4, vel: .32, har: true },
];

export const events = () => EV;
