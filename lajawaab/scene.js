// scene.js — "Lajawaab": every frame, deterministic in t. World coords (y down); camera from story.camAt.
// The lift (0:37) removes ink to bare paper (emptiness is matter); the end returns to the opening framing.
import { mk, draw, mass, blot, TONE } from './ink.js';
import { mountainLayer, ripple } from './land.js';
import { figure, mixPose, POSE, VERM } from './figure.js';
import { seal } from './seal.js';
import { subtitle, inkText } from './subs.js';
import * as S from './story.js';
import { clamp, lerp, ss, eio, mulberry, vnoise } from '/core/lib.js';

const G = S.GROUND;
let MNT;

export function init() {
  MNT = mountainLayer({
    W: 4200, H: 460, x0: 0, depth: 420, tone: .15, rim: .55, mist: .65, seed: 7,
    ridge: x => 310 + 120 * Math.pow(Math.abs(Math.sin(x * .0016 + 1.2)), 1.7) + 70 * Math.sin(x * .0007 + 4) + 30 * vnoise(x * .004),
    xmask: x => clamp((x - 150) / 500) * clamp((4050 - x) / 500),
  });
}

// ---- small helpers ----
const t12 = t => Math.floor(t * 12) / 12;                       // figures on twos
const liftK = t => ss((t - 37) / 2);                            // ink lifting away
const rainK = t => clamp((t - 28) / .9) * (1 - clamp((t - 36.8) / .8));

function camXfSet(A, cam, p = 1) {
  A.xf(cam.z * p, 960 - cam.x * cam.z * p, 540 - cam.y * cam.z * p);
}

function drawThread(c, t, h1, h2, am = 1) {
  if (am <= 0) return;
  c.save(); c.strokeStyle = `rgba(${VERM.join(',')},${clamp(am * .92)})`;
  c.lineWidth = 3.8; c.lineCap = 'round';
  const vib = t > 30 && t < 40.2 ? (1 + Math.sin(t * 34) * .5) * (1 - ss((t - 39.4) / .8)) : 0;
  const snapped = t >= S.T.snap;
  const mx = (h1[0] + h2[0]) / 2, my = (h1[1] + h2[1]) / 2 + 34;
  const curve = (dx, dy) => {
    c.beginPath(); c.moveTo(h1[0], h1[1]);
    c.quadraticCurveTo(mx + dx, my + dy + Math.sin(t * 2.2) * 6, h2[0], h2[1]);
    c.stroke();
  };
  if (!snapped) {
    curve(0, vib * 3);
    if (vib > .05) { c.globalAlpha = .12 * vib; curve(0, -6 - vib * 3); c.globalAlpha = 1; }
  } else {
    const u = t - S.T.snap, d1 = u * 11, d2 = u * 17;
    c.beginPath(); c.moveTo(h1[0], h1[1]);
    c.quadraticCurveTo(lerp(h1[0], mx, .6), my + 20 + d1 * .4, mx - 60 - d1, my + 8 - d1 * 1.1);
    c.stroke();
    c.beginPath(); c.moveTo(h2[0], h2[1]);
    c.quadraticCurveTo(lerp(h2[0], mx, .6), my + 16 + d2 * .3, mx + 55 + d2, my - 6 - d2 * 1.3);
    c.stroke();
  }
  // knot dots at the anchors
  c.fillStyle = `rgba(${VERM.join(',')},${clamp(am * .8)})`;
  c.beginPath(); c.arc(h1[0], h1[1], 4.2, 0, 7); c.fill();
  c.beginPath(); c.arc(h2[0], h2[1], 4.2, 0, 7); c.fill();
  c.restore();
}

// the loose thread that survives into the ending, curling into the seal's shape
function threadCurl(c, t, am = 1) {
  if (am <= 0) return;
  const k = ss((t - 57) / 1.2);
  const cx = lerp(1050, 1122, k), cy = lerp(700, 648, k);
  c.save(); c.strokeStyle = `rgba(${VERM.join(',')},${clamp(am * .9)})`;
  c.lineWidth = lerp(3.8, 5, k); c.lineCap = 'round';
  const sway = Math.sin(t * 1.1) * (1 - k) * 14;
  c.beginPath();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = u * Math.PI * 2;
    const looseX = cx - 90 + u * 180 + sway * Math.sin(u * 4);
    const looseY = cy + Math.sin(u * Math.PI * 2.2) * 46 * (1 - k);
    const knotX = cx + Math.cos(a * 2) * 40 * Math.sin(a + .5) + Math.cos(a) * 22;
    const knotY = cy + Math.sin(a * 2) * 32 + Math.sin(a) * 18;
    const x = lerp(looseX, knotX, k), y = lerp(looseY, knotY, k);
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.stroke(); c.restore();
}

function bloomBlot(A, TMP, t, wx, wy, cam, drawFn) {
  TMP.clear();
  drawFn(TMP);
  const sx = 960 + (wx - cam.x) * cam.z, sy = 540 + (wy - cam.y) * cam.z;
  const u = clamp((t - S.T.bloom2[0]) / (S.T.bloom2[1] - S.T.bloom2[0]));
  const r = 24 + 320 * ss(u);
  for (const ctx of [TMP.cw, TMP.cd, TMP.cc]) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const a = i / 26 * Math.PI * 2, rad = r * (.72 + .5 * vnoise(i * 1.7 + 3));
      const x = sx + Math.cos(a) * rad, y = sy + Math.sin(a) * rad * .92;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  for (const [dst, src] of [[A.cw, TMP.cw], [A.cd, TMP.cd], [A.cc, TMP.cc]]) {
    dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.drawImage(src.canvas, 0, 0); dst.restore();
  }
}

// ---- poses ----
function walkPose(t, seedOff = 0) {
  const ph = ((t + seedOff) / .95) % 1;
  return mixPose(POSE.walkA, POSE.walkB, .5 - .5 * Math.cos(ph * Math.PI * 2));
}
function f1Pose(t) {
  const tt = t12(t);
  if (t >= 50.5) return mixPose(POSE.stand, POSE.slump, ss((t - 50.5) / .8));
  if ((t >= 12 && t < 17) || (t >= 20 && t < 37) || (t >= 45 && t < 52)) return walkPose(tt);
  return POSE.stand;
}
function f2Pose(t) {
  const tt = t12(t);
  if (t >= 43) return walkPose(tt, .45);
  if (t >= 42.6) return mixPose(POSE.stand, POSE.turnAway, ss((t - 42.6) / .6));
  if ((t >= 12 && t < 17) || (t >= 20 && t < 37)) return walkPose(tt, .45);
  return POSE.stand;
}

// ---- the frame ----
export function frame(t, A, B, TMP) {
  const cam = S.camAt(t);
  const lk = liftK(t);
  const keep = 1 - lk;

  // far mountains (slow parallax); soft mountain clones double as drifting mist
  A.cw.save(); A.cw.setTransform(cam.z * .55, 0, 0, cam.z * .85, 960 - cam.x * cam.z * .55, 540 - cam.y * cam.z * .85);
  A.cw.globalAlpha = .9 * keep; A.cw.drawImage(MNT, 0, 240); A.cw.restore();
  A.cw.save(); A.cw.setTransform(cam.z * .68, 0, 0, cam.z * 1.05, 960 - cam.x * cam.z * .68, 540 - cam.y * cam.z * 1.05);
  A.cw.globalAlpha = .38 * keep; A.cw.drawImage(MNT, -300, 330); A.cw.restore();
  // mist swallow (43–49): a large soft range drifts over her
  const swallowK = clamp((t - 43) / 4) * (1 - clamp((t - 49.5) / 3.5));
  if (swallowK > 0) {
    A.cw.save(); A.cw.setTransform(cam.z * 1.5, 0, 0, cam.z * 2.1, 960 - cam.x * cam.z * 1.5, 540 - cam.y * cam.z * 2.1);
    A.cw.globalAlpha = .5 * swallowK; A.cw.drawImage(MNT, -200, 330); A.cw.restore();
  }

  camXfSet(A, cam);
  const L = A.ink;
  {
    // bank: pale wash + broken edge strokes + dry ground marks
    mass(A.cw, [[150, 812], [1400, 802], [2600, 812], [3400, 824], [3400, 905], [150, 896]], TONE.dan * .55 * keep, 18, 4, [0, 805, 0, 905, .25, 1]);
    for (let i = 0; i < 5; i++) {
      const gx = 200 + i * 640;
      draw(L, mk([[gx, 852 + (i % 2) * 9], [gx + 240, 862 + (i % 3) * 7], [gx + 470 - (i % 2) * 60, 856 + (i % 2) * 10]], { w: 5.5, tone: (.24 + .1 * (i % 3)) * keep, dry: .55, prof: 'tip', seed: 30 + i }), 1, 1);
    }
    for (let i = 0; i < 3; i++) {
      const gx = 350 + i * 1050;
      draw(L, mk([[gx, 880], [gx + 380, 888], [gx + 720, 882]], { w: 7, tone: TONE.nong * .5 * keep, dry: .3, prof: 'robe', darkDir: [0, 1], seed: 17 + i }), 1, 1);
    }
    // water: blank paper + faint streaks + rings at footfalls
    draw(L, mk([[300, 985], [1200, 995], [2300, 985]], { w: 5, tone: TONE.qing * .8 * keep, dry: .8, prof: 'even', seed: 22 }), 1, 1);
    draw(L, mk([[1500, 1042], [2400, 1050], [3300, 1038]], { w: 5, tone: TONE.qing * .7 * keep, dry: .8, prof: 'even', seed: 23 }), 1, 1);
    for (const [who, x] of [[0, S.f1X], [1, S.f2X]]) {
      const win = who ? [[12, 17], [20, 37], [43, 49]] : [[12, 17], [20, 37], [45, 52]];
      for (const [a, b] of win) {
        const t0 = Math.ceil(a * 1.05) / 1.05;
        for (let tt = t0; tt < b; tt += 1.05) {
          if (t < tt || t > tt + 2.4) continue;
          const age = t - tt, r = 16 + 46 * Math.pow(age / 2.4, .6);
          ripple(L, x(tt), G + 8, r, (.3 - .12 * (age / 2.4)) * keep, tt * 7, .2, 3);
        }
      }
    }
    // a small grass tuft at the near bank (bottom-left)
    for (let i = 0; i < 3; i++) {
      const bx = 360 + i * 26;
      draw(L, mk([[bx, G + 34], [bx + 14 - i * 9, G - 12], [bx + 28 - i * 16, G - 66 - i * 15]], { w: 3.4, tone: (.5 + .1 * i) * keep, dry: .45, prof: 'tip', seed: 60 + i }), 1, 1);
    }

    // weather: a dark storm mass hanging from the top (the mountain range inverted — organic edge)
    const mk1 = clamp((t - 30) / 2.2) * keep;
    if (mk1 > 0) {
      A.cw.save();
      A.cw.setTransform(cam.z * .85, 0, 0, -cam.z * .85, 960 - cam.x * cam.z * .85, -150);
      A.cw.globalAlpha = .42 * mk1;
      A.cw.drawImage(MNT, -250, 0);
      A.cw.restore();
      A.cw.save();
      A.cw.setTransform(cam.z * 1.15, 0, 0, -cam.z * 1.15, 960 - cam.x * cam.z * 1.15, -80);
      A.cw.globalAlpha = .3 * mk1;
      A.cw.drawImage(MNT, 600, 0);
      A.cw.restore();
    }
    const rk = rainK(t) * keep;
    if (rk > 0) {
      const rr = mulberry(31);
      for (let i = 0; i < 64; i++) {
        const x0 = -200 + rr() * 3600, y0 = rr() * 1150;
        const y = ((y0 + (t - 28) * 320) % 1150) - 60;
        draw(L, mk([[x0, y], [x0 + 26, y + 78]], { w: 2.6, tone: (.16 + rr() * .2) * rk, dry: .65, prof: 'tip', seed: 100 + i }), 1, 1);
      }
    }
  }

  // figures + thread (never lifted)
  const f1k = t >= 2.1 ? clamp((t - S.T.f1Paint[0]) / (S.T.f1Paint[1] - S.T.f1Paint[0])) : 0;
  const f1evap = t >= 52 ? 1 - ss((t - 52) / 5) : 1;
  const f1P = f1Pose(t), f2P = f2Pose(t);
  const dir1 = (t >= 30 && t < 37) || (t >= 45 && t < 52) ? -1 : 1;
  const dir2 = t < 20 ? -1 : 1;
  {
    let h1 = [S.f1X(t), G - 50], h2 = [S.f2X(t), G - 50];
    if (f1k > 0) {
      const r = figure(L, f1P, { x: S.f1X(t), y: G, s: 2.4, dir: dir1, am: 1, seed: 7, p: f1k * f1evap, boil: t12(t) * 12, dark: .75, hair: 0 });
      h1 = r.handF;
    }
    const f2am = t >= 47 ? 1 - ss((t - 47) / 2) : 1;
    if (t >= S.T.bloom2[0] && f2am > 0) {
      const draw2 = (LW) => figure(LW.ink, f2P, { x: S.f2X(t), y: G, s: 2.3, dir: dir2, am: f2am, seed: 12, p: clamp((t - S.T.f2Paint[0]) / (S.T.f2Paint[1] - S.T.f2Paint[0])), boil: t12(t) * 12 + 2, dark: .3, hair: 1 });
      if (t < S.T.bloom2[1]) {
        bloomBlot(A, TMP, t, S.f2X(t) + 6, G - 78, cam, (LW) => { h2 = draw2(LW).handF; });
      } else h2 = draw2(A).handF;
    }
    if (t >= S.T.tie[0] && t < 52) drawThread(A.cc, t, h1, h2, clamp((t - S.T.tie[0]) / .8));
    if (t >= 52 && t < S.T.stamp + .4) threadCurl(A.cc, t, 1 - clamp((t - S.T.stamp) / .3));
  }

  // the brush opening: broad strokes fill the frame, then lift
  if (t < S.T.brushLift[1]) {
    const pAll = clamp(t / 1.2), am = 1 - clamp((t - S.T.brushLift[0]) / (S.T.brushLift[1] - S.T.brushLift[0]));
    const bs = [
      mk([[-300, 260], [700, 420], [1700, 560], [2300, 640]], { w: 270, tone: TONE.zhong, dry: .3, prof: 'fan', seed: 1, rough: .3, nb: 10 }),
      mk([[2300, 300], [1400, 520], [500, 700], [-250, 820]], { w: 190, tone: TONE.dan, dry: .38, prof: 'fan', seed: 2, rough: .32, nb: 9 }),
      mk([[-250, 980], [800, 900], [1900, 830], [2350, 800]], { w: 120, tone: TONE.nong, dry: .45, prof: 'brush', seed: 3, rough: .35, nb: 8 }),
    ];
    for (let i = 0; i < 3; i++) draw(L, bs[i], clamp((pAll * 3) - i * .7), am);
    blot(A.cw, 1500, 420, 34 * am, .5 * am, .6, 1.2, 5);
    blot(A.cw, 620, 660, 22 * am, .45 * am, .3, 1, 9);
  }

  // screen space: title column, inscriptions, end card
  const kTitle = Math.min(clamp((t - S.T.title[0]) / .35), clamp((S.T.title[1] - t) / .4));
  if (kTitle > 0) {
    'LAJAWAAB'.split('').forEach((ch, i) => {
      inkText(A, ch, 195, 165 + i * 84, kTitle, { font: '600 62px CormorantSC', tracking: '0px', rot: Math.PI / 2, align: 'left' });
    });
    seal(A.cc, 152, 872, 52, kTitle * .95, 12);
  }
  for (const s of S.SUBS) {
    const k = Math.min(clamp((t - s.t0) / .35), clamp((s.t1 - t) / .4));
    subtitle(A, s.text, s.x, s.y, k, { size: s.size });
  }
  if (t >= S.T.card[0]) {
    const k = clamp((t - S.T.card[0]) / .5);
    inkText(A, 'LAJAWAAB', 960, 480, k, { font: '600 68px CormorantSC', tracking: '14px' });
    inkText(A, 'an ink-wash visualizer', 960, 556, Math.min(k, clamp((t - 58.4) / .5)), { font: 'italic 500 34px Cormorant', tracking: '2px', alpha: .85 });
    inkText(A, 'for Aditya Rikhari', 960, 616, Math.min(k, clamp((t - 58.6) / .5)), { font: 'italic 500 30px Cormorant', tracking: '2px', alpha: .75 });
    const kc = Math.min(k, clamp((t - 58.8) / .5));
    inkText(A, 'performed, composed and written by Aditya Rikhari', 960, 726, kc, { font: 'italic 500 22px Cormorant', tracking: '1px', alpha: .62 });
    inkText(A, 'produced by Aditya Rikhari and Akhilesh Khandelwal', 960, 758, kc, { font: 'italic 500 22px Cormorant', tracking: '1px', alpha: .62 });
    inkText(A, 'a CollabX Productions / Homegrown Music / Atlantic Records release', 960, 790, kc, { font: 'italic 500 20px Cormorant', tracking: '1px', alpha: .55 });
    const ks = ss((t - S.T.stamp) / .25);
    if (ks > 0) {
      const sz = 86 * (1.14 - .14 * ss((t - S.T.stamp) / .35));
      A.cc.save(); A.cc.setTransform(1, 0, 0, 1, 0, 0); seal(A.cc, 1218, 428, sz, ks, 5); A.cc.restore();
    }
  }

  const shakeAmp = t > 30 && t < 37.6 ? 1.2 + 2.2 * (1 - (t - 30) / 7.6) : 0;
  return {
    paper: [cam.x * cam.z - 960, cam.y * cam.z - 540, cam.z],
    bleed: 6, rim: .8, vig: .22, warm: .5,
    shake: shakeAmp ? [vnoise(t * 11) * shakeAmp, vnoise(t * 11 + 50) * shakeAmp] : [0, 0],
  };
}
