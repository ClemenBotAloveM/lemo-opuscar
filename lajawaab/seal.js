// seal.js — own design: a 白文 (white-on-vermilion) square seal carrying an interlocking knot (同心结),
// the shape the film's red thread curls into at the end. Drawn, never sampled.
import { VERM } from './figure.js';

export function seal(c, x, y, sz, alpha = 1, seed = 1) {
  if (alpha <= 0) return;
  const r = sz * .06;
  c.save();
  c.translate(x, y);
  c.globalAlpha = Math.min(1, alpha);
  // slightly irregular square (hand-cut stone)
  c.fillStyle = `rgb(${VERM.join(',')})`;
  c.beginPath();
  const pts = [[-sz / 2, -sz / 2], [sz / 2, -sz / 2], [sz / 2, sz / 2], [-sz / 2, sz / 2]];
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4];
    const j1 = Math.sin(seed * 7.3 + i * 2.1) * sz * .015;
    i ? c.lineTo(a[0] + j1, a[1] - j1) : c.moveTo(a[0] + j1, a[1] - j1);
    c.quadraticCurveTo((a[0] + b[0]) / 2 + Math.sin(seed + i * 5) * sz * .03, (a[1] + b[1]) / 2 + Math.cos(seed + i * 3) * sz * .03, b[0], b[1]);
  }
  c.closePath(); c.fill();
  // the knot: two interlocking rings (同心结), white (the paper showing through)
  c.strokeStyle = '#F2ECDE';
  c.lineWidth = sz * .085;
  c.lineCap = 'round';
  const u = sz * .185;
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.ellipse(sx * u * .82, u * .22, u * .92, u * 1.02, sx * .35, 0, Math.PI * 2);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(0, -u * 1.62); c.lineTo(0, -u * 1.1);
  c.moveTo(0, u * 1.66); c.lineTo(0, u * 1.18);
  c.stroke();
  c.restore();
}
