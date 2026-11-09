// figure.js — minimal xieyi (写意) figures: one pale robe mass + two loaded contours, limbs as burnt-ink strokes.
// A tiny pose rig: body is fixed proportions in pose units (soles at y=0, head near y=-78, soles x≈0);
// feet and handF/handB return world anchors for steps and the thread tie. Figures render on twos (caller quantises t).
import { mk, draw, mass, blot, TONE } from './ink.js';
import { clamp, lerp } from '/core/lib.js';

export const VERM = [176, 46, 34];

// pose = { tilt, head, lean, stride, arms, aF, aB, hemF, hemB, v } — all in pose units
export const POSE = {
  stand:  { tilt: 0,   head: 0,   lean: 0, stride: 0,   arms: .28, aF: [[2, -73], [7, -61], [11, -51]], aB: [[-2, -73], [-7, -61], [-11, -51]], hemF: [10, -6], hemB: [-10, -6], v: 'side' },
  walkA:  { tilt: .04, head: .12, lean: .3, stride: 1.7, arms: .32, aF: [[3, -72], [10, -58], [14, -44]], aB: [[-3, -73], [-9, -62], [-13, -53]], hemF: [14, -4], hemB: [-12, -7], v: 'side' },
  walkB:  { tilt: -.03, head: .1, lean: .26, stride: -1.2, arms: .3, aF: [[2, -73], [8, -62], [12, -52]], aB: [[-4, -71], [-11, -56], [-15, -42]], hemF: [11, -6], hemB: [-15, -5], v: 'side' },
  slump:  { tilt: .12, head: .55, lean: .2, stride: .2,  arms: .2,  aF: [[3, -70], [9, -57], [12, -47]], aB: [[-2, -71], [-6, -58], [-8, -48]], hemF: [9, -5], hemB: [-9, -6], v: 'side' },
  turnAway: { tilt: -.06, head: -.4, lean: -.12, stride: .8, arms: .3, aF: [[2, -73], [6, -60], [9, -50]], aB: [[-3, -72], [-8, -60], [-11, -49]], hemF: [10, -5], hemB: [-11, -6], v: 'back' },
};

export function mixPose(a, b, k) {
  const o = {};
  for (const key of Object.keys(a)) {
    const va = a[key], vb = b[key];
    if (typeof va === 'number') o[key] = lerp(va, vb, k);
    else if (Array.isArray(va)) o[key] = va.map((v, i) => Array.isArray(v) ? v.map((u, j) => lerp(u, (vb[i] || [])[j] ?? u, k)) : lerp(v, vb[i] ?? v, k));
    else o[key] = k < .5 ? va : vb;
  }
  return o;
}

// draw one figure into layer L = {wet, dry, col}; X = {x (soles centre), y (soles y), s (scale px/unit), dir, am, seed, p (0..1 paint-in), boil, dark (0 pale .. 1 deep), hair (0/1)}
export function figure(L, P, X) {
  const { x: x0, y: y0, s: sc, dir = 1, am = 1, seed = 1, p = 1, boil = 0, dark = .6, hair = 0 } = X;
  if (am <= 0 || p <= 0) return { handF: [x0, y0 - 50 * sc / 2.6], handB: [x0, y0 - 50 * sc / 2.6], feet: [] };
  const j = (i) => Math.sin((i + 1) * 12.9898 + seed * 78.233 + boil * 1.7) * .5;   // deterministic boil
  const T = pt => [x0 + (pt[0] + j(pt[0]) * .5) * sc * dir, y0 + (pt[1] + j(pt[1]) * .5) * sc];

  // pose → body points (pose units)
  const lean = P.lean + P.tilt * .3;
  const C = [lean * 6, lerp(-74, -70, Math.abs(P.lean))];                 // chest/shoulder centre
  const Hd = [C[0] + P.head * 7 + P.tilt * 10, C[1] - 9];                 // head centre
  const stride = P.stride;
  const hemF = [P.hemF[0] + stride * 2.2, P.hemF[1] - Math.abs(stride) * .8];
  const hemB = [P.hemB[0] + stride * 2.2, P.hemB[1] - Math.abs(Math.min(0, stride)) * .8];
  const flare = Math.abs(P.stride) * .35 + .25;
  const hemMid = [(hemF[0] + hemB[0]) / 2, Math.max(hemF[1], hemB[1]) + 3.2];

  const list = [];
  let idx = seed * 37;
  const S = (pts, o) => list.push({ s: pts.map(T), o, seed: idx++ });
  const M = (poly, a, g, jit) => {
    // g is in pose-local units; mass() wants world units
    const gw = g ? [x0 + g[0] * sc * dir, y0 + g[1] * sc, x0 + g[2] * sc * dir, y0 + g[3] * sc, g[4], g[5]] : null;
    list.push({ m: poly.map(T), a, seed: idx++, g: gw, jit: jit ?? .7 * sc });
  };

  // robe silhouette: pale mass first (side), darker toward the hem
  M([[sLx()], [sRx()], [C[0] + 9 + flare * 2, lerp(C[1], hemF[1], .62)], [hemF[0] * (1 + flare * .12), hemF[1]], [hemMid[0] + 4, hemMid[1]], [hemB[0] * (1 + flare * .12), hemB[1]], [C[0] - 11 - flare * 1.6, lerp(C[1], hemB[1], .62)]].map(q => q.length === 1 ? q[0] : q),
    TONE.dan * 1.05, [0, C[1], 0, hemMid[1], 0, .3]);
  function sLx() { return [C[0] - 8.5, C[1] - 1]; }
  function sRx() { return [C[0] + 8.5, C[1] - 1]; }
  const sL = sLx(), sR = sRx();

  // two loaded contours along the outer edge of the mass
  S([[sR[0] + .8, sR[1] + 2], [C[0] + 9 + flare * 2, lerp(C[1], hemF[1], .55)], [hemF[0] * (1 + flare * .1) + 3.2, hemF[1]]],
    { w: 6.2, tone: TONE.nong * lerp(.8, 1, dark), dry: .12, prof: 'robe', darkDir: [1, .25] });
  S([[sL[0] - .8, sL[1] + 2], [C[0] - 11 - flare * 1.5, lerp(C[1], hemB[1], .55)], [hemB[0] * (1 + flare * .12) - 2.8, hemB[1]]],
    { w: 5.2, tone: TONE.zhong * lerp(.9, 1.15, dark), dry: .2, prof: 'robe', darkDir: [-1, .2] });

  // arms + hands (blots), drawn over the mass
  const arm = (a, tone) => {
    if (!a) return;
    S([a[0], a[1], a[2]], { w: 3.2, tone, dry: .12, prof: 'brush' });
    list.push({ blot: T(a[2]), r: 1.9, tone: TONE.jiao });
  };
  arm(P.aF, TONE.nong * lerp(.75, .95, dark));
  arm(P.aB, TONE.zhong * lerp(.85, 1.05, dark));

  // head + neck close to the shoulders + hair
  const hr = 4.6;
  S([[C[0] + P.head * 3, C[1] - 2], [Hd[0] - P.head * 1.5, Hd[1] + 5.2]], { w: 3.4, tone: TONE.nong * .92, prof: 'tip' });
  M([[Hd[0] - hr * .9, Hd[1] - hr * .5], [Hd[0] - hr * .4, Hd[1] - hr * 1.05], [Hd[0] + hr * .55, Hd[1] - hr], [Hd[0] + hr, Hd[1] - hr * .1], [Hd[0] + hr * .7, Hd[1] + hr * .7], [Hd[0] - hr * .55, Hd[1] + hr * .85]], TONE.nong * .95, null, .22);
  if (hair) {
    S([[Hd[0] + hr * .2, Hd[1] - hr * .7], [Hd[0] + hr * 1.3, Hd[1] + hr * 1.7], [Hd[0] + hr * .7, Hd[1] + hr * 3.8]], { w: 2.6, tone: TONE.nong, prof: 'tip' });
    blot(L.dry, Hd[0] + hr * .1, Hd[1] - hr * 1.15, 1.8, .8, 0, 1, idx++);
  } else {
    S([[Hd[0] - hr * .2, Hd[1] - hr * 1.1], [Hd[0] + hr * .35, Hd[1] - hr * 1.85]], { w: 2.2, tone: TONE.nong, prof: 'tip' });
    blot(L.dry, Hd[0] + hr * .5, Hd[1] - hr * 1.75, 1.35, .85, .4, 1, idx++);
  }

  // legs with foot blots
  const leg = (foot, tone) => {
    S([[stride * 2.4, -12], [foot[0] * .82, -6], [foot[0], foot[1]]], { w: 3.8, tone, dry: .18, prof: 'brush' });
    list.push({ blot: T([foot[0] + 1.4, foot[1] + .8]), r: 2.1, tone: TONE.nong });
  };
  leg([hemF[0] * .62, Math.min(0, hemF[1] * .18)], TONE.nong * .95);
  leg([hemB[0] * .62, Math.min(0, hemB[1] * .18)], TONE.zhong);

  for (const it of list) {
    const pi = clamp((p - (it.seed % 20) / 20 * .8) / .25);
    if (pi <= 0) continue;
    if (it.s) draw(L, mk(it.s, { ...it.o, seed: it.seed, gapLen: 5 }), clamp(pi) * am, 1);
    else if (it.blot) blot(L.dry, it.blot[0], it.blot[1], it.r * sc / 2.6, it.tone * am, .2, 1, it.seed);
    else mass(L.wet, it.m, it.a * am * clamp(pi), it.jit, it.seed, it.g);
  }

  const footF = T([hemF[0] * .62 + 1.4, 0]);
  const footB = T([hemB[0] * .62 + 1.4, 0]);
  const handF = P.aF ? T(P.aF[2]) : T([C[0] + 11, C[1] + 18]);
  const handB = P.aB ? T(P.aB[2]) : T([C[0] - 11, C[1] + 18]);
  return { handF, handB, feet: [footF, footB], head: T(Hd) };
}
